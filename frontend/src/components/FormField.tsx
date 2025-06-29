import React from 'react';

interface BaseFormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
}

interface InputFieldProps extends BaseFormFieldProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'date';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

interface SelectFieldProps extends BaseFormFieldProps {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
}

interface TextAreaFieldProps extends BaseFormFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const getFieldClasses = (error?: string, disabled?: boolean) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
  
  return `${baseClasses} ${errorClasses} ${disabledClasses}`;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  helpText,
  placeholder,
  min,
  max,
  step,
  disabled = false,
  onBlur,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={getFieldClasses(error, disabled)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
      />
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  helpText,
  placeholder,
  disabled = false,
  onBlur,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={getFieldClasses(error, disabled)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  helpText,
  placeholder,
  rows = 4,
  disabled = false,
  onBlur,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={getFieldClasses(error, disabled)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
      />
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Form section wrapper for better organization
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="border-b border-gray-200 pb-3">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form button group for consistent button layout
interface FormButtonGroupProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const FormButtonGroup: React.FC<FormButtonGroupProps> = ({
  children,
  align = 'right',
  className = ''
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div className={`flex ${alignClasses[align]} space-x-3 pt-4 ${className}`}>
      {children}
    </div>
  );
};