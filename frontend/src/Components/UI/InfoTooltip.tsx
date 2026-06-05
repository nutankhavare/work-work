import React, { useState } from "react";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InfoTooltipProps {
  message?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ message = "Max 5MB. PDF, JPG, PNG, WEBP" }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1.5 group">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="cursor-help text-slate-300 group-hover:text-primary transition-colors"
      >
        <Info size={12} />
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 z-[100]"
          >
            <div className="bg-slate-800 text-white text-[10px] font-bold p-2.5 rounded-lg shadow-xl relative text-center">
              {message}
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfoTooltip;
