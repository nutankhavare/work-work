// src/Components/Form/SaveButton.tsx
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { MdSave } from "react-icons/md";
import { CgSpinner } from "react-icons/cg";

// 1. Extend standard button attributes
interface SaveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isSaving?: boolean;
  icon?: ReactNode;
}

const SaveButton = ({
  label,
  isSaving = false,
  icon,
  className = "",
  disabled,
  children, // allows wrapping content if needed
  ...props // 2. Capture all other props (onClick, type, onHover, etc.)
}: SaveButtonProps) => {
  return (
    <button
      // 3. Spread the props onto the HTML button
      {...props}
      disabled={isSaving || disabled}
      className={`
        relative inline-flex items-center justify-center
        px-4 py-2 gap-1
        text-sm font-bold uppercase tracking-wide text-white
        bg-green-600 hover:bg-green-700 active:bg-green-800
        border border-transparent rounded-lg shadow-sm
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all duration-200 ease-in-out
        ${className}
      `}
    >
      {/* Loading Logic */}
      {isSaving ? (
        <CgSpinner className="animate-spin text-xl" />
      ) : (
        <span className="text-lg">{icon || <MdSave />}</span>
      )}
      <span>{isSaving ? "Processing..." : label}</span>
    </button>
  );
};

export default SaveButton;
