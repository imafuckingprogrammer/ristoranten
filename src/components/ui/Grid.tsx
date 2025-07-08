'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className = '', cols = 1, gap = 'md', responsive = true, children, ...props }, ref) => {
    const baseClasses = 'grid';
    
    const colsClasses = responsive ? {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
      12: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12',
    } : {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    };
    
    const gapClasses = {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    };
    
    const classes = [
      baseClasses,
      colsClasses[cols],
      gapClasses[gap],
      className,
    ].join(' ');
    
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

export default Grid;