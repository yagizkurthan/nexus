import { useRef, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Card from "../components/ui/Card";
import { TrendingUp, Database, BarChart2, Loader, AlertCircle, FileText, Sparkles, Lightbulb, Download } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

const Analytics = () => {
  const { isAnalyzing, report, error, generateReport, activeDb } = useAnalysis();
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleGenerate = () => {
      const preferredModel = localStorage.getItem('analyticsModel') || 'gemini-2.0-flash-exp';
      generateReport(activeDb, preferredModel);
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);

    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => generatePDF();
      document.body.appendChild(script);
    } else {
      generatePDF();
    }
  };

  const generatePDF = () => {
    const element = reportRef.current;
    
    const opt = {
      margin: 10,
      filename: `Nexus_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000000' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
      setExporting(false);
    });
  };

  const renderChart = (chart, index) => {
    const { type, data, title, x_axis, y_axis } = chart;
    
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    try {
        const keys = Object.keys(data[0]);
        const xKey = x_axis || keys.find(k => typeof data[0][k] === 'string') || keys[0];
        const yKey = y_axis || keys.find(k => typeof data[0][k] === 'number' && k !== xKey) || keys[1] || keys[0];

        const sanitizedData = data.map(item => ({
            ...item,
            [yKey]: Number(item[yKey]) || 0,
            [xKey]: item[xKey]
        }));

        const commonProps = {
            data: sanitizedData,
            margin: { top: 20, right: 30, left: 20, bottom: 5 }
        };

        switch (type) {
            case 'line':
                return (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey={xKey} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                                <Line type="monotone" dataKey={yKey} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'area':
                return (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey={xKey} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                                <Area type="monotone" dataKey={yKey} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'scatter':
                return (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis type="category" dataKey={xKey} name={xKey} stroke="#9ca3af" fontSize={12} />
                                <YAxis type="number" dataKey={yKey} name={yKey} stroke="#9ca3af" fontSize={12} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                                <Scatter name={title} data={sanitizedData} fill={COLORS[index % COLORS.length]} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'radar':
                return (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sanitizedData}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Radar name={title} dataKey={yKey} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
                                <Legend />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'pie':
                return (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={sanitizedData} 
                                    dataKey={yKey} 
                                    nameKey={xKey} 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    fill="#8884d8" 
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {sanitizedData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );
            default: // bar
                return (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey={xKey} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey={yKey} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
        }
    } catch (e) {
        console.error("Chart rendering error:", e);
        return (
            <div className="h-[300px] flex items-center justify-center text-red-400 text-sm text-center p-4 border border-red-500/20 rounded-xl bg-red-500/5">
                <AlertCircle className="w-4 h-4 mr-2" />
                Failed to render chart: {e.message}
            </div>
        );
    }
  };

  if (!activeDb) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-4 rounded-full bg-white/5">
          <Database className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-white">No Database Selected</h3>
        <p className="text-gray-400 max-w-md">Please select or upload a database in the Data Sources page to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-400" />
            Analytics Report
          </h2>
          <p className="text-gray-400">Deep insights generated by AI</p>
        </div>
        <div className="flex gap-2">
            {report && (
                <button
                    onClick={downloadPDF}
                    disabled={exporting}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
            )}
            <button
                onClick={handleGenerate}
                disabled={isAnalyzing}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {report ? 'Regenerate Report' : 'Generate Report'}
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {!report && !isAnalyzing && !error && (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
            <div className="p-4 rounded-full bg-blue-500/10">
                <FileText className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-medium text-white">Ready to Analyze</h3>
            <p className="text-gray-400 max-w-md">Click "Generate Report" to let the AI analyze your data and create a comprehensive report with charts.</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center h-[40vh] space-y-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                </div>
            </div>
            <p className="text-gray-400 animate-pulse">Analyzing data patterns and generating insights...</p>
        </div>
      )}

      {report && (
        <div ref={reportRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-black/50 p-6 rounded-2xl">
            {/* Header info for PDF */}
            <div className="hidden pdf-only mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Nexus Analysis Report</h1>
                <p className="text-gray-400">Database: {activeDb} • Generated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Executive Summary */}
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Executive Summary
                </h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {report.executive_summary}
                </p>
            </Card>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 avoid-break">
                {report.key_insights.map((insight, i) => (
                    <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 mt-1">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {report.charts.map((chart, i) => (
                    <Card key={i} className="bg-black/40 border-white/10 avoid-break is-chart">
                        <h4 className="text-base font-medium text-white mb-6">{chart.title}</h4>
                        {chart.error ? (
                            <div className="h-[300px] flex items-center justify-center text-red-400 text-sm text-center p-4">
                                Failed to render chart: {chart.error}
                            </div>
                        ) : (
                            renderChart(chart, i)
                        )}
                    </Card>
                ))}
            </div>
            
            <div className="text-center text-gray-600 text-xs mt-8 pt-8 border-t border-white/10 hidden pdf-only">
                Generated by Nexus AI Analytics Engine
            </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
