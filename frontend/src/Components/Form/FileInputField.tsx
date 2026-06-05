// src/Components/Form/FileInputField.tsx
import React, { useState } from "react";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";
import { FaCloudUploadAlt, FaFile, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

type FileInputFieldProps = {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  required?: boolean | string;
  accept?: string; // e.g., "image/*, .pdf"
  helperText?: string;
};

const FileInputField: React.FC<FileInputFieldProps> = ({
  name,
  label,
  register,
  errors,
  required = false,
  accept = "image/*, .pdf, .doc, .docx",
  helperText,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);

  // Extract the original ref and onChange from register
  const { onChange, ref, ...rest } = register(name, {
    required: required
      ? typeof required === "string"
        ? required
        : `${label} is required.`
      : false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
    // Forward the event to react-hook-form
    onChange(e);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    setFileName(null);
    // We need to clear the input value.
    // Since we don't have direct access to the DOM element via state,
    // we can rely on the form reset or just visual clearing here.
    // Ideally, you'd use setValue from useForm context if passed,
    // but for a dumb component, visual clearing is often enough
    // until the form is submitted.
    const input = document.getElementById(name) as HTMLInputElement;
    if (input) input.value = "";
  };

  const errorMessage = errors[name]?.message;
  const hasError = !!errorMessage;

  return (
    <div className="flex flex-col">
      <label
        htmlFor={name}
        className="text-sm font-semibold text-purple-950 mb-2 uppercase flex justify-between"
      >
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {fileName && (
          <span className="text-[10px] text-green-600 flex items-center gap-1 normal-case font-bold bg-green-50 px-2 rounded-full">
            <FaCheckCircle /> Selected
          </span>
        )}
      </label>

      <div className={`relative group w-full transition-all duration-200 ease-in-out`}>
        {/* The Actual Input (Hidden but Functional) */}
        <input
          id={name}
          type="file"
          accept={accept}
          ref={ref}
          onChange={handleFileChange}
          {...rest}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* The Visual UI */}
        <div
          className={`flex flex-col items-center justify-center w-full px-4 py-1 border border-dashed border-black rounded-xl transition-colors
            ${
              hasError
                ? "border-red-300 bg-red-50"
                : fileName
                  ? "border-black bg-blue-50"
                  : "border-gray-300 bg-white hover:bg-white hover:border-purple-400"
            }
          `}
        >
          {fileName ? (
            // State: File Selected
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white rounded-lg border border-purple-100 text-amber-600 shadow-sm">
                  <FaFile size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-700 truncate block max-w-[150px] md:max-w-[200px]">
                    {fileName}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Click to change
                  </span>
                </div>
              </div>

              {/* Remove Button (Visual only, stops propagation) */}
              <button
                onClick={handleRemove}
                className="z-20 p-2 text-red-300 hover:text-red-500 hover:bg-white rounded-full transition-all"
                title="Remove file"
              >
                <MdDelete size={18} />
              </button>
            </div>
          ) : (
            // State: Empty / Prompt
            <div className="flex flex-col items-center text-center">
              <FaCloudUploadAlt size={20} className="text-blue-700" />
              <p className="text-xs font-bold text-slate-600 uppercase">
                <span className="text-blue-800 text-[10px]">Click to upload</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {helperText || "PDF, JPG, PNG (Max 5MB)"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs font-semibold animate-fadeIn">
          <FaExclamationCircle />
          <span>{String(errorMessage)}</span>
        </div>
      )}
    </div>
  );
};

export default FileInputField;
