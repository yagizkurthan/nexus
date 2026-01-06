import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

# Define the function schemas for Gemini

run_sql_func = FunctionDeclaration(
    name="run_sql",
    description="Execute a SQL query against the SQLite database. Use this to retrieve data.",
    parameters={
        "type": "object",
        "properties": {
            "sql": {
                "type": "string",
                "description": "The SQL query to execute. MUST be a valid SQLite query."
            },
            "database": {
                "type": "string",
                "description": "The name of the database to query (e.g., 'phonetest')."
            }
        },
        "required": ["sql", "database"]
    }
)

list_tables_func = FunctionDeclaration(
    name="list_tables",
    description="List all tables in a specific database.",
    parameters={
        "type": "object",
        "properties": {
            "database": {
                "type": "string",
                "description": "The name of the database to inspect."
            }
        },
        "required": ["database"]
    }
)

# Create the Tool object
sql_tools = Tool(
    function_declarations=[run_sql_func, list_tables_func]
)
