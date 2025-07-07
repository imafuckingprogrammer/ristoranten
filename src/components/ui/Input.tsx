'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, fullWidth = false, ...props }, ref) => {
    const baseClasses = 'px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-black placeholder:text-gray-500';
    const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';
    const widthClasses = fullWidth ? 'w-full' : '';
    
    const classes = [
      baseClasses,
      errorClasses,
      widthClasses,
      className,
    ].join(' ');
    
    return (
      <motion.div 
        className={fullWidth ? 'w-full' : ''}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label && (
          <label className="block text-sm font-semibold text-black mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={classes}
          {...props}
        />
        {error && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-sm text-red-600 font-medium"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

Input.displayName = 'Input';

export default Input;