import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

export interface FormValidationHook<T> {
  values: T;
  errors: ValidationErrors;
  isValid: boolean;
  isSubmitting: boolean;
  setValues: (values: T) => void;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e: React.FormEvent) => Promise<void>;
  setSubmitting: (submitting: boolean) => void;
}

const getValidationMessage = (fieldName: string, rule: ValidationRule, value: any): string => {
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName}は必須項目です`;
  }

  if (value && typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName}は${rule.minLength}文字以上で入力してください`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName}は${rule.maxLength}文字以下で入力してください`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName}の形式が正しくありません`;
    }
  }

  if (value !== undefined && value !== null && value !== '') {
    const numValue = Number(value);
    
    if (rule.min !== undefined && numValue < rule.min) {
      return `${fieldName}は${rule.min}以上で入力してください`;
    }
    
    if (rule.max !== undefined && numValue > rule.max) {
      return `${fieldName}は${rule.max}以下で入力してください`;
    }
  }

  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      return customError;
    }
  }

  return '';
};

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules
): FormValidationHook<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    const fieldName = String(field);
    const rule = validationRules[fieldName];
    
    if (!rule) return true;

    const value = values[field];
    const error = getValidationMessage(fieldName, rule, value);

    if (error) {
      setError(fieldName, error);
      return false;
    } else {
      clearError(fieldName);
      return true;
    }
  }, [values, validationRules, setError, clearError]);

  const validateAll = useCallback(): boolean => {
    let isFormValid = true;
    const newErrors: ValidationErrors = {};

    Object.keys(validationRules).forEach(fieldName => {
      const rule = validationRules[fieldName];
      const value = values[fieldName as keyof T];
      const error = getValidationMessage(fieldName, rule, value);

      if (error) {
        newErrors[fieldName] = error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [values, validationRules]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when value changes
    if (errors[String(field)]) {
      clearError(String(field));
    }
  }, [errors, clearError]);

  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isSubmitting) return;

      const isValid = validateAll();
      if (!isValid) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateAll, isSubmitting]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    isValid,
    isSubmitting,
    setValues,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    validateField,
    validateAll,
    handleSubmit,
    setSubmitting: setIsSubmitting
  };
};