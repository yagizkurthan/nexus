import { motion } from "framer-motion";
import Button from "./ui/Button";
import { Sparkles } from "lucide-react";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 glass-panel m-4 rounded-2xl"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-white" />
        <span className="text-xl font-bold tracking-tight text-white">Aura</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {["Features", "Pricing", "About", "Blog"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <a href="#login" className="text-sm font-medium text-white hover:text-gray-300 hidden md:block">
          Log in
        </a>
        <Button variant="primary" className="px-5 py-2 text-sm">
          Get Started
        </Button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
