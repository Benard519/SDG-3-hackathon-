/*
  # CareEase Database Schema

  1. New Tables
    - `users` - User profiles with role-based access (caregiver/family)
    - `patients` - Patient information managed by caregivers
    - `health_logs` - Health measurements and observations
    - `medications` - Medication information for patients
    - `reminders` - Medication and care reminders
    - `emergency_alerts` - SOS alerts and emergency notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Caregivers can manage their patients
    - Family members can view patient data they're authorized for

  3. Features
    - Real-time subscriptions for family dashboard updates
    - Comprehensive health tracking with multiple metrics
    - Emergency alert system with location tracking
*/

-- Create users table for extended profile information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('caregiver', 'family')),
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  medical_conditions text[] DEFAULT '{}',
  emergency_contact text,
  family_members uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create health_logs table
CREATE TABLE IF NOT EXISTS health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('blood_pressure', 'blood_sugar', 'temperature', 'mood')),
  value text NOT NULL,
  notes text,
  logged_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  times text[] NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_time timestamptz NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  triggered_by uuid NOT NULL REFERENCES users(id),
  location text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for patients table
CREATE POLICY "Caregivers can manage their patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "Family members can view authorized patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(family_members));

-- RLS Policies for health_logs table
CREATE POLICY "Caregivers can manage health logs for their patients"
  ON health_logs
  FOR ALL
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Family members can view health logs for authorized patients"
  ON health_logs
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth.uid() = ANY(family_members)
    )
  );

-- RLS Policies for medications table
CREATE POLICY "Caregivers can manage medications for their patients"
  ON medications
  FOR ALL
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Family members can view medications for authorized patients"
  ON medications
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth.uid() = ANY(family_members)
    )
  );

-- RLS Policies for reminders table
CREATE POLICY "Caregivers can manage reminders for their patients"
  ON reminders
  FOR ALL
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Family members can view reminders for authorized patients"
  ON reminders
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth.uid() = ANY(family_members)
    )
  );

-- RLS Policies for emergency_alerts table
CREATE POLICY "Users can manage emergency alerts for accessible patients"
  ON emergency_alerts
  FOR ALL
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients 
      WHERE caregiver_id = auth.uid() OR auth.uid() = ANY(family_members)
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_caregiver_id ON patients(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_patient_id ON health_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_created_at ON health_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_time ON reminders(due_time);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_patient_id ON emergency_alerts(patient_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'caregiver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();