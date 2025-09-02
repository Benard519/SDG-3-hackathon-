import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/auth/AuthForm';
import { SubscriptionPlans } from './components/payment/SubscriptionPlans';
import { PatientManagement } from './components/patients/PatientManagement';
import { Navbar } from './components/navigation/Navbar';
import { Dashboard } from './components/Dashboard';
import { FamilyDashboard } from './components/family/FamilyDashboard';
import { HealthOverview } from './components/health/HealthOverview';
import { AlertsPage } from './components/alerts/AlertsPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { BackgroundImage } from './components/ui/BackgroundImage';

function App() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showSubscription, setShowSubscription] = useState(false);
  
  const isAuthenticated = user && userProfile;
  
  // Reset to dashboard when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(userProfile?.role === 'family' ? 'family-dashboard' : 'dashboard');
    }
  }, [isAuthenticated, userProfile]);

  // Handle subscription plan selection
  const handlePlanSelection = (planId: string) => {
    if (planId === 'free') {
      setShowSubscription(false);
      return;
    }
    
    // For paid plans, redirect to Stripe setup
    alert('Redirecting to secure payment setup...');
    // This will be replaced with actual Stripe integration
  };
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <BackgroundImage>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading CareEase..." />
        </div>
      </BackgroundImage>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthForm onSuccess={() => setShowSubscription(true)} />
    );
  }

  // Show subscription plans for new users
  if (showSubscription) {
    return (
      <SubscriptionPlans onSelectPlan={handlePlanSelection} />
    );
  }
  // Main application interface
  return (
    <div className="min-h-screen">
      <Navbar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onSignOut={signOut}
      />
      
      <main className="pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeInOut",
              type: "spring",
              stiffness: 100
            }}
          >
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'family-dashboard' && <FamilyDashboard />}
            {currentPage === 'health-overview' && <HealthOverview />}
            {currentPage === 'alerts' && <AlertsPage />}
            
            {/* Placeholder pages for other navigation items */}
            {!['dashboard', 'family-dashboard', 'health-overview', 'alerts'].includes(currentPage) && (
              <BackgroundImage>
                <div className="max-w-7xl mx-auto p-4">
                  <motion.div 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.h1 
                      className="text-4xl font-bold text-gray-900 mb-4 capitalize"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      {currentPage.replace('-', ' ')}
                    </motion.h1>
                    <motion.p 
                      className="text-gray-600 mb-8 text-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      This section is coming soon! For now, you can use the Dashboard to manage your patients.
                    </motion.p>
                    <motion.button
                      onClick={() => setCurrentPage('dashboard')}
                      className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-lg font-medium"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      Back to Dashboard
                    </motion.button>
                  </motion.div>
                </div>
              </BackgroundImage>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;