import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Terminal, ChevronDown, ChevronRight, Bot, Trash2, Lightbulb, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, YAxis } from 'recharts';
import Card from "../components/ui/Card";
import QueryTemplates from "../components/QueryTemplates";
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
    return null;
  }
};

const AgentDashboard = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('nexus_chat_history');
    return saved ? JSON.parse(saved) : [
      {
        role: "system", 
        content: "I am Nexus AI. I can analyze your database, run SQL queries, and visualize data. Ask me anything about your data."
      }
    ];
  });
  const [loading, setLoading] = useState(false);
  const [suggestedQueries] = useState([
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

  const handleSend = async (forcedQuery = null) => {
    const q = forcedQuery || query;
    if (!q.trim()) return;
    
    // Save to recent queries
    const recent = JSON.parse(localStorage.getItem('recentQueries') || '[]');
    const newRecent = [{ query: q, timestamp: Date.now() }, ...recent.filter(r => r.query !== q)].slice(0, 10);
    localStorage.setItem('recentQueries', JSON.stringify(newRecent));

    const userMsg = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const activeDb = localStorage.getItem("activeDatabase");
      const res = await axios.post('/api/chat', { 
        message: q,
        database: activeDb
      });
      
      const botMsg = { 
        role: "assistant", 
        content: res.data.response,
        sql: res.data.sql,
        data: res.data.data,
        chartType: res.data.chartType,
        thinkingProcess: res.data.thinking_process || []
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.response?.data?.error) {
        errorMessage += ` (${error.response.data.error})`;
      }
      setMessages(prev => [...prev, { role: "assistant", content: errorMessage, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if(window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([{
        role: "system", 
        content: "History cleared. I am ready for new queries."
      }]);
    }
  };

  const handleTemplateSelect = (templateQuery) => {
    setQuery(templateQuery);
    // Optional: auto-send
    // handleSend(templateQuery); 
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            Nexus Agent
          </h2>
          <p className="text-gray-400">Ask questions about your data in natural language</p>
        </div>
        <div className="flex items-center gap-2">
          <QueryTemplates onSelectTemplate={handleTemplateSelect} />
          <button 
            onClick={handleClearHistory}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div 
                className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-sm backdrop-blur-sm'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                
                {msg.role === 'assistant' && !msg.error && (
                  <div className="mt-4 space-y-4">
                    {/* Thinking Process */}
                    <ThinkingProcess steps={msg.thinkingProcess} />

                    {/* SQL Code Block */}
                    {msg.sql && (
                      <div className="bg-black/40 rounded-lg overflow-hidden border border-white/5">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                          <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                            <Terminal className="w-3 h-3" />
                            Generated SQL
                          </span>
                        </div>
                        <pre className="p-3 text-xs font-mono text-blue-300 overflow-x-auto custom-scrollbar">
                          {msg.sql}
                        </pre>
                      </div>
                    )}
                    
                    {/* Data Chart */}
                    {msg.data && msg.data.length > 0 && (
                      <DynamicChart data={msg.data} type={msg.chartType || 'bar'} />
                    )}
                    
                    {/* Feedback Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                <span className="text-xs font-bold text-white">U</span>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm w-48">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 relative z-20">
        {messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-2">
            {suggestedQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 whitespace-nowrap transition-all"
              >
                <Lightbulb className="w-3 h-3 text-yellow-400" />
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-2 pl-4 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all backdrop-blur-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your data (e.g., 'Show top customers by revenue')..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 h-10"
              disabled={loading}
              autoFocus
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !query.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-600">
            Nexus AI can make mistakes. Double check important results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
