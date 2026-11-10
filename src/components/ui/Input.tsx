import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className={`form-group ${error ? 'has-error' : ''}`}>
        {label ? (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required ? <span className="text-danger"> *</span> : null}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`form-input ${className}`}
          {...props}
        />
        {hint && !error ? <span className="form-hint">{hint}</span> : null}
        {error ? <span className="form-error">{error}</span> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
