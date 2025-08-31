// Type definitions for CareEase application
export interface User {
  id: string;
  email: string;
  role: 'caregiver' | 'family';
  full_name: string;
  created_at: string;
}

export interface Patient {
  id: string;
  caregiver_id: string;
  name: string;
  age: number;
  medical_conditions: string[];
  emergency_contact: string;
  created_at: string;
}

export interface HealthLog {
  id: string;
  patient_id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'temperature' | 'mood';
  value: string;
  notes?: string;
  logged_by: string;
  created_at: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  created_at: string;
}

export interface Reminder {
  id: string;
  patient_id: string;
  medication_id?: string;
  title: string;
  description: string;
  due_time: string;
  completed: boolean;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  patient_id: string;
  triggered_by: string;
  location?: string;
  status: 'active' | 'resolved';
  created_at: string;
}

export interface CaregiverTip {
  id: string;
  title: string;
  content: string;
  category: 'stress' | 'health' | 'communication' | 'self_care';
}