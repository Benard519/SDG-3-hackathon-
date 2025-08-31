import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Activity, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { BackgroundImage } from '../ui/BackgroundImage';
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
      
      // Fetch patients where user is in family_members array
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .contains('family_members', [userProfile.id]);

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

        if (logsData) setRecentLogs(logsData);
        if (alertsData) setActiveAlerts(alertsData);
        if (remindersData) setUpcomingReminders(remindersData);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!userProfile) return;

    // Subscribe to health logs updates
    const healthLogsSubscription = supabase
      .channel('family_health_logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_logs'
        },
        () => {
          fetchFamilyData(); // Refresh data on any change
        }
      )
      .subscribe();

    // Subscribe to emergency alerts
    const alertsSubscription = supabase
      .channel('family_alerts')
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
      healthLogsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
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

  if (patients.length === 0) {
    return (
      <BackgroundImage>
        <div className="max-w-4xl mx-auto p-4">
          <Card className="text-center py-12" glass={true}>
            <Heart className="w-16 h-16 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Patients Assigned
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have access to any patient data yet. Please contact your caregiver to be added as a family member.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </Card>
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
            Family Dashboard
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
                      Call
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
          {patients.map((patient) => {
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
                    <div className="bg-gray-50 rounded-xl p-4">
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
                    <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
                      No recent health updates
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
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
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLogs.slice(0, 5).map((log) => {
                    const statusColor = getHealthStatusColor(log.type, log.value);
                    
                    return (
                      <motion.div
                        key={log.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        whileHover={{ scale: 1.02 }}
                      >
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
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                          {log.value}
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

        {/* Quick contact section */}
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
                    <p className="text-sm text-gray-600">Emergency Contact</p>
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
      </div>
    </BackgroundImage>
  );
};