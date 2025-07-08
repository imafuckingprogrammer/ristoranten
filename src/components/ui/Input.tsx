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
    const baseClasses = 'px-4 py-3 border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-all duration-200 bg-white text-foreground placeholder:text-muted shadow-soft hover:shadow-medium';
    const errorClasses = error ? 'border-error focus-visible:ring-error focus-visible:border-error' : '';
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
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
            transition={{ duration: 0.15 }}
            className="mt-2 text-sm text-error font-medium"
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