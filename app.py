from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
import pandas as pd
import sqlite3

load_dotenv()
from datetime import datetime
import google.generativeai as genai
import json
from db_manager import list_databases, create_database, list_tables, execute_sql, execute_readonly_sql, replace_table
from rag_manager import RAGManager

# Initialize RAG
rag = RAGManager()

app = Flask(__name__)
# Permit local Vite development by default; add deployed frontend origins via CORS_ORIGINS.
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
CORS(app, resources={r"/api/*": {"origins": cors_origins}})
# Keep Flask sessions stable across restarts; never generate a different key per process.
app.secret_key = os.getenv("NEXUS_SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("NEXUS_SECRET_KEY must be set in the environment")

# Configure Gemini
# Configure Gemini with Multi-Key Support
API_KEYS = []
main_key = os.getenv('GOOGLE_API_KEY')
if main_key:
    API_KEYS.append(main_key)

# Load additional keys (GOOGLE_API_KEY_2, _3, etc.)
for i in range(2, 10):
    key = os.getenv(f'GOOGLE_API_KEY_{i}')
    if key:
        API_KEYS.append(key)

if not API_KEYS:
    print("Warning: No GOOGLE_API_KEYs found.")
else:
    print(f"Loaded {len(API_KEYS)} API keys.")

current_key_index = 0

def configure_genai(key_index=None):
    global current_key_index
    if not API_KEYS:
        return
    
    if key_index is not None:
        target_index = key_index % len(API_KEYS)
    else:
        target_index = current_key_index
        
    current_key_index = target_index
    genai.configure(api_key=API_KEYS[current_key_index])
    print(f"Configured Gemini with API Key #{current_key_index + 1}")

def rotate_key():
    global current_key_index
    current_key_index = (current_key_index + 1) % len(API_KEYS)
    configure_genai(current_key_index)

# Initial Configuration
configure_genai(0)

# Model configuration
# Model configuration
generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}
SYSTEM_INSTRUCTION = """
You are Nexus, an elite AI Data Analyst and Database Architect.
Your mission is to empower users with deep insights, precise data manipulation, and automated reporting.

### CORE CAPABILITIES
You have read-only access to a **SQLite** database through the `run_sql` tool. Use SELECT, WITH, and safe schema-inspection PRAGMA statements only. Never attempt INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, ATTACH, or other data/schema modifications.
Do not ask the user for data if you can query it yourself.

### OPERATIONAL PROTOCOL (ReAct)
1.  **Analyze**: Understand the user's intent. Is it a query? A modification? A report request?
2.  **Explore**: If you don't know the table structure, run `SELECT name FROM sqlite_master WHERE type='table';` or `PRAGMA table_info(table_name);`. **NEVER GUESS COLUMN NAMES.**
3.  **Plan**: Formulate the correct SQLite query.
    *   *Dates*: SQLite stores dates as strings (YYYY-MM-DD). Use `strftime` for extractions (e.g., `strftime('%Y', date_col)`).
    *   *Matching*: Use `LIKE '%term%'` for fuzzy search. `COLLATE NOCASE` for case-insensitive comparison.
    *   *Limits*: Always use `LIMIT` for large tables unless aggregating.
4.  **Execute**: Use read-only SELECT/CTE queries through the `run_sql` tool. Never attempt data or schema mutations.
5.  **Synthesize**: Interpret the results for the user. Be concise but insightful.

### SQL BEST PRACTICES (SQLite)
*   **List Tables**: `SELECT name FROM sqlite_master WHERE type='table';`
*   **Schema**: `PRAGMA table_info(table_name);`
*   **Date Grouping**: `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) FROM orders GROUP BY month;`
*   **Safe Updates**: Always `SELECT` before `DELETE` or `UPDATE` to verify target rows if unsure.

### FEW-SHOT EXAMPLES (Generic)

**User**: "Show me the top items."
**Nexus**:
*Thought*: I need to check the tables first.
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

**(System returns: `['table_a', 'table_b']`)**

**Nexus**:
*Thought*: I see the tables. I'll check columns.
```sql
PRAGMA table_info(table_a);
```

### RESPONSE STYLE
*   **Professional & Crisp**: Avoid fluff. Get straight to the data.
*   **Visuals**: Use Markdown tables for small result sets.
*   **Proactive**: If you see an interesting trend, mention it.

### ORDER CONSISTENCY RULE
When a user asks a follow-up question about previously returned results (e.g., "What are the names of these books?", "Give me their titles"), 
you MUST maintain the EXACT SAME ORDER as the previous result set.
If the previous query returned ISBNs in a specific order, the follow-up query about those same records MUST return data in the same order.
Use ORDER BY clauses matching the previous query's sorting if needed, or explicitly order by the values from the previous result.
"""

def get_model(model_name="gemini-2.5-flash"):
    return genai.GenerativeModel(
        model_name=model_name,
        generation_config=generation_config,
        system_instruction=SYSTEM_INSTRUCTION
    )

def try_generate_content(prompt, preferred_model="gemini-2.5-flash", history=None):
    """
    Tries to generate content with the preferred model.
    If it fails with a quota error (429), falls back to a lighter model.
    Returns: (response_text, model_used)
    """
    # Map legacy/invalid model names to valid ones
    model_mapping = {
        "gemini-1.5-flash": "gemini-flash-latest",
        "gemini-1.5-pro": "gemini-pro-latest"
    }
    
    if preferred_model in model_mapping:
        preferred_model = model_mapping[preferred_model]

    # Define fallback hierarchy
    models_to_try = [preferred_model]
    
    # Fallback chain
    fallback_chain = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash"
    ]
    
    # Add fallbacks
    for model in fallback_chain:
        if model != preferred_model and model not in models_to_try:
            models_to_try.append(model)
    
    last_error = None
    import time
    
    for i, model_name in enumerate(models_to_try):
        try:
            print(f"Trying model: {model_name}")
            model = get_model(model_name)
            
            if history:
                chat = model.start_chat(history=history)
                response = chat.send_message(prompt)
            else:
                response = model.generate_content(prompt)
                
            return response.text if hasattr(response, 'text') else str(response), model_name
            
        except Exception as e:
            print(f"Error with {model_name}: {type(e).__name__} - {e}")
            error_str = str(e).lower()
            is_quota = "429" in error_str or "quota" in error_str or "resource exhausted" in error_str or "overloaded" in error_str
            is_auth = "400" in error_str or "key" in error_str or "invalid" in error_str or "expired" in error_str or "unauthorized" in error_str
            is_not_found = "404" in error_str or "not found" in error_str
            
            if is_quota or is_auth or is_not_found:
                last_error = e
                print(f"API Error detected ({error_str}). Rotating/Skipping...")
                if not is_not_found:
                    rotate_key()
                time.sleep(1)
                continue 
            else:
                raise e 
                
    raise last_error or Exception("All models failed")

@app.route('/')
def index():
    return render_template('index.html')

from tool_definitions import sql_tools
from google.protobuf import struct_pb2
import time

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        return jsonify(rag.memory)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json
        query = data.get('query')
        sql = data.get('sql')
        rating = data.get('rating') # 1 or -1
        
        if not query or not sql or rating is None:
            return jsonify({'error': 'Missing fields'}), 400
            
        rag.add_feedback(query, sql, rating)
        return jsonify({'status': 'success', 'rating': rating})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message', '')
        database_name = request.json.get('database', 'phonetest') # Default to phonetest
        preferred_model = request.json.get('model', 'gemini-2.0-flash-exp')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # RAG Retrieval
        rag_context = ""
        try:
            similar_queries = rag.find_similar(user_message)
            if similar_queries:
                rag_context = "\n### RELEVANT PAST EXAMPLES (NEURAL MEMORY)\n"
                for item in similar_queries:
                    rag_context += f"- User: {item['query']}\n  SQL: {item['sql']}\n"
        except Exception as e:
            print(f"RAG Error: {e}")

        # Get or create chat session
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        # Construct System Prompt (Nexus Persona)
        # Get actual schema context
        try:
            tables = list_tables(database_name)
            schema_summary = f"Tables in '{database_name}': {', '.join(tables)}\n"
            for table in tables:
                # Get columns for each table
                res = execute_sql(database_name, f"PRAGMA table_info(\"{table}\")")
                if 'rows' in res:
                    cols = [r['name'] for r in res['rows']]
                    schema_summary += f"- Table '{table}': {', '.join(cols)}\n"
        except Exception as e:
            print(f"Schema fetch error: {e}")
            schema_summary = "Could not fetch schema automatically. Use list_tables() to find out."

        # Construct System Prompt (Nexus Persona)
        system_instruction = f"""
        You are Nexus, an elite AI Data Analyst and Database Architect.
        Your mission is to empower users with deep insights, precise data manipulation, and automated reporting.
        
        ### CURRENT DATABASE CONTEXT
        You are connected to the SQLite database: '{database_name}'. The run_sql tool is read-only; use SELECT/CTE and safe schema inspection only. Do not attempt mutations.
        
        ### ACTUAL DATABASE SCHEMA (Do not hallucinate others)
        {schema_summary}
        
        ### OPERATIONAL PROTOCOL
        1.  **Analyze**: Understand the user's intent.
        2.  **Explore**: The schema is provided above. USE IT. Do not assume tables exist.
        3.  **Plan**: Formulate the correct SQLite query.
        4.  **Execute**: Use `run_sql` for read-only SELECT/CTE queries only. Never mutate the database.
        5.  **Synthesize**: Interpret the results.
        
        ### TOOLS
        - `run_sql(sql, database)`: Executes a SQL query.
        - `list_tables(database)`: Lists all tables.
        
        {rag_context}
        """

        # Convert session history to Gemini format
        history = []
        for msg in session['chat_history']:
            role = "user" if msg['role'] == 'user' else "model"
            history.append({
                "role": role,
                "parts": [msg['content']]
            })

        # --- Tool Execution Loop with Retry ---
        
        models_list = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash"
        ]
        max_total_attempts = 20 # 5 models * 4 keys
        attempt = 0
        last_error = None
        start_time = time.time()
        sql_executed = None
        data_summary = None
        final_response_text = ""
        
        while attempt < max_total_attempts:
            model_name = models_list[attempt % len(models_list)]
            print(f"Attempt {attempt + 1}/{max_total_attempts}: Trying model {model_name} with Key #{current_key_index + 1}")
            
            try:
                # 1. Initialize Chat with Tools
                model = genai.GenerativeModel(
                    model_name=model_name,
                    tools=[sql_tools],
                    system_instruction=system_instruction
                )
                
                chat_session = model.start_chat(history=history)
                
                # 2. Send User Message
                response = chat_session.send_message(user_message)
                
                final_response_text = ""
                sql_executed = None
                data_summary = None
                
                # 3. Handle Function Calls (Loop)
                while True:
                    part = response.parts[0]
                    
                    if part.function_call:
                        fc = part.function_call
                        fn_name = fc.name
                        fn_args = dict(fc.args)
                        
                        print(f"🤖 Model wants to call: {fn_name}({fn_args})")
                        
                        # Execute function
                        function_result = {}
                        if fn_name == 'run_sql':
                            sql_executed = fn_args.get('sql')
                            if 'database' not in fn_args:
                                fn_args['database'] = database_name
                            result = execute_readonly_sql(fn_args['database'], fn_args['sql'])
                            function_result = result
                            
                            # Process result for summary
                            if 'rows' in result:
                                row_count = len(result['rows'])
                                if row_count > 0:
                                    formatted_rows = [" | ".join([str(val) for val in row.values()]) for row in result['rows']]
                                    data_summary = "\n".join(formatted_rows[:10])
                                    if row_count > 10:
                                        data_summary += f"\n... ({row_count - 10} more)"
                                else:
                                    data_summary = "No results found."
                            elif 'error' in result:
                                data_summary = f"Error: {result['error']}"

                        elif fn_name == 'list_tables':
                            if 'database' not in fn_args:
                                fn_args['database'] = database_name
                            tables = list_tables(fn_args['database'])
                            function_result = {"tables": tables}
                        
                        # Send result back
                        response = chat_session.send_message(
                            genai.protos.Content(
                                parts=[genai.protos.Part(
                                    function_response=genai.protos.FunctionResponse(
                                        name=fn_name,
                                        response=function_result
                                    )
                                )]
                            )
                        )
                    else:
                        final_response_text = response.text
                        break
                
                # If we get here, success!
                break
                
            except Exception as e:
                print(f"Error with {model_name}: {e}")
                error_str = str(e).lower()
                is_quota = "429" in error_str or "quota" in error_str or "resource exhausted" in error_str
                is_auth = "401" in error_str or "403" in error_str or "unauthorized" in error_str or "permission denied" in error_str
                is_not_found = "404" in error_str or "not found" in error_str
                
                if is_quota or is_auth or is_not_found:
                    print(f"API Error ({error_str}) for {model_name}. Rotating/Skipping...")
                    if not is_not_found:
                         rotate_key()
                    
                    time.sleep(1) 
                    last_error = e
                    attempt += 1
                    continue
                else:
                    raise e
        
        if last_error:
            raise last_error
        
        # --- End Loop ---
        
        execution_time = time.time() - start_time

        # RAG Learning: Save successful query
        if sql_executed and data_summary and "Error" not in data_summary:
            try:
                rag.add_to_memory(user_message, sql_executed, execution_time=execution_time)
            except Exception as e:
                print(f"Failed to save to memory: {e}")

        # Update session history (Append the final exchange)
        session['chat_history'].append({'role': 'user', 'content': user_message})
        session['chat_history'].append({'role': 'model', 'content': final_response_text})
        session.modified = True

        # Construct Structured Response for Frontend
        structured_response = {
            "thought_process": ["Used native tools to query database."],
            "response": final_response_text,
            "sql": sql_executed,
            "actions": []
        }
        
        return jsonify(structured_response)
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        tb = traceback.format_exc()
        print(f"Error: {error_msg}")
        print(tb)
        
        with open('error_log.txt', 'a', encoding='utf-8') as f:
            f.write(f"\n{'='*50}\nTIME: {time.ctime()}\nERROR: {error_msg}\nTRACEBACK:\n{tb}\n{'='*50}\n")
            
        # Fallback to simple text if tool loop fails
        # Fallback to simple text if tool loop fails
        return jsonify({
            "thought_process": ["Error with tools, falling back."],
            "response": f"I encountered an error processing your request: {error_msg}. Please check the server logs for more details.",
            "sql": None
        }), 500

@app.route('/api/feedback', methods=['POST'])
def feedback():
    try:
        data = request.json
        query = data.get('query')
        sql = data.get('sql')
        rating = data.get('rating') # 1 for up, -1 for down
        
        if not query or not sql or rating is None:
            return jsonify({'error': 'Missing data'}), 400
            
        rag.add_feedback(query, sql, rating)
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Feedback error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/<db_name>', methods=['POST'])
def auto_analyze(db_name):
    try:
        # Get schema
        tables = list_tables(db_name)
        schema_info = {}
        for table in tables:
            # Get first row to infer columns/types
            res = execute_sql(db_name, f"SELECT * FROM \"{table}\" LIMIT 1")
            if 'columns' in res:
                schema_info[table] = res['columns']
        
        prompt = f"""
        Analyze this database schema: {json.dumps(schema_info)}
        
        Provide a summary of what this data represents and suggest 3 interesting questions the user could ask.
        Return as JSON:
        {{
            "summary": "...",
            "suggested_questions": ["Q1", "Q2", "Q3"]
        }}
        """
        
        raw_text, _ = try_generate_content(prompt)
        clean_text = raw_text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(clean_text))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate_report', methods=['POST'])
def generate_report():
    try:
        db_name = request.json.get('database')
        preferred_model = request.json.get('model', 'gemini-2.0-flash-exp')
        
        if not db_name:
            return jsonify({'error': 'Database name required'}), 400

        # Get schema
        tables = list_tables(db_name)
        schema_context = f"Database: {db_name}\n"
        for table in tables:
            res = execute_sql(db_name, f"PRAGMA table_info(\"{table}\")")
            if 'rows' in res:
                cols = [r['name'] for r in res['rows']]
                schema_context += f"- Table '{table}': {', '.join(cols)}\n"
                
                # Get sample data
                sample = execute_sql(db_name, f"SELECT * FROM \"{table}\" LIMIT 3")
                if 'rows' in sample:
                    schema_context += f"  Sample: {str(sample['rows'])}\n"

        prompt = f"""
        Analyze this database schema and sample data:
        {schema_context}
        
        Generate a comprehensive professional report.
        
        Requirements:
        1.  **Title**: A professional title for the report.
        2.  **Executive Summary**: A detailed 2-3 paragraph summary of the data, highlighting key trends, anomalies, and business insights. Use markdown formatting (bolding, lists).
        3.  **Key Insights**: A list of 5-7 specific, actionable insights derived from the data.
        4.  **Charts**: Generate 4-6 diverse charts to visualize the data.
            -   You MUST use a mix of chart types: 'bar', 'line', 'pie', 'area', 'scatter', 'radar'.
            -   For 'scatter', ensure you select two numerical columns.
            -   For 'radar', suitable for comparing multiple metrics across categories.
            -   Provide the SQL query to fetch the data for each chart.
            -   Provide a brief description for each chart.
            
        Output Format (JSON):
        You must return ONLY the JSON object. Do not include any conversational text, markdown formatting (like ```json), or explanations outside the JSON.
        {{
            "report_title": "...",
            "executive_summary": "...",
            "key_insights": ["...", "..."],
            "charts": [
                {{
                    "title": "...",
                    "type": "bar|line|pie|area|scatter|radar",
                    "sql": "SELECT ...",
                    "description": "...",
                    "x_axis": "column_name",
                    "y_axis": "column_name"
                }}
            ]
        }}
        """
        
        raw_text, model_used = try_generate_content(prompt, preferred_model)
        
        clean_text = raw_text.replace('```json', '').replace('```', '').strip()
        try:
            report_data = json.loads(clean_text)
        except json.JSONDecodeError as je:
            print(f"JSON Decode Error: {je}")
            print(f"Failed JSON content: {clean_text}")
            raise je
        
        # Execute chart queries
        for chart in report_data.get('charts', []):
            try:
                res = execute_sql(db_name, chart['sql'])
                if 'rows' in res:
                    chart['data'] = [dict(row) for row in res['rows']]
                else:
                    chart['data'] = []
            except Exception as e:
                print(f"Chart query error: {e}")
                chart['error'] = str(e)
                chart['data'] = []
                
        return jsonify(report_data)

    except Exception as e:
        print(f"Report generation error: {e}")
        return jsonify({'error': str(e)}), 500




@app.route('/api/upload_csv', methods=['POST'])
def upload_csv():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        db_name = request.form.get('db_name', 'default')
        table_name = request.form.get('table_name', file.filename.split('.')[0])
        
        # Try to read file based on extension
        try:
            if file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                # CSV handling
                try:
                    df = pd.read_csv(file)
                except pd.errors.ParserError as pe:
                    file.seek(0)
                    try:
                        df = pd.read_csv(file, on_bad_lines='skip')
                        print(f"Warning: Skipped some malformed lines in {file.filename}")
                    except Exception:
                        file.seek(0)
                        try:
                            df = pd.read_csv(file, error_bad_lines=False)
                        except Exception:
                            return jsonify({
                                'error': 'CSV parsing failed. The file has inconsistent columns or malformed data.',
                                'details': str(pe)
                            }), 400
                except UnicodeDecodeError:
                    file.seek(0)
                    try:
                        df = pd.read_csv(file, encoding='latin1')
                    except Exception as e:
                        return jsonify({'error': f'Encoding error: {str(e)}'}), 400
        except Exception as e:
            return jsonify({'error': f'Failed to parse file: {str(e)}'}), 400
        
        # Clean column names
        df.columns = df.columns.astype(str).str.strip()
        df = df.dropna(how='all')
        
        # Convert to list of dicts
        columns = list(df.columns)
        rows = df.to_dict('records')
        
        # Save to DB
        create_database(db_name)
        res = replace_table(db_name, table_name, columns, rows)
        
        if 'error' in res:
            return jsonify({'error': res['error']}), 500
        
        return jsonify({
            'status': 'success', 
            'rows': len(rows), 
            'columns': len(columns),
            'table': table_name,
            'message': f'Successfully uploaded {len(rows)} rows with {len(columns)} columns'
        })
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    db_name = request.args.get('db_name')
    if not db_name:
        return jsonify({'error': 'db_name required'}), 400
        
    try:
        tables = list_tables(db_name)
        table_stats = []
        total_rows = 0
        
        for table in tables:
            # Get row count
            count_res = execute_sql(db_name, f"SELECT COUNT(*) as count FROM \"{table}\"")
            row_count = 0
            if 'rows' in count_res and len(count_res['rows']) > 0:
                row_count = count_res['rows'][0]['count']
            
            # Get column count
            col_res = execute_sql(db_name, f"PRAGMA table_info(\"{table}\")")
            col_count = 0
            if 'rows' in col_res:
                col_count = len(col_res['rows'])
                
            table_stats.append({
                'name': table,
                'rows': row_count,
                'columns': col_count
            })
            total_rows += row_count
            
        return jsonify({
            'tables': table_stats,
            'totalRows': total_rows,
            'totalTables': len(tables),
            'dbName': db_name
        })
    except Exception as e:
        print(f"Analytics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases', methods=['GET'])
def api_list_databases():
    try:
        dbs = list_databases()
        return jsonify({'databases': dbs})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases', methods=['POST'])
def api_create_database():
    body = request.json or {}
    name = body.get('name')
    if not name:
        return jsonify({'error': 'name required'}), 400
    res = create_database(name)
    if res == 'exists':
        return jsonify({'status': 'exists'})
    return jsonify({'status': 'created'})

@app.route('/api/databases/<db_name>/tables', methods=['GET'])
def api_list_tables(db_name):
    try:
        tables = list_tables(db_name)
        return jsonify({'tables': tables})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<db_name>/query', methods=['POST'])
def api_query(db_name):
    body = request.json or {}
    sql = body.get('sql')
    if not sql:
        return jsonify({'error': 'sql required'}), 400
    res = execute_sql(db_name, sql)
    return jsonify(res)

@app.route('/api/databases/<db_name>/tables/<table_name>/rows', methods=['GET'])
def api_table_rows(db_name, table_name):
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        sort_by = request.args.get('sort_by')
        order = request.args.get('order', 'asc').upper()
        offset = (page - 1) * limit
        
        # Get total count
        count_res = execute_sql(db_name, f"SELECT COUNT(*) as count FROM \"{table_name}\"")
        total_rows = 0
        if 'rows' in count_res and len(count_res['rows']) > 0:
            total_rows = count_res['rows'][0]['count']
            
        # Get paginated data with sorting
        sql = f"SELECT * FROM \"{table_name}\""
        
        if sort_by:
            # Validate order
            if order not in ['ASC', 'DESC']:
                order = 'ASC'
            # Add sorting
            sql += f" ORDER BY \"{sort_by}\" {order}"
            
        sql += f" LIMIT {limit} OFFSET {offset}"
        
        res = execute_sql(db_name, sql)
        
        if 'error' in res:
            return jsonify(res), 500
            
        return jsonify({
            "rows": res.get('rows', []),
            "columns": res.get('columns', []),
            "total": total_rows,
            "page": page,
            "limit": limit,
            "pages": (total_rows + limit - 1) // limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<db_name>/tables/<table_name>/search', methods=['GET'])
def api_table_search(db_name, table_name):
    """Search all columns in a table for matching rows"""
    try:
        q = request.args.get('q', '').strip()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        sort_by = request.args.get('sort_by')
        order = request.args.get('order', 'asc').upper()
        offset = (page - 1) * limit
        
        if not q:
            # No search term, return empty
            return jsonify({
                "rows": [],
                "columns": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "pages": 0
            })
        
        # Get column names for this table
        col_res = execute_sql(db_name, f"PRAGMA table_info(\"{table_name}\")")
        if 'error' in col_res:
            return jsonify(col_res), 500
            
        columns = [row['name'] for row in col_res.get('rows', [])]
        
        if not columns:
            return jsonify({'error': 'Table has no columns'}), 400
        
        # Build WHERE clause to search all columns
        search_term = q.replace("'", "''")  # Escape single quotes
        where_clauses = [f"\"{col}\" LIKE '%{search_term}%'" for col in columns]
        where_sql = " OR ".join(where_clauses)
        
        # Get total count of matching rows
        count_sql = f"SELECT COUNT(*) as count FROM \"{table_name}\" WHERE {where_sql}"
        count_res = execute_sql(db_name, count_sql)
        total_rows = 0
        if 'rows' in count_res and len(count_res['rows']) > 0:
            total_rows = count_res['rows'][0]['count']
        
        # Build main query
        sql = f"SELECT * FROM \"{table_name}\" WHERE {where_sql}"
        
        if sort_by and sort_by in columns:
            if order not in ['ASC', 'DESC']:
                order = 'ASC'
            sql += f" ORDER BY \"{sort_by}\" {order}"
            
        sql += f" LIMIT {limit} OFFSET {offset}"
        
        res = execute_sql(db_name, sql)
        
        if 'error' in res:
            return jsonify(res), 500
            
        return jsonify({
            "rows": res.get('rows', []),
            "columns": res.get('columns', []) or columns,
            "total": total_rows,
            "page": page,
            "limit": limit,
            "pages": (total_rows + limit - 1) // limit if total_rows > 0 else 0,
            "search_query": q
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/api/optimize/<db_name>', methods=['POST'])
def optimize_db(db_name):
    from db_manager import optimize_database
    try:
        result = optimize_database(db_name)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<db_name>', methods=['DELETE'])
def api_delete_database(db_name):
    """Delete an entire database"""
    from db_manager import delete_database
    try:
        result = delete_database(db_name)
        if 'error' in result:
            return jsonify(result), 404 if result['error'] == 'db_not_found' else 500
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<db_name>/tables/<table_name>', methods=['DELETE'])
def api_delete_table(db_name, table_name):
    """Delete a table from a database"""
    from db_manager import delete_table
    try:
        result = delete_table(db_name, table_name)
        if 'error' in result:
            return jsonify(result), 404 if result['error'] == 'db_not_found' else 500
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear_memory', methods=['DELETE'])
def api_clear_memory():
    """Clear all memory entries (neural memory reset)"""
    try:
        rag.memory = []
        rag._save_memory()
        return jsonify({'status': 'cleared', 'message': 'All memories cleared'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
