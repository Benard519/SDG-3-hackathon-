/*
  # Update patients table for family member management

  1. Changes
    - Add family_members column to store array of family member user IDs
    - Update RLS policies to allow family members to view assigned patients
  
  2. Security
    - Family members can only view patients they're assigned to
    - Caregivers maintain full control over patient assignments
*/

-- Add family_members column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'family_members'
  ) THEN
    ALTER TABLE patients ADD COLUMN family_members uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Update RLS policies for family member access
DROP POLICY IF EXISTS "Family members can view authorized patients" ON patients;

CREATE POLICY "Family members can view authorized patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY (family_members));

-- Update health logs policy for family members
DROP POLICY IF EXISTS "Family members can view health logs for authorized patients" ON health_logs;

CREATE POLICY "Family members can view health logs for authorized patients"
  ON health_logs
  FOR SELECT
  TO authenticated
  USING (patient_id IN (
    SELECT id FROM patients WHERE auth.uid() = ANY (family_members)
  ));

-- Allow family members to insert health logs for their assigned patients
CREATE POLICY "Family members can log health data for assigned patients"
  ON health_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id IN (
    SELECT id FROM patients WHERE auth.uid() = ANY (family_members)
  ));