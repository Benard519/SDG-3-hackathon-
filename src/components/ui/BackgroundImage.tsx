import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundImageProps {
  children: React.ReactNode;
  overlay?: boolean;
}

// Background component with calming family image
export const BackgroundImage: React.FC<BackgroundImageProps> = ({ 
  children, 
  overlay = true 
}) => {
  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/3768131/pexels-photo-3768131.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`,
        }}
      >
        {/* Gradient overlay for better readability */}
        {overlay && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-50/95 via-white/90 to-green-50/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};