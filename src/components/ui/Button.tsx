'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-soft hover:shadow-medium';
    
    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary/90',
      secondary: 'bg-surface text-primary border border-border hover:bg-primary hover:text-white',
      outline: 'bg-transparent text-primary border border-border hover:bg-primary hover:text-white',
      danger: 'bg-error text-white hover:bg-error/90',
      success: 'bg-success text-white hover:bg-success/90',
      ghost: 'bg-transparent text-primary hover:bg-surface',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    
    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ');
    
    const { onAnimationStart, onAnimationEnd, onAnimationIteration, ...restProps } = props;
    
    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        {...restProps}
      >
        {loading && (
          <LoadingSpinner size="sm" className="mr-2" />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;