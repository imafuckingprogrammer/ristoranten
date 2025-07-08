'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = '', size = 'lg', children, ...props }, ref) => {
    const baseClasses = 'mx-auto px-4 sm:px-6 lg:px-8';
    
    const sizeClasses = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };
    
    const classes = [
      baseClasses,
      sizeClasses[size],
      className,
    ].join(' ');
    
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export default Container;