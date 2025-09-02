import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Activity, 
  Clock, 
  AlertTriangle,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Crown,
  Thermometer,
  Smile,
  TrendingUp,
  Users,
  Check
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { BackgroundImage } from '../ui/BackgroundImage';
import { Modal } from '../ui/Modal';
import { HealthLogForm } from '../health/HealthLogForm';
import { supabase } from '../../utils/supabase';
import { Patient, HealthLog, Reminder, EmergencyAlert } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ANIMATION_VARIANTS } from '../../utils/constants';

// Family dashboard for viewing patient updates remotely
export const FamilyDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentLogs, setRecentLogs] = useState<HealthLog[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [showHealthLogForm, setShowHealthLogForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchFamilyData();
      setupRealtimeSubscriptions();
    }
  }, [userProfile]);

  const fetchFamilyData = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      // Fetch patients where this user is in family_members array
      let { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .contains('family_members', [userProfile.id])
        .order('created_at', { ascending: false });

      if (patientsData && patientsData.length > 0) {
        setPatients(patientsData);
        const patientIds = patientsData.map(p => p.id);

        // Fetch recent health logs
        const { data: logsData } = await supabase
          .from('health_logs')
          .select('*')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch active emergency alerts
        const { data: alertsData } = await supabase
          .from('emergency_alerts')
          .select('*')
          .in('patient_id', patientIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        // Fetch upcoming reminders
        const { data: remindersData } = await supabase
          .from('reminders')
          .select('*')
          .in('patient_id', patientIds)
          .eq('completed', false)
          .gte('due_time', new Date().toISOString())
          .order('due_time', { ascending: true })
          .limit(5);

        setRecentLogs(logsData || []);
        setActiveAlerts(alertsData || []);
        setUpcomingReminders(remindersData || []);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
      // Don't clear data on error, just log it
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!userProfile) return;

    const subscription = supabase
      .channel('family_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_logs'
        },
        () => {
          fetchFamilyData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_alerts'
        },
        () => {
          fetchFamilyData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleHealthLogSuccess = (log: HealthLog) => {
    setRecentLogs(prev => [log, ...prev].slice(0, 10));
    setShowHealthLogForm(false);
    setSelectedPatient('');
  };

  const getHealthStatusColor = (type: string, value: string) => {
    switch (type) {
      case 'blood_pressure':
        const [systolic] = value.split('/').map(Number);
        if (systolic < 120) return 'text-green-600 bg-green-50';
        if (systolic < 140) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
      case 'blood_sugar':
        const sugar = Number(value);
        if (sugar < 140) return 'text-green-600 bg-green-50';
        if (sugar < 180) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
      case 'temperature':
        const temp = Number(value);
        if (temp < 99.5) return 'text-green-600 bg-green-50';
        if (temp < 103) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getHealthIcon = (type: string) => {
    switch (type) {
      case 'blood_pressure': return Heart;
      case 'blood_sugar': return Activity;
      case 'temperature': return Thermometer;
      case 'mood': return Smile;
      default: return Activity;
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
          <LoadingSpinner size="lg" message="Loading family dashboard..." />
        </div>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage>
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Welcome section */}
        <motion.div
          className="text-center py-8"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <motion.h1 
            className="text-5xl font-bold text-gray-900 mb-4"
            animate={{ 
              textShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 20px rgba(16, 185, 129, 0.3)", "0 0 0px rgba(16, 185, 129, 0)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Welcome back, {userProfile?.full_name}!
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Stay connected with your loved ones' care
          </motion.p>
        </motion.div>

        {/* Upgrade prompt */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50" glass={false}>
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <Crown className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upgrade to Premium Care</h3>
                  <p className="text-gray-600">Get unlimited patients, advanced analytics, and real-time updates for just $35/month</p>
                </div>
              </div>
              <Button onClick={() => setShowUpgrade(true)} className="whitespace-nowrap">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setShowHealthLogForm(true)}
                className="flex items-center justify-center h-20 text-lg"
                disabled={patients.length === 0}
              >
                <Plus className="w-6 h-6 mr-2" />
                Log Health Data
              </Button>
              
              <Button
                variant="secondary"
                className="flex items-center justify-center h-20 text-lg"
                onClick={() => setShowUpgrade(true)}
              >
                <TrendingUp className="w-6 h-6 mr-2" />
                View Health Trends
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-center h-20 text-lg"
                onClick={() => setShowUpgrade(true)}
              >
                <Calendar className="w-6 h-6 mr-2" />
                Manage Reminders
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Emergency alerts */}
        {activeAlerts.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={ANIMATION_VARIANTS.fadeIn}
          >
            <Card className="border-red-200 bg-red-50" glass={false}>
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-red-900">Active Emergency Alerts</h2>
              </div>
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-white rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Emergency alert for {getPatientName(alert.patient_id)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                      {alert.location && (
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {alert.location}
                        </p>
                      )}
                    </div>
                    <Button variant="emergency" size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      Call 911
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Patient overview cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.stagger}
        >
          {patients.length === 0 ? (
            <div className="col-span-full">
              <Card glass={true}>
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No Patients Available</h3>
                  <p className="mb-4">You haven't been assigned to any patients yet. Ask your caregiver to add you to a patient's family members list.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>How to get access:</strong> Ask your caregiver to add your email address to a patient's family members list in their Patient Management section.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            patients.map((patient) => {
              const patientLogs = recentLogs.filter(log => log.patient_id === patient.id);
              const latestLog = patientLogs[0];
              
              return (
                <motion.div key={patient.id} variants={ANIMATION_VARIANTS.fadeIn}>
                  <Card glass={true} className="h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
                      <span className="text-sm text-gray-500">Age {patient.age}</span>
                    </div>
                    
                    {patient.medical_conditions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Conditions:</p>
                        <div className="flex flex-wrap gap-2">
                          {patient.medical_conditions.map((condition, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {latestLog ? (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Latest Update:</p>
                        <div className="flex items-center justify-between">
                          <span className="capitalize text-gray-900">
                            {latestLog.type.replace('_', ' ')}: {latestLog.value}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(latestLog.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center text-gray-500">
                        No recent health updates
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setSelectedPatient(patient.id);
                        setShowHealthLogForm(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Log Health Data
                    </Button>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Recent activity and reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={ANIMATION_VARIANTS.slideIn}
          >
            <Card glass={true}>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Health Updates</h2>
              
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent health updates</p>
                  <Button 
                    onClick={() => setShowHealthLogForm(true)}
                    className="mt-4"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Health Log
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLogs.slice(0, 5).map((log) => {
                    const Icon = getHealthIcon(log.type);
                    const statusColor = getHealthStatusColor(log.type, log.value);
                    
                    return (
                      <motion.div
                        key={log.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${statusColor}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getPatientName(log.patient_id)}
                            </p>
                            <p className="text-sm text-gray-600 capitalize">
                              {log.type.replace('_', ' ')}: {log.value}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={ANIMATION_VARIANTS.slideIn}
          >
            <Card glass={true}>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upcoming Care Tasks</h2>
              
              {upcomingReminders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming reminders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingReminders.map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{reminder.title}</p>
                          <p className="text-sm text-gray-600">
                            {getPatientName(reminder.patient_id)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(reminder.due_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Emergency contacts */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Emergency Contacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">{patient.emergency_contact}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`tel:${patient.emergency_contact}`)}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Health log modal */}
        <Modal
          isOpen={showHealthLogForm}
          onClose={() => {
            setShowHealthLogForm(false);
            setSelectedPatient('');
          }}
          title="Log Health Data"
        >
          {patients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No patients available to log data for.</p>
              <Button onClick={() => setShowHealthLogForm(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              {!selectedPatient ? (
                <div>
                  <p className="text-gray-600 mb-4">Select a patient to log health data for:</p>
                  <div className="space-y-2">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient.id)}
                        className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">Age: {patient.age}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <HealthLogForm
                  patientId={selectedPatient}
                  onSuccess={handleHealthLogSuccess}
                  onCancel={() => {
                    setShowHealthLogForm(false);
                    setSelectedPatient('');
                  }}
                />
              )}
            </>
          )}
        </Modal>

        {/* Upgrade modal */}
        <Modal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          title="Upgrade to Premium Care"
          size="lg"
        >
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mx-auto">
              <Crown className="w-10 h-10 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Care Plan</h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">$35<span className="text-lg text-gray-600">/month</span></div>
              <p className="text-gray-600">Unlock advanced care management features</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {[
                'Unlimited patients',
                'Advanced health analytics',
                'Real-time family updates',
                'Smart medication reminders',
                'Custom care plans',
                'Priority support',
                'Health trend reports',
                'Mobile app access'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowUpgrade(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => {
                  // This will trigger Stripe integration
                  alert('Redirecting to secure payment setup...');
                  setShowUpgrade(false);
                }}
                className="flex-1"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </BackgroundImage>
  );
};