import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Heart, Activity, Thermometer, Smile, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { BackgroundImage } from '../ui/BackgroundImage';
import { supabase } from '../../utils/supabase';
import { Patient, HealthLog } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ANIMATION_VARIANTS } from '../../utils/constants';

// Health overview with charts and trends
export const HealthOverview: React.FC = () => {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('blood_pressure');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchHealthData();
    }
  }, [userProfile]);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0].id);
    }
  }, [patients]);

  const fetchHealthData = async () => {
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
        
        // Fetch health logs for all patients
        const patientIds = patientsData.map(p => p.id);
        const { data: logsData } = await supabase
          .from('health_logs')
          .select('*')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false })
          .limit(100);

        if (logsData) setHealthLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!selectedPatient) return [];
    
    const patientLogs = healthLogs
      .filter(log => log.patient_id === selectedPatient && log.type === selectedMetric)
      .slice(0, 10)
      .reverse();

    return patientLogs.map(log => {
      let value = 0;
      
      if (selectedMetric === 'blood_pressure') {
        const [systolic] = log.value.split('/').map(Number);
        value = systolic;
      } else if (selectedMetric === 'mood') {
        const moodValues = { 'very_poor': 1, 'poor': 2, 'neutral': 3, 'good': 4, 'excellent': 5 };
        value = moodValues[log.value as keyof typeof moodValues] || 3;
      } else {
        value = parseFloat(log.value);
      }

      return {
        date: new Date(log.created_at).toLocaleDateString(),
        value,
        notes: log.notes
      };
    });
  };

  const healthMetrics = [
    { id: 'blood_pressure', label: 'Blood Pressure', icon: Heart, color: '#EF4444', unit: 'mmHg' },
    { id: 'blood_sugar', label: 'Blood Sugar', icon: Activity, color: '#3B82F6', unit: 'mg/dL' },
    { id: 'temperature', label: 'Temperature', icon: Thermometer, color: '#F97316', unit: '°F' },
    { id: 'mood', label: 'Mood', icon: Smile, color: '#10B981', unit: 'Score' }
  ];

  const selectedMetricInfo = healthMetrics.find(m => m.id === selectedMetric);

  if (loading) {
    return (
      <BackgroundImage>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" message="Loading health overview..." />
        </div>
      </BackgroundImage>
    );
  }

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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Health Overview</h1>
          <p className="text-xl text-gray-700 font-medium">
            Track health trends and patterns over time
          </p>
        </motion.div>

        {/* Patient and metric selection */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Patient
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                >
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Health Metric
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {healthMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <button
                        key={metric.id}
                        onClick={() => setSelectedMetric(metric.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedMetric === metric.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: metric.color }} />
                        <span className="text-xs font-medium text-gray-900">
                          {metric.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Health trend chart */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedMetricInfo?.label} Trends
              </h2>
              <div className="flex items-center space-x-2 text-gray-600">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Last 10 readings</span>
              </div>
            </div>
            
            <div className="h-80">
              {getChartData().length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No data available for this metric</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={selectedMetricInfo?.color}
                      strokeWidth={3}
                      dot={{ fill: selectedMetricInfo?.color, strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: selectedMetricInfo?.color, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Health summary stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.stagger}
        >
          {healthMetrics.map((metric) => {
            const Icon = metric.icon;
            const metricLogs = healthLogs.filter(log => 
              log.patient_id === selectedPatient && log.type === metric.id
            );
            const latestLog = metricLogs[0];
            
            return (
              <motion.div key={metric.id} variants={ANIMATION_VARIANTS.fadeIn}>
                <Card className="text-center" glass={true}>
                  <div 
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                    style={{ backgroundColor: `${metric.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: metric.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {metric.label}
                  </h3>
                  {latestLog ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {latestLog.value}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(latestLog.created_at).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No data</p>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </BackgroundImage>
  );
};