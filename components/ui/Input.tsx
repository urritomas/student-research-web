import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, fullWidth, className, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'}`}>
        {label && (
          <label className="block text-sm font-medium text-primary-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 
              ${leftIcon ? 'pl-10' : ''} 
              ${rightIcon ? 'pr-10' : ''}
              border rounded-lg
              ${error 
                ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
                : 'border-neutral-300 focus:ring-accent-300 focus:border-accent-300'
              }
              focus:outline-none focus:ring-2
              disabled:bg-neutral-100 disabled:cursor-not-allowed
              placeholder:text-neutral-400
              transition-colors
              ${className || ''}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={`mt-1.5 text-sm ${error ? 'text-error-500' : 'text-neutral-600'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
