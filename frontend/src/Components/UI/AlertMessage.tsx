import React from "react";
import { AiFillCloseCircle } from "react-icons/ai";

// Define the types of alerts we can show
type AlertType = "success" | "error" | "info" | "warning" | "message";

interface AlertMessageProps {
  message: string;
  type: AlertType;
  onClose: () => void; // A function to handle closing the alert
}

const AlertMessage: React.FC<AlertMessageProps> = ({ message, type, onClose }) => {
  // Define base styles and type-specific styles using Tailwind CSS
  const baseClasses =
    "fixed top-5 left-1/2 -translate-x-1/2 w-11/12 w-auto p-4 rounded-lg shadow-xl flex justify-between items-center z-50";

  const typeStyles: Record<AlertType, string> = {
    success: "bg-green-100 border border-green-400 text-green-800",
    error: "bg-red-100 border border-red-400 text-red-800",
    info: "bg-blue-100 border border-blue-400 text-blue-800",
    warning: "bg-yellow-100 border border-yellow-400 text-yellow-800",
    message: "bg-purple-100 border border-purple-400 text-purple-800",
  };

  return (
    <div className={`${baseClasses} ${typeStyles[type]}`}>
      <span className="uppercase">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-xl font-semibold leading-none hover:text-black focus:outline-none"
        aria-label="Close"
      >
        <AiFillCloseCircle size={28} />
      </button>
    </div>
  );
};

export default AlertMessage;
