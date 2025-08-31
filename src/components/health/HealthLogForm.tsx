import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Thermometer, Activity, Smile } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../utils/supabase';
import { HealthLog } from '../../types';

interface HealthLogFormProps {
  patientId: string;
  onSuccess: (log: HealthLog) => void;
  onCancel: () => void;
}

// Health logging form with different metric types
export const HealthLogForm: React.FC<HealthLogFormProps> = ({
  patientId,
  onSuccess,
  onCancel
}) => {
  const [type, setType] = useState<'blood_pressure' | 'blood_sugar' | 'temperature' | 'mood'>('blood_pressure');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [temperature, setTemperature] = useState('');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const healthTypes = [
    { id: 'blood_pressure', label: 'Blood Pressure', icon: Heart, color: 'text-red-600' },
    { id: 'blood_sugar', label: 'Blood Sugar', icon: Activity, color: 'text-blue-600' },
    { id: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-orange-600' },
    { id: 'mood', label: 'Mood', icon: Smile, color: 'text-green-600' }
  ];

  const moodOptions = [
    { value: 'excellent', label: '😊 Excellent', color: 'bg-green-100 text-green-800' },
    { value: 'good', label: '🙂 Good', color: 'bg-blue-100 text-blue-800' },
    { value: 'neutral', label: '😐 Neutral', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'poor', label: '😔 Poor', color: 'bg-orange-100 text-orange-800' },
    { value: 'very_poor', label: '😢 Very Poor', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let value = '';
      
      switch (type) {
        case 'blood_pressure':
          value = `${systolic}/${diastolic}`;
          break;
        case 'blood_sugar':
          value = bloodSugar;
          break;
        case 'temperature':
          value = temperature;
          break;
        case 'mood':
          value = mood;
          break;
      }

      const { data, error } = await supabase
        .from('health_logs')
        .insert({
          patient_id: patientId,
          type,
          value,
          notes: notes || null,
          logged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      onSuccess(data);
    } catch (error: any) {
      console.error('Error saving health log:', error);
      alert('Failed to save health log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getValue = () => {
    switch (type) {
      case 'blood_pressure':
        return systolic && diastolic ? `${systolic}/${diastolic}` : '';
      case 'blood_sugar':
        return bloodSugar;
      case 'temperature':
        return temperature;
      case 'mood':
        return mood;
      default:
        return '';
    }
  };

  const isValid = getValue() !== '';

  return (
    <Card className="max-w-2xl mx-auto" glass={true}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Log Health Metric</h2>
        <p className="text-gray-600">Record a new health measurement or observation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Health type selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Health Metric
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {healthTypes.map((healthType) => {
              const Icon = healthType.icon;
              return (
                <motion.button
                  key={healthType.id}
                  type="button"
                  onClick={() => setType(healthType.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === healthType.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${healthType.color}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {healthType.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Value input based on selected type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Measurement
          </label>
          
          {type === 'blood_pressure' && (
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Systolic"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  min="50"
                  max="250"
                  required
                />
                <span className="text-xs text-gray-500 mt-1">Top number</span>
              </div>
              <div className="flex items-center text-2xl text-gray-400">/</div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Diastolic"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  min="30"
                  max="150"
                  required
                />
                <span className="text-xs text-gray-500 mt-1">Bottom number</span>
              </div>
            </div>
          )}

          {type === 'blood_sugar' && (
            <div>
              <input
                type="number"
                placeholder="Blood sugar level"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                min="20"
                max="500"
                required
              />
              <span className="text-xs text-gray-500 mt-1">mg/dL</span>
            </div>
          )}

          {type === 'temperature' && (
            <div>
              <input
                type="number"
                step="0.1"
                placeholder="Body temperature"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                min="90"
                max="110"
                required
              />
              <span className="text-xs text-gray-500 mt-1">°F</span>
            </div>
          )}

          {type === 'mood' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moodOptions.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    mood === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{option.label}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or observations..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            rows={3}
          />
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!isValid}
            className="flex-1"
          >
            Save Health Log
          </Button>
        </div>
      </form>
    </Card>
  );
};