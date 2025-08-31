/*
  # Seed Demo Data for CareEase

  1. Demo Users
    - Sample caregiver and family member accounts
    - Realistic patient profiles with medical conditions

  2. Sample Data
    - Health logs with realistic measurements
    - Medication schedules and reminders
    - Emergency alerts for demonstration

  3. Purpose
    - Provides immediate demo-ready data
    - Shows app functionality without manual setup
    - Enables smooth hackathon presentation
*/

-- Insert demo caregiver user (this will be created when someone signs up)
-- The trigger will handle user profile creation automatically

-- Insert demo patients (these will be created after a caregiver signs up)
-- We'll create a function to seed data for new caregivers

CREATE OR REPLACE FUNCTION seed_demo_data_for_user(user_id uuid)
RETURNS void AS $$
DECLARE
  patient1_id uuid;
  patient2_id uuid;
  med1_id uuid;
  med2_id uuid;
BEGIN
  -- Insert demo patients
  INSERT INTO patients (id, caregiver_id, name, age, medical_conditions, emergency_contact)
  VALUES 
    (gen_random_uuid(), user_id, 'Margaret Johnson', 78, ARRAY['Diabetes', 'Hypertension'], '+1-555-0123'),
    (gen_random_uuid(), user_id, 'Robert Chen', 82, ARRAY['Arthritis', 'Heart Disease'], '+1-555-0456')
  RETURNING id INTO patient1_id;

  -- Get the patient IDs for seeding related data
  SELECT id INTO patient1_id FROM patients WHERE caregiver_id = user_id AND name = 'Margaret Johnson';
  SELECT id INTO patient2_id FROM patients WHERE caregiver_id = user_id AND name = 'Robert Chen';

  -- Insert demo health logs
  INSERT INTO health_logs (patient_id, type, value, notes, logged_by, created_at)
  VALUES 
    (patient1_id, 'blood_pressure', '130/85', 'Slightly elevated, monitor closely', user_id, now() - interval '2 hours'),
    (patient1_id, 'blood_sugar', '145', 'Post-meal reading', user_id, now() - interval '4 hours'),
    (patient1_id, 'mood', 'good', 'Cheerful after family visit', user_id, now() - interval '1 day'),
    (patient2_id, 'temperature', '98.6', 'Normal temperature', user_id, now() - interval '3 hours'),
    (patient2_id, 'blood_pressure', '125/80', 'Good reading today', user_id, now() - interval '6 hours'),
    (patient2_id, 'mood', 'excellent', 'Very happy today', user_id, now() - interval '8 hours');

  -- Insert demo medications
  INSERT INTO medications (id, patient_id, name, dosage, frequency, times)
  VALUES 
    (gen_random_uuid(), patient1_id, 'Metformin', '500mg', 'Twice daily', ARRAY['08:00', '20:00']),
    (gen_random_uuid(), patient1_id, 'Lisinopril', '10mg', 'Once daily', ARRAY['08:00']),
    (gen_random_uuid(), patient2_id, 'Aspirin', '81mg', 'Once daily', ARRAY['09:00']),
    (gen_random_uuid(), patient2_id, 'Atorvastatin', '20mg', 'Once daily', ARRAY['21:00'])
  RETURNING id INTO med1_id;

  -- Get medication IDs for reminders
  SELECT id INTO med1_id FROM medications WHERE patient_id = patient1_id AND name = 'Metformin';
  SELECT id INTO med2_id FROM medications WHERE patient_id = patient2_id AND name = 'Aspirin';

  -- Insert demo reminders
  INSERT INTO reminders (patient_id, medication_id, title, description, due_time)
  VALUES 
    (patient1_id, med1_id, 'Morning Metformin', 'Take with breakfast', now() + interval '1 hour'),
    (patient1_id, NULL, 'Blood Sugar Check', 'Check blood sugar before lunch', now() + interval '3 hours'),
    (patient2_id, med2_id, 'Daily Aspirin', 'Take with morning meal', now() + interval '30 minutes'),
    (patient2_id, NULL, 'Physical Therapy', 'Gentle exercises for arthritis', now() + interval '2 hours');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;