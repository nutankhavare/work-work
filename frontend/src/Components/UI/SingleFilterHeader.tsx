import React from "react";

// The props are now generic to handle any kind of data
interface FilterProps {
  label: string;
  id: string;
  options: any[];
  value: string;
  onChange: (value: string) => void;
  optionValueKey: string;
  optionLabelKey: string;
  placeholder?: string;
  className?: string;
}

const SingleFilterHeader: React.FC<FilterProps> = ({
  label,
  id,
  options,
  value,
  onChange,
  optionValueKey,
  optionLabelKey,
  placeholder = "All Items",
  className = "",
}) => {
  return (
    <div className={`w-full max-w-xs ${className}`}>
      <label htmlFor={id} className="block text-sm uppercase font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => {
          // This logic allows the component to handle both arrays of objects and arrays of strings
          const isObject = typeof option === "object" && option !== null;
          const optionValue = isObject ? option[optionValueKey] : option;
          const optionLabel = isObject ? option[optionLabelKey] : option;

          return (
            <option key={optionValue || index} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default SingleFilterHeader;
