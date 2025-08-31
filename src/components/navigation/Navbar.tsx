import React from 'react';
import { motion } from 'framer-motion';
import { Heart, LogOut, User, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSignOut: () => void;
}

// Navigation bar with role-based menu items
export const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange, onSignOut }) => {
  const { userProfile } = useAuth();

  const menuItems = userProfile?.role === 'caregiver' 
    ? [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'patients', label: 'Patients' },
        { id: 'health-logs', label: 'Health Logs' },
        { id: 'reminders', label: 'Reminders' },
        { id: 'wellness', label: 'Wellness' }
      ]
    : [
        { id: 'family-dashboard', label: 'Family Dashboard' },
        { id: 'health-overview', label: 'Health Overview' },
        { id: 'alerts', label: 'Alerts' }
      ];

  return (
    <motion.nav
      className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CareEase</span>
            </motion.div>
          </div>

          {/* Navigation menu */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* User profile and actions */}
          <div className="flex items-center space-x-3">
            <motion.button
              className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button>

            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.full_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userProfile?.role}
                </p>
              </div>
            </div>

            <Button
              onClick={onSignOut}
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};