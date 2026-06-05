// Components/Form/SelectInputField.tsx
import { type UseFormRegister, type FieldErrors } from "react-hook-form";

interface Option {
  label: any;
  value: any;
}

interface SelectInputFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean | string; // Support both boolean and custom message
  ClassName?: string; // NEW: Allow custom container styling
}

const SelectInputField = ({
  label,
  name,
  register,
  errors,
  options,
  placeholder = "Select",
  disabled = false,
  required = false,
  ClassName = "", // NEW
}: SelectInputFieldProps) => {
  // Handle required as boolean or custom message
  const requiredRule =
    typeof required === "string" ? required : required ? `${label} is required` : false;

  // Safely access the specific error message for this field (supports nested like dependants.0.relation)
  const getNestedError = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };
  const errorMessage = getNestedError(errors, name)?.message;

  return (
    <div className={`flex flex-col ${ClassName}`}>
      <label htmlFor={name} className="text-sm font-semibold text-purple-950 mb-2 uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        {...register(name, { required: requiredRule })}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm uppercase ${
          errorMessage ? "border-red-500 focus:ring-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorMessage && <span className="text-red-500 text-xs mt-1">{String(errorMessage)}</span>}
    </div>
  );
};

export default SelectInputField;
