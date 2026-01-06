import { motion } from "framer-motion";

const Button = ({ children, className = "", variant = "primary", ...props }) => {
  const baseStyles = "px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105 backdrop-blur-sm",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
