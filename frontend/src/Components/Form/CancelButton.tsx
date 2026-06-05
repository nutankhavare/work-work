// src/Components/Form/CancelButton.tsx
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { MdCancel } from "react-icons/md";
import { CgSpinner } from "react-icons/cg";

// 1. Extend standard button attributes
interface CancelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isSaving?: boolean;
  icon?: ReactNode;
}

const CancelButton = ({
  label,
  isSaving = false,
  icon,
  className = "",
  disabled,
  children, // allows wrapping content if needed
  ...props // 2. Capture all other props (onClick, type, onHover, etc.)
}: CancelButtonProps) => {
  return (
    <button
      // 3. Spread the props onto the HTML button
      {...props}
      disabled={isSaving || disabled}
      className={`
        relative inline-flex items-center justify-center
        px-4 py-2 gap-1
        text-sm font-bold uppercase tracking-wide text-black
        bg-slate-100 hover:bg-gray-300
        border border-gray-300 rounded-lg shadow-sm
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all duration-200 ease-in-out
        ${className}
      `}
    >
      {/* Loading Logic */}
      {isSaving ? (
        <CgSpinner className="animate-spin text-xl" />
      ) : (
        <span className="text-lg">{icon || <MdCancel />}</span>
      )}
      <span>{isSaving ? "Processing..." : label}</span>
    </button>
  );
};

export default CancelButton;
