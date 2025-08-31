import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  glass?: boolean;
}

// Reusable Card component with consistent styling
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  glass = false
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = glass 
    ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl'
    : 'bg-white border border-gray-100 shadow-lg';
  return (
    <motion.div
      className={`
        ${baseClasses} rounded-2xl
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-xl' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
    >
      {children}
    </motion.div>
  );
};