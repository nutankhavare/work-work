import { type ReactNode } from "react";

export const TableDiv = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

interface TableContainerProps {
  children: ReactNode;
  maxHeight?: string; // e.g., "60vh", "500px"
}

export const TableContainer = ({ children, maxHeight = "70vh" }: TableContainerProps) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: maxHeight }}>
        {children}
      </div>
    </div>
  );
};

export const Table = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <table className={`min-w-full divide-y divide-slate-200 relative ${className}`}>
      {children}
    </table>
  );
};

export const Thead = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <thead className={`bg-blue-950 sticky top-0 z-10 shadow-md ${className}`}>
      <tr>{children}</tr>
    </thead>
  );
};

interface ThProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  width?: string;
}

export const Th = ({ children, align = "left", className = "", width }: ThProps) => {
  return (
    <th
      scope="col"
      style={{ width }}
      className={`px-6 py-4 text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap text-${align} ${className}`}
    >
      {children}
    </th>
  );
};

export const Tbody = ({ children }: { children: ReactNode }) => {
  return <tbody className="bg-white divide-y divide-slate-100">{children}</tbody>;
};

export const Tr = ({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-slate-50 transition-colors duration-150 group ${className} ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
};

interface TdProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  isMono?: boolean; // For IDs, Pincodes, Numbers
}

export const Td = ({ children, align = "left", className = "", isMono = false }: TdProps) => {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${isMono ? "font-mono font-medium" : ""} text-${align} ${className}`}
    >
      {children}
    </td>
  );
};
