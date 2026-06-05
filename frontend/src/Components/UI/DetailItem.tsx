import React from "react";

// Define the props the component will accept
interface DetailItemProps {
  label: string;
  value: React.ReactNode; // Using React.ReactNode allows passing strings, numbers, or other components
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm uppercase font-semibold text-gray-900">
        {value || <span className="text-gray-400">-</span>}
      </p>
    </div>
  );
};

export default DetailItem;

export const DataBlock = ({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: string | undefined | null;
  icon?: any;
  className?: string;
}) => (
  <div className={`p-4 rounded-xl  ${className} overflow-hidden`}>
    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase mb-1 whitespace-nowrap">
      {icon} {label}
    </div>
    <div className="text-sm uppercase font-bold text-slate-800 break-words">
      {value || <span className="text-slate-400 italic">-</span>}
    </div>
  </div>
);

// --- Sub-Components ---
export const InfoCard = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden ${className}`}
  >
    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
      <span className="text-indigo-500">{icon}</span>
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);
