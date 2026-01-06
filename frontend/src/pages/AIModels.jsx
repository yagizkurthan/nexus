import { useState } from "react";
import { Cpu, Zap, Box, Check, Star } from "lucide-react";
import Card from "../components/ui/Card";

const AIModels = () => {
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");

  const models = [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "Google",
      type: "Multimodal",
      description: "Fastest and most capable model for high-frequency tasks.",
      features: ["Low Latency", "High Throughput", "1M Context Window"],
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-400/20"
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      provider: "Google",
      type: "Reasoning",
      description: "Best for complex reasoning and long-context understanding.",
      features: ["Complex Reasoning", "2M Context Window", "Code Generation"],
      icon: Star,
      color: "text-purple-400",
      bg: "bg-purple-400/20"
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "OpenAI",
      type: "General",
      description: "High intelligence flagship model for complex tasks.",
      features: ["Advanced Reasoning", "Vision Capable", "128k Context"],
      icon: Box,
      color: "text-green-400",
      bg: "bg-green-400/20"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Models</h2>
        <p className="text-gray-400">Select the intelligence engine for your agent</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card 
            key={model.id} 
            className={`relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedModel === model.id ? 'ring-2 ring-blue-500 bg-white/10' : 'hover:bg-white/5'
            }`}
            onClick={() => setSelectedModel(model.id)}
          >
            {selectedModel === model.id && (
              <div className="absolute top-4 right-4 p-1 rounded-full bg-blue-500 text-white">
                <Check className="w-3 h-3" />
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${model.bg} ${model.color}`}>
                <model.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-gray-400">
                {model.provider}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{model.name}</h3>
            <p className="text-sm text-gray-400 mb-4 h-10">{model.description}</p>

            <div className="space-y-2">
              {model.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-gray-500" />
                  {feature}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIModels;
