'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'secondary';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'sm', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full border';
    
    const variantClasses = {
      default: 'bg-primary-50 text-primary border-primary/20',
      success: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      error: 'bg-red-50 text-red-700 border-red-200',
      secondary: 'bg-surface text-muted border-border',
    };
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };
    
    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(' ');
    
    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;