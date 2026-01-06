import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Cpu, Save, AlertCircle, Info } from "lucide-react";
import Card from "../components/ui/Card";

const Settings = () => {
  const [chatModel, setChatModel] = useState("gemini-2.0-flash-exp");
  const [analyticsModel, setAnalyticsModel] = useState("gemini-2.0-flash-exp");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedChatModel = localStorage.getItem("chatModel");
    const savedAnalyticsModel = localStorage.getItem("analyticsModel");
    if (savedChatModel) setChatModel(savedChatModel);
    if (savedAnalyticsModel) setAnalyticsModel(savedAnalyticsModel);
  }, []);

  const handleSave = () => {
    localStorage.setItem("chatModel", chatModel);
    localStorage.setItem("analyticsModel", analyticsModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-gray-400" />
            Settings
          </h2>
          <p className="text-gray-400">Configure AI models and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-6 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">AI Model Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Chat Agent Model</label>
              <select
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              >
                <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview (Next Gen)</option>
                <option value="gemini-2.5-flash-preview-09-2025">Gemini 2.5 Flash Preview (High Performance)</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Standard)</option>
                <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite (Fastest)</option>
              </select>
              <p className="text-xs text-gray-500">
                Used for general chat and query generation.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Analytics Engine Model</label>
              <select
                value={analyticsModel}
                onChange={(e) => setAnalyticsModel(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              >
                <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview (Next Gen)</option>
                <option value="gemini-2.5-flash-preview-09-2025">Gemini 2.5 Flash Preview (High Performance)</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Standard)</option>
                <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite (Fastest)</option>
              </select>
              <p className="text-xs text-gray-500">
                Used for deep analytics and generating insights.
              </p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-blue-400">Smart Fallback Enabled</h4>
              <p className="text-xs text-blue-300/80">
                If your selected model hits a usage limit (Quota Exceeded), the system will automatically try to switch to a lighter model (Gemini 1.5 Flash) to complete your request.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saved ? "Settings Saved!" : "Save Changes"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
