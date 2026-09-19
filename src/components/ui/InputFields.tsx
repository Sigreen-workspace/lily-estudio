import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormInput({ label, id, error, hint, className = "", ...props }: FormInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 tracking-tight">
        {label}
        {props.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-800 transition focus:outline-none focus:ring-2 ${
          error
            ? "border-rose-300 focus:ring-rose-200/60 focus:border-rose-500"
            : "border-slate-200 focus:ring-[#74B49B]/30 focus:border-[#74B49B]"
        } ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}