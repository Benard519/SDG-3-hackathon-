import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Heart, 
  Activity, 
  Calendar, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Thermometer,
  Smile,
  AlertCircle,
  Crown
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { BackgroundImage } from './ui/BackgroundImage';
import { HealthLogForm } from './health/HealthLogForm';
import { Modal } from './ui/Modal';
import { supabase } from '../utils/supabase';
import { Patient, HealthLog, Reminder } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ANIMATION_VARIANTS } from '../utils/constants';

// Main dashboard component with overview and quick actions
export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentLogs, setRecentLogs] = useState<HealthLog[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [showHealthLogForm, setShowHealthLogForm] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);

  const fetchDashboardData = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      // Fetch patients for caregivers
      let { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .eq('caregiver_id', userProfile?.id)
        .order('created_at', { ascending: false });

      // Create demo data if none exists
      if (!patientsData || patientsData.length === 0) {
        const { data: newPatient } = await supabase
          .from('patients')
          .insert({
            caregiver_id: userProfile.id,
            name: 'Eleanor Johnson',
            age: 78,
            medical_conditions: ['Diabetes', 'Hypertension'],
            emergency_contact: '+1 (555) 123-4567',
            family_members: []
          })
          .select()
          .single();

        if (newPatient) {
          patientsData = [newPatient];
          
          // Add demo health logs
          await supabase.from('health_logs').insert([
            {
              patient_id: newPatient.id,
              type: 'blood_pressure',
              value: '120/80',
              logged_by: userProfile.id,
              created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
              patient_id: newPatient.id,
              type: 'blood_sugar',
              value: '95',
              logged_by: userProfile.id,
              created_at: new Date(Date.now() - 43200000).toISOString()
            }
          ]);
        }
      }

      if (patientsData) {
        setPatients(patientsData);
        
        if (patientsData.length > 0) {
          // Fetch recent health logs
          const patientIds = patientsData.map(p => p.id);
          const { data: logsData } = await supabase
            .from('health_logs')
            .select('*')
            .in('patient_id', patientIds)
            .order('created_at', { ascending: false })
            .limit(5);

          // Fetch upcoming reminders
          const { data: remindersData } = await supabase
            .from('reminders')
            .select('*')
            .in('patient_id', patientIds)
            .eq('completed', false)
            .order('due_time', { ascending: true })
            .limit(5);

          setRecentLogs(logsData || []);
          setUpcomingReminders(remindersData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setPatients([]);
      setRecentLogs([]);
      setUpcomingReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHealthLogSuccess = (log: HealthLog) => {
    setRecentLogs(prev => [log, ...prev].slice(0, 5));
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

  if (loading) {
    return (
      <BackgroundImage>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" message="Loading your dashboard..." />
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
            textShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 20px rgba(59, 130, 246, 0.3)", "0 0 0px rgba(59, 130, 246, 0)"]
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
          Here's what's happening with your patients today
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
                <p className="text-gray-600">Get unlimited patients, advanced analytics, and priority support for just $35/month</p>
              </div>
            </div>
            <Button onClick={() => setShowUpgrade(true)} className="whitespace-nowrap">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={ANIMATION_VARIANTS.stagger}
      >
        <motion.div variants={ANIMATION_VARIANTS.fadeIn}>
          <Card className="text-center" glass={true}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{patients.length}</h3>
            <p className="text-gray-600">Total Patients</p>
          </Card>
        </motion.div>

        <motion.div variants={ANIMATION_VARIANTS.fadeIn}>
          <Card className="text-center" glass={true}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{recentLogs.length}</h3>
            <p className="text-gray-600">Recent Health Logs</p>
          </Card>
        </motion.div>

        <motion.div variants={ANIMATION_VARIANTS.fadeIn}>
          <Card className="text-center" glass={true}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{upcomingReminders.length}</h3>
            <p className="text-gray-600">Upcoming Reminders</p>
          </Card>
        </motion.div>

        <motion.div variants={ANIMATION_VARIANTS.fadeIn}>
          <Card className="text-center" glass={true}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-gray-600">Active Alerts</p>
          </Card>
        </motion.div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Calendar className="w-6 h-6 mr-2" />
              View Schedule
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center justify-center h-20 text-lg"
              onClick={() => setShowUpgrade(true)}
            >
              <TrendingUp className="w-6 h-6 mr-2" />
              Health Reports
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Recent health logs and reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.slideIn}
        >
          <Card glass={true}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Health Logs</h2>
            
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No health logs yet. Start logging health data!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => {
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
                          <p className="font-medium text-gray-900 capitalize">
                            {log.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(log.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{log.value}</span>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upcoming Reminders</h2>
            
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming reminders.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingReminders.map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">{reminder.title}</p>
                        <p className="text-sm text-gray-600">{reminder.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-yellow-700">
                      {new Date(reminder.due_time).toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

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
            <p className="text-gray-600 mb-4">You need to add a patient first before logging health data.</p>
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
            <p className="text-gray-600">Unlock unlimited patients and advanced care management features</p>
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
                alert('Redirecting to secure payment setup...');
                setShowUpgrade(false);
              }}
              className="flex-1"
            >
              <Crown className="w-4 h-4 mr-2" />
              Subscribe for $35/month
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </BackgroundImage>
  );
};