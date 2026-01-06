import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Terminal, ChevronDown, ChevronRight, Bot, Trash2, Lightbulb, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, YAxis } from 'recharts';
import Card from "../components/ui/Card";
import axios from 'axios';

const ThinkingProcess = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-white/10 bg-black/20 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 text-xs font-medium text-gray-400 hover:bg-white/5 transition-colors"
      >
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Sparkles className="w-3 h-3 text-purple-400" />
        Thinking Process ({steps.length} steps)
      </button>
      
      {isOpen && (
        <div className="p-3 pt-0 space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 text-xs text-gray-500 font-mono pl-2 border-l border-white/10 ml-1.5">
              <span className="text-gray-600 shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DynamicChart = ({ data, type = 'bar' }) => {
  if (!data || !Array.isArray(data) || data.length === 0 || !data[0]) return null;
  
  try {
    // Auto-detect keys if not provided (simple heuristic)
    const keys = Object.keys(data[0]);
    if (keys.length === 0) return null;
    
    const xKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month') || k.toLowerCase().includes('name')) || keys[0];
    const dataKey = keys.find(k => k !== xKey && typeof data[0][k] === 'number') || keys[1];
    
    if (!xKey || !dataKey) return null;

    return (
    <div className="mt-4 h-[300px] w-full min-h-[300px] bg-black/20 rounded-xl border border-white/5 p-4">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey={xKey} stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
            <Line type="monotone" dataKey={dataKey} stroke="#8b5cf6" strokeWidth={2} dot={{r:4}} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey={xKey} stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
            <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
    );
  } catch (e) {
    console.error("Chart error:", e);
    return null;
  }
};

const AgentDashboard = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('nexus_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: "agent", content: "Hello! I'm Nexus. I can analyze your data. Try uploading a CSV in Data Sources and ask me about it!" }
    ];
  });
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState([
    "Show me the top 5 rows",
    "Count the total number of records",
    "Analyze the distribution of data"
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('nexus_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;
    
    const userMsg = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      // Get active database from localStorage
      const activeDatabase = localStorage.getItem('activeDatabase');
      const preferredModel = localStorage.getItem('chatModel') || 'gemini-2.0-flash-exp';
      
      const res = await axios.post('/chat', {
        message: query,
        database: activeDatabase,
        model: preferredModel
      });
      const data = res.data;
      
      const agentMsg = { 
        role: "agent", 
        content: data.response,
        sql: data.sql,
        thought_process: data.thought_process,
        actions: data.actions
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      let errorMsg = "Sorry, I encountered an error processing your request.";
      if (error.response && error.response.status === 429) {
        errorMsg = "I've reached my thinking limit for now. Please wait a moment and try again.";
      }
      setMessages(prev => [...prev, { role: "agent", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msg, rating) => {
    try {
        // Optimistically update UI
        setMessages(prev => prev.map(m => 
            m === msg ? { ...m, rating } : m
        ));

        // Find the user query that prompted this response (the message before this one)
        const msgIndex = messages.indexOf(msg);
        if (msgIndex > 0) {
            const userQuery = messages[msgIndex - 1].content;
            
            await axios.post('http://localhost:5000/api/feedback', {
                query: userQuery,
                sql: msg.sql,
                rating: rating
            });
            
            console.log("Feedback sent!");
        }
    } catch (error) {
        console.error("Error sending feedback:", error);
        // Revert on error (optional, but good practice)
        setMessages(prev => prev.map(m => 
            m === msg ? { ...m, rating: undefined } : m
        ));
    }
  };

  const handleSuggestedQuery = (suggestedQuery) => {
    setQuery(suggestedQuery);
  };

  const clearChat = () => {
    const initialMsg = [{ role: "agent", content: "Hello! I'm Nexus. I can analyze your data. Try uploading a CSV in Data Sources and ask me about it!" }];
    setMessages(initialMsg);
    localStorage.setItem('nexus_chat_history', JSON.stringify(initialMsg));
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center px-2 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-400" />
            Nexus Agent
          </h2>
          <p className="text-gray-400 text-sm">AI-powered data analyst</p>
        </div>
        <button 
          onClick={clearChat}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear Chat
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 relative">


        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0 !p-0 overflow-hidden border-white/10 bg-black/20 backdrop-blur-sm shadow-2xl">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-6 py-5 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/20' 
                  : 'bg-white/5 text-gray-200 border border-white/5 rounded-bl-none'
              }`}>
                {msg.thought_process && <ThinkingProcess steps={msg.thought_process} />}
                
                <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                
                {msg.actions && msg.actions.map((action, idx) => (
                  action.type === 'render_chart' && (
                    <DynamicChart key={idx} data={action.data.data} type={action.data.type} />
                  )
                ))}
              </div>
              
              {/* SQL Preview (Collapsible) */}
              {msg.sql && (
                <div className="mt-2 max-w-[85%] w-full">
                  <details className="group">
                    <summary className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs text-gray-500 cursor-pointer hover:bg-white/10 transition-colors select-none w-fit">
                      <Terminal className="w-3 h-3" />
                      <span>View Generated SQL</span>
                    </summary>
                    <div className="mt-2 bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                      <pre className="p-3 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                        {msg.sql}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
              
              {/* Feedback Buttons (Only for agent messages with SQL) */}
              {msg.role === 'agent' && msg.sql && (
                <div className="flex gap-2 mt-2 ml-2">
                  <button 
                    onClick={() => handleFeedback(msg, 1)}
                    className={`p-1 rounded hover:bg-white/10 transition-colors ${msg.rating === 1 ? 'text-green-400 bg-green-500/10' : 'text-gray-500 hover:text-green-400'}`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleFeedback(msg, -1)}
                    className={`p-1 rounded hover:bg-white/10 transition-colors ${msg.rating === -1 ? 'text-red-400 bg-red-500/10' : 'text-gray-500 hover:text-red-400'}`}
                    title="Not Helpful"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl px-6 py-5 rounded-bl-none flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] backdrop-blur-md space-y-4">
          {/* Suggested Queries */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 flex items-center gap-1 mr-2">
                <Lightbulb className="w-3 h-3" />
                Try asking:
              </span>
              {suggestedQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuery(q)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about your data..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!query.trim() || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[50px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-600">
            Nexus can make mistakes. Please verify important information.
          </p>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default AgentDashboard;
