import { useState, useEffect } from 'react';
import { 
  History, 
  Brain, 
  TrendingUp, 
  Database, 
  Search, 
  ThumbsUp, 
  ThumbsDown,
  Sparkles,
  Zap,
  Activity,
  Lightbulb,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Card from "../components/ui/Card";
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AgentControlCenter = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQueries: 0,
    avgResponseTime: '1.2s', // Mocked for now
    learningRate: '+15%',    // Mocked
    accuracy: '98%'          // Mocked
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/history');
      const data = res.data;
      
      if (!Array.isArray(data)) {
        console.error("API returned non-array history:", data);
        setHistory([]);
        return;
      }

      const formatted = data.map((item) => ({
        query: item.query,
        sql: item.sql,
        rating: item.rating || 0,
        timestamp: item.timestamp || new Date().toISOString() // Use real timestamp if available
      })).reverse();
      
      setHistory(formatted);
      calculateStats(formatted);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    
    // Calculate Accuracy (Positive Ratings / Total Rated)
    const ratedItems = data.filter(i => i.rating !== 0);
    const positiveRatings = data.filter(i => i.rating === 1).length;
    const accuracy = ratedItems.length > 0 
        ? Math.round((positiveRatings / ratedItems.length) * 100) 
        : 100; // Default to 100% if no ratings yet

    // Calculate Activity (Group by hour for today)
    const today = new Date().toDateString();
    const hourlyCounts = new Array(24).fill(0);
    
    data.forEach(item => {
        const date = new Date(item.timestamp);
        if (date.toDateString() === today) {
            hourlyCounts[date.getHours()]++;
        }
    });

    // Calculate Peak Activity Hour
    let maxHour = 0;
    let maxCount = 0;
    hourlyCounts.forEach((count, hour) => {
        if (count > maxCount) {
            maxCount = count;
            maxHour = hour;
        }
    });
    const peakHourStr = `${maxHour}:00 - ${maxHour + 1}:00`;

    // Calculate Avg SQL Length (Complexity)
    const totalSqlLength = data.reduce((acc, item) => acc + (item.sql ? item.sql.length : 0), 0);
    const avgSqlLength = total > 0 ? Math.round(totalSqlLength / total) : 0;
    let complexityLabel = "Low";
    if (avgSqlLength > 100) complexityLabel = "Medium";
    if (avgSqlLength > 300) complexityLabel = "High";

    // Calculate Feedback Ratio
    const feedbackRatio = ratedItems.length > 0 
        ? `${positiveRatings}/${ratedItems.length} Positive` 
        : "No ratings";

    setStats({
        totalQueries: total,
        avgResponseTime: '1.2s', // Still mocked
        learningRate: `+${Math.min(total * 2, 100)}%`,
        accuracy: `${accuracy}%`,
        activityData: chartData,
        peakHour: peakHourStr,
        complexity: complexityLabel,
        feedbackStats: feedbackRatio
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-400" />
          Neural Learning Hub
        </h2>
        <p className="text-gray-400">Track your queries and discover data patterns</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Queries</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalQueries}</h3>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Avg Response Time</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.avgResponseTime}</h3>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.learningRate} faster
              </p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Model Accuracy</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.accuracy}</h3>
              <p className="text-xs text-purple-400 mt-1">Based on feedback</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics (Replaces AI Insights) */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/20 flex gap-4">
            <div className="mt-1">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-blue-400 font-medium text-sm">Peak Activity</h4>
              <p className="text-white text-lg font-bold mt-1">{stats.peakHour || "N/A"}</p>
              <p className="text-gray-400 text-xs">Most active time of day</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/20 flex gap-4">
            <div className="mt-1">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-purple-400 font-medium text-sm">Query Complexity</h4>
              <p className="text-white text-lg font-bold mt-1">{stats.complexity || "Low"}</p>
              <p className="text-gray-400 text-xs">Based on SQL structure</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/20 flex gap-4">
            <div className="mt-1">
              <ThumbsUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="text-green-400 font-medium text-sm">Feedback Ratio</h4>
              <p className="text-white text-lg font-bold mt-1">{stats.feedbackStats || "No ratings"}</p>
              <p className="text-gray-400 text-xs">User satisfaction score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <Card className="bg-black/40 border-white/10">
        <h3 className="text-lg font-semibold text-white mb-6">Query Activity (Today)</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.activityData || []}>
              <defs>
                <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="queries" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Memories */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Memories</h3>
        <div className="space-y-4">
          {history.map((item, i) => (
            <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <span className="text-white font-medium">{item.query}</span>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 border border-white/5 font-mono text-xs text-green-400 overflow-x-auto">
                    {item.sql}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {item.rating === 1 && (
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Helpful
                    </span>
                  )}
                  {item.rating === -1 && (
                    <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Unhelpful
                    </span>
                  )}
                  <span className="text-xs text-gray-600">Just now</span>
                </div>
              </div>
            </Card>
          ))}
          {history.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No memories yet. Start chatting to build the neural network!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentControlCenter;
