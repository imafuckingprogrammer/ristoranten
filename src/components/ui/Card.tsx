'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'large';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', shadow = 'soft', hover = true, children, ...props }, ref) => {
    const baseClasses = 'bg-white border border-border rounded-lg transition-all duration-200';
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    
    const shadowClasses = {
      none: '',
      soft: 'shadow-soft',
      medium: 'shadow-medium',
      large: 'shadow-large',
    };
    
    const classes = [
      baseClasses,
      paddingClasses[padding],
      shadowClasses[shadow],
      hover ? 'hover:shadow-medium hover:-translate-y-0.5' : '',
      className,
    ].join(' ');
    
    const { onAnimationStart, onAnimationEnd, onAnimationIteration, ...restProps } = props;
    
    return (
      <motion.div 
        ref={ref} 
        className={classes} 
        whileHover={hover ? { y: -1 } : {}}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        {...restProps}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;