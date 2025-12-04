import { useState, useCallback } from 'preact/hooks';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Custom hook for form validation
 * Provides a better alternative to HTML5 validation with custom error messages
 */
export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Min length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      return `Must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      return `Must be at most ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      return 'Invalid format';
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validate = useCallback((formData: { [key: string]: any }): boolean => {
    const newErrors: ValidationErrors = {};
    const newTouched: { [key: string]: boolean } = {};
    let isValid = true;

    Object.keys(rules).forEach((name) => {
      const error = validateField(name, formData[name]);
      newTouched[name] = true; // Mark all validated fields as touched
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(prev => ({ ...prev, ...newTouched })); // Merge with existing touched state
    return isValid;
  }, [rules, validateField]);

  const validateSingleField = useCallback((name: string, value: any) => {
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
    return !error;
  }, [validateField]);

  const handleBlur = useCallback((name: string, value: any) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateSingleField(name, value);
  }, [validateSingleField]);

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validate,
    validateSingleField,
    handleBlur,
    clearError,
    clearAllErrors,
  };
}
