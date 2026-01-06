import { motion } from "framer-motion";
import Button from "./ui/Button";
import { Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center max-w-4xl mx-auto space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          v2.0 is now available
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Design the future <br />
          <span className="text-gradient">with pure intelligence</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Create stunning web experiences with our next-generation AI agent. 
          Seamlessly integrate design and code in one powerful workflow.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4">
            Start Building Free
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto text-lg px-8 py-4 group">
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            Watch Demo
          </Button>
        </div>
      </motion.div>

      {/* Floating Elements / Visuals */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="mt-20 relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        {/* Placeholder for a dashboard or app interface */}
        <div className="w-full h-full flex items-center justify-center text-gray-600">
           <div className="grid grid-cols-3 gap-4 w-3/4 h-3/4 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
           </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
