import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Shield,
  Bell
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { BackgroundImage } from '../ui/BackgroundImage';
import { Modal } from '../ui/Modal';
import { supabase } from '../../utils/supabase';
import { Patient, EmergencyAlert } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ANIMATION_VARIANTS } from '../../utils/constants';

// Emergency alerts and SOS functionality
export const AlertsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [sosLoading, setSOSLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchAlertsData();
      setupRealtimeSubscriptions();
    }
  }, [userProfile]);

  const fetchAlertsData = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      // Fetch patients based on user role
      let patientsQuery = supabase.from('patients').select('*');
      
      if (userProfile.role === 'caregiver') {
        patientsQuery = patientsQuery.eq('caregiver_id', userProfile.id);
      } else {
        patientsQuery = patientsQuery.contains('family_members', [userProfile.id]);
      }

      const { data: patientsData } = await patientsQuery.order('created_at', { ascending: false });

      if (patientsData && patientsData.length > 0) {
        setPatients(patientsData);
        
        // Fetch emergency alerts
        const patientIds = patientsData.map(p => p.id);
        const { data: alertsData } = await supabase
          .from('emergency_alerts')
          .select('*')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false });

        if (alertsData) setAlerts(alertsData);
      }
    } catch (error) {
      console.error('Error fetching alerts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const subscription = supabase
      .channel('emergency_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_alerts'
        },
        () => {
          fetchAlertsData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const triggerSOS = async () => {
    if (!selectedPatient) return;
    
    setSOSLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .insert({
          patient_id: selectedPatient,
          triggered_by: userProfile?.id,
          location: location || 'Location not provided',
          status: 'active'
        });

      if (error) throw error;

      setShowSOSModal(false);
      setSelectedPatient('');
      setLocation('');
      fetchAlertsData();
    } catch (error: any) {
      console.error('Error triggering SOS:', error);
      alert('Failed to send emergency alert. Please try again.');
    } finally {
      setSOSLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({
          status: 'resolved',
          resolved_by: userProfile?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlertsData();
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      alert('Failed to resolve alert. Please try again.');
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  };

  if (loading) {
    return (
      <BackgroundImage>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" message="Loading alerts..." />
        </div>
      </BackgroundImage>
    );
  }

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');

  return (
    <BackgroundImage>
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header */}
        <motion.div
          className="text-center py-8"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Emergency Alerts</h1>
          <p className="text-xl text-gray-700 font-medium">
            Monitor and respond to emergency situations
          </p>
        </motion.div>

        {/* SOS Button */}
        <motion.div
          className="text-center"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true} className="inline-block">
            <div className="text-center">
              <motion.button
                onClick={() => setShowSOSModal(true)}
                className="w-32 h-32 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl font-bold"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(239, 68, 68, 0.7)",
                    "0 0 0 20px rgba(239, 68, 68, 0)",
                    "0 0 0 0 rgba(239, 68, 68, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                SOS
              </motion.button>
              <p className="text-gray-600 mt-4 text-lg">Emergency Alert Button</p>
            </div>
          </Card>
        </motion.div>

        {/* Active alerts */}
        {activeAlerts.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={ANIMATION_VARIANTS.fadeIn}
          >
            <Card className="border-red-200 bg-red-50" glass={false}>
              <div className="flex items-center mb-6">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-semibold text-red-900">Active Emergency Alerts</h2>
              </div>
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    className="flex items-center justify-between p-6 bg-white rounded-xl border border-red-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Emergency Alert - {getPatientName(alert.patient_id)}
                        </h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                        {alert.location && (
                          <p className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {alert.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="emergency" size="sm">
                        <Phone className="w-4 h-4 mr-1" />
                        Call 911
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Alert history */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Alert History</h2>
              <div className="flex items-center space-x-2 text-gray-600">
                <Shield className="w-5 h-5" />
                <span className="text-sm">{alerts.length} total alerts</span>
              </div>
            </div>
            
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Emergency Alerts</h3>
                <p>No emergency alerts have been triggered. This is good news!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${
                      alert.status === 'active' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {getPatientName(alert.patient_id)}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                          {alert.location && (
                            <p className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {alert.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          alert.status === 'active' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {alert.status === 'active' ? (
                            <>
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolved
                            </>
                          )}
                        </span>
                        {alert.resolved_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Resolved: {new Date(alert.resolved_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* SOS Modal */}
        <Modal
          isOpen={showSOSModal}
          onClose={() => setShowSOSModal(false)}
          title="🚨 Emergency Alert"
        >
          <div className="space-y-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <p className="text-lg text-gray-700">
                This will immediately notify emergency contacts and caregivers.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
                required
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Living room, Bedroom, Garden..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSOSModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="emergency"
                onClick={triggerSOS}
                loading={sosLoading}
                disabled={!selectedPatient}
                className="flex-1"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Send SOS Alert
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </BackgroundImage>
  );
};