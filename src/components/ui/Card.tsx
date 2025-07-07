'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', shadow = 'sm', hover = true, children, ...props }, ref) => {
    const baseClasses = 'bg-white border border-black rounded-lg transition-all duration-200';
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    
    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    };
    
    const classes = [
      baseClasses,
      paddingClasses[padding],
      shadowClasses[shadow],
      hover ? 'hover:shadow-lg hover:border-2' : '',
      className,
    ].join(' ');
    
    return (
      <motion.div 
        ref={ref} 
        className={classes} 
        whileHover={hover ? { y: -2 } : {}}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;