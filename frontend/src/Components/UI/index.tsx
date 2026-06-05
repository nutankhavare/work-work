import React from "react";

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-[800] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default: "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
    secondary:
      "bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-light)] hover:bg-[#e9e2ff]",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "border-2 border-[var(--border)] bg-transparent hover:bg-slate-50 text-[var(--text)]",
    ghost: "bg-transparent hover:bg-slate-50 text-[var(--text)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-5 py-[11px] text-[13px]",
    lg: "px-8 py-4 text-[15px]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Badge Component ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "red" | "gray" | "purple" | "amber";
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "blue",
  className = "",
  style,
}) => {
  const variants = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-rose-50 text-rose-600 border-rose-100",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
    purple: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-[800] uppercase tracking-wider border ${variants[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

// --- Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
}

export const Input: React.FC<InputProps> = ({ icon, className = "", style, ...props }) => {
  return (
    <div className="relative w-full">
      {icon && (
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
          {icon}
        </span>
      )}
      <input
        className={`w-full ${icon ? "pl-11" : "px-4"} py-[11px] bg-white border-[1.5px] border-[var(--border)] rounded-[12px] focus:outline-none focus:border-[var(--primary)] text-[13px] font-[600] placeholder:text-slate-400 transition-all ${className}`}
        style={style}
        {...props}
      />
    </div>
  );
};

// --- Select Component ---
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  children,
  className = "",
  style,
  ...props
}) => {
  return (
    <select
      className={`w-full px-4 py-[11px] bg-white border-[1.5px] border-[var(--border)] rounded-[12px] focus:outline-none focus:border-[var(--primary)] text-[13px] font-[600] text-slate-700 appearance-none cursor-pointer hover:border-slate-300 transition-colors ${className}`}
      style={style}
      {...props}
    >
      {children}
    </select>
  );
};

// --- Card Component ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white rounded-[16px] border border-[var(--border)] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden ${className}`}
  >
    {children}
  </div>
);

// --- Pagination Component ---
interface PaginationProps {
  info: string;
  pages: number[];
  current: number;
}

export const Pagination: React.FC<PaginationProps> = ({ info, pages, current }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border-t border-[var(--border)] gap-4">
    <div className="text-[12px] font-[600] text-slate-500">{info}</div>
    <div className="flex items-center gap-1">
      <button className="p-2 text-slate-400 hover:text-[var(--primary)] disabled:opacity-30">
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-[700] transition-all
            ${p === current ? "bg-[var(--primary)] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}
          `}
        >
          {p}
        </button>
      ))}
      <button className="p-2 text-slate-400 hover:text-[var(--primary)]">
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  </div>
);

// --- Stars Component ---
interface StarsProps {
  rating: number;
  max?: number;
}

export const Stars: React.FC<StarsProps> = ({ rating, max = 5 }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(max)].map((_, i) => (
      <span
        key={i}
        className="material-symbols-outlined"
        style={{
          fontSize: "14px",
          color: i < rating ? "#fbbf24" : "#e2e8f0",
          fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        star
      </span>
    ))}
  </div>
);
