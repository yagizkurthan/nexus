import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="py-12 px-6 md:px-12 border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-xl font-bold text-white">Aura</span>
          <p className="text-sm text-gray-500">© 2024 Aura Inc. All rights reserved.</p>
        </div>

        <div className="flex gap-8">
          {["Twitter", "GitHub", "Discord"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
