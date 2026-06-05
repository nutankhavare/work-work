import React from "react";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data Found",
  description = "We couldn't find what you were looking for.",
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12">
      <div className="text-slate-400 ">
        {icon || <AlertCircle size={40} className="text-red-400" />}
      </div>
      <h3 className="text-sm uppercase font-semibold text-slate-800">{title}</h3>
      <p className="text-slate-500 text-xs uppercase max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
