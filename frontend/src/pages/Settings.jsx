import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Cpu, Save, AlertCircle, Info, Moon, Sun, Trash2, Brain, Palette } from "lucide-react";
import Card from "../components/ui/Card";
import axios from 'axios';

const Settings = () => {
  const [chatModel, setChatModel] = useState("gemini-2.0-flash-exp");
  const [analyticsModel, setAnalyticsModel] = useState("gemini-2.0-flash-exp");
  const [theme, setTheme] = useState("dark");
  const [saved, setSaved] = useState(false);
  const [clearingMemory, setClearingMemory] = useState(false);

  useEffect(() => {
    const savedChatModel = localStorage.getItem("chatModel");
    const savedAnalyticsModel = localStorage.getItem("analyticsModel");
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedChatModel) setChatModel(savedChatModel);
    if (savedAnalyticsModel) setAnalyticsModel(savedAnalyticsModel);
    setTheme(savedTheme);
  }, []);

  const handleSave = () => {
    localStorage.setItem("chatModel", chatModel);
    localStorage.setItem("analyticsModel", analyticsModel);
    localStorage.setItem("theme", theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearMemory = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all AI memories?\n\nThis will delete all learned query patterns and cannot be undone."
    );
    if (!confirmed) return;

    setClearingMemory(true);
    try {
      await axios.delete('/api/clear_memory');
      alert("All AI memories have been cleared successfully.");
    } catch (error) {
      console.error("Failed to clear memory", error);
      alert("Failed to clear memory: " + (error.response?.data?.error || error.message));
    } finally {
      setClearingMemory(false);
    }
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
        {/* AI Model Configuration */}
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
        </Card>

        {/* Appearance & Danger Zone */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card className="space-y-4 border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Palette className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Appearance</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Theme</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    theme === "dark"
                      ? "bg-purple-600/20 border-purple-500/50 text-purple-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    theme === "light"
                      ? "bg-yellow-600/20 border-yellow-500/50 text-yellow-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Theme preference is saved locally. (UI implementation coming soon)
              </p>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="space-y-4 border-red-500/20 bg-red-500/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-gray-400" />
                    Clear AI Memory
                  </h4>
                  <p className="text-xs text-gray-500">
                    Remove all learned query patterns and history
                  </p>
                </div>
                <button
                  onClick={handleClearMemory}
                  disabled={clearingMemory}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {clearingMemory ? "Clearing..." : "Clear Memory"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saved ? "Settings Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default Settings;
