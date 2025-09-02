import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Phone, 
  Mail,
  Crown,
  AlertTriangle,
  UserPlus,
  Save,
  X
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { BackgroundImage } from '../ui/BackgroundImage';
import { supabase } from '../../utils/supabase';
import { Patient, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ANIMATION_VARIANTS } from '../../utils/constants';

export const PatientManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientForFamily, setSelectedPatientForFamily] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    medical_conditions: '',
    emergency_contact: '',
    family_members: [] as string[]
  });
  const [familyEmail, setFamilyEmail] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchPatients();
      fetchFamilyMembers();
    }
  }, [userProfile]);

  const fetchPatients = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('caregiver_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'family');

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
      setFamilyMembers([]);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check patient limit for free plan
    if (patients.length >= 2) {
      setShowUpgrade(true);
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          caregiver_id: userProfile?.id,
          name: patientForm.name,
          age: parseInt(patientForm.age),
          medical_conditions: patientForm.medical_conditions.split(',').map(c => c.trim()).filter(c => c),
          emergency_contact: patientForm.emergency_contact,
          family_members: patientForm.family_members
        })
        .select()
        .single();

      if (error) throw error;

      setPatients(prev => [data, ...prev]);
      setShowAddPatient(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding patient:', error);
      alert('Failed to add patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({
          name: patientForm.name,
          age: parseInt(patientForm.age),
          medical_conditions: patientForm.medical_conditions.split(',').map(c => c.trim()).filter(c => c),
          emergency_contact: patientForm.emergency_contact,
          family_members: patientForm.family_members
        })
        .eq('id', editingPatient.id)
        .select()
        .single();

      if (error) throw error;

      setPatients(prev => prev.map(p => p.id === editingPatient.id ? data : p));
      setShowEditPatient(false);
      setEditingPatient(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      alert('Failed to update patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== patientId));
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient. Please try again.');
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForFamily || !familyEmail) return;

    setSaving(true);
    try {
      // Find family member by email
      const { data: familyUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', familyEmail)
        .eq('role', 'family')
        .single();

      if (userError || !familyUser) {
        alert('Family member not found. Please make sure they have created a family account.');
        setSaving(false);
        return;
      }

      // Get current patient
      const patient = patients.find(p => p.id === selectedPatientForFamily);
      if (!patient) {
        setSaving(false);
        return;
      }

      // Add family member to patient
      const updatedFamilyMembers = [...(patient.family_members || []), familyUser.id];

      const { error } = await supabase
        .from('patients')
        .update({ family_members: updatedFamilyMembers })
        .eq('id', selectedPatientForFamily);

      if (error) throw error;

      // Update local state
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientForFamily 
          ? { ...p, family_members: updatedFamilyMembers }
          : p
      ));

      setShowAddFamily(false);
      setSelectedPatientForFamily('');
      setFamilyEmail('');
      alert('Family member added successfully!');
    } catch (error: any) {
      console.error('Error adding family member:', error);
      alert('Failed to add family member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sendFamilyAlert = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .insert({
          patient_id: patientId,
          triggered_by: userProfile?.id,
          location: 'Alert sent by caregiver',
          status: 'active'
        });

      if (error) throw error;
      alert('Emergency alert sent to family members!');
    } catch (error: any) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert. Please try again.');
    }
  };

  const resetForm = () => {
    setPatientForm({
      name: '',
      age: '',
      medical_conditions: '',
      emergency_contact: '',
      family_members: []
    });
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setPatientForm({
      name: patient.name,
      age: patient.age.toString(),
      medical_conditions: patient.medical_conditions.join(', '),
      emergency_contact: patient.emergency_contact || '',
      family_members: patient.family_members || []
    });
    setShowEditPatient(true);
  };

  const getFamilyMemberName = (userId: string) => {
    const member = familyMembers.find(m => m.id === userId);
    return member?.full_name || 'Unknown';
  };

  if (loading) {
    return (
      <BackgroundImage>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" message="Loading patients..." />
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Patient Management</h1>
          <p className="text-xl text-gray-700 font-medium">
            Manage your patients and their care information
          </p>
        </motion.div>

        {/* Upgrade prompt for patient limit */}
        {patients.length >= 2 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={ANIMATION_VARIANTS.fadeIn}
          >
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50" glass={false}>
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Patient Limit Reached</h3>
                    <p className="text-gray-600">You've reached the 2-patient limit for the free plan. Upgrade to add more patients.</p>
                  </div>
                </div>
                <Button onClick={() => setShowUpgrade(true)} className="whitespace-nowrap">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade for $35/month
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Add patient button */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Patients</h2>
                <p className="text-gray-600">
                  {patients.length}/2 patients (Free Plan)
                </p>
              </div>
              <Button
                onClick={() => {
                  if (patients.length >= 2) {
                    setShowUpgrade(true);
                  } else {
                    setShowAddPatient(true);
                  }
                }}
                disabled={patients.length >= 2}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Patient
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Patients list */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.stagger}
        >
          {patients.map((patient) => (
            <motion.div key={patient.id} variants={ANIMATION_VARIANTS.fadeIn}>
              <Card glass={true}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-gray-600">Age: {patient.age}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(patient)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="emergency"
                      size="sm"
                      onClick={() => handleDeletePatient(patient.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {patient.medical_conditions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Medical Conditions:</p>
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

                {patient.emergency_contact && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Emergency Contact:</p>
                    <p className="text-gray-900">{patient.emergency_contact}</p>
                  </div>
                )}

                {patient.family_members && patient.family_members.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Family Members:</p>
                    <div className="space-y-1">
                      {patient.family_members.map((memberId) => (
                        <span
                          key={memberId}
                          className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mr-2"
                        >
                          {getFamilyMemberName(memberId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedPatientForFamily(patient.id);
                      setShowAddFamily(true);
                    }}
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Family
                  </Button>
                  <Button
                    variant="emergency"
                    size="sm"
                    onClick={() => sendFamilyAlert(patient.id)}
                    className="flex-1"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Alert Family
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}

          {patients.length === 0 && (
            <motion.div
              className="col-span-full"
              variants={ANIMATION_VARIANTS.fadeIn}
            >
              <Card glass={true} className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Patients Yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your first patient to begin care management</p>
                <Button onClick={() => setShowAddPatient(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Patient
                </Button>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Add Patient Modal */}
        <Modal
          isOpen={showAddPatient}
          onClose={() => {
            setShowAddPatient(false);
            resetForm();
          }}
          title="Add New Patient"
        >
          <form onSubmit={handleAddPatient} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={patientForm.name}
                onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                value={patientForm.age}
                onChange={(e) => setPatientForm(prev => ({ ...prev, age: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="120"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions (comma-separated)
              </label>
              <input
                type="text"
                value={patientForm.medical_conditions}
                onChange={(e) => setPatientForm(prev => ({ ...prev, medical_conditions: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Diabetes, Hypertension, Arthritis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={patientForm.emergency_contact}
                onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddPatient(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Patient Modal */}
        <Modal
          isOpen={showEditPatient}
          onClose={() => {
            setShowEditPatient(false);
            setEditingPatient(null);
            resetForm();
          }}
          title="Edit Patient"
        >
          <form onSubmit={handleEditPatient} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={patientForm.name}
                onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                value={patientForm.age}
                onChange={(e) => setPatientForm(prev => ({ ...prev, age: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="120"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions (comma-separated)
              </label>
              <input
                type="text"
                value={patientForm.medical_conditions}
                onChange={(e) => setPatientForm(prev => ({ ...prev, medical_conditions: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Diabetes, Hypertension, Arthritis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={patientForm.emergency_contact}
                onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditPatient(false);
                  setEditingPatient(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Family Member Modal */}
        <Modal
          isOpen={showAddFamily}
          onClose={() => {
            setShowAddFamily(false);
            setSelectedPatientForFamily('');
            setFamilyEmail('');
          }}
          title="Add Family Member"
        >
          <form onSubmit={handleAddFamilyMember} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Member Email
              </label>
              <input
                type="email"
                value={familyEmail}
                onChange={(e) => setFamilyEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="family@example.com"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                The family member must have already created a family account
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddFamily(false);
                  setSelectedPatientForFamily('');
                  setFamilyEmail('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                className="flex-1"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Family Member
              </Button>
            </div>
          </form>
        </Modal>

        {/* Upgrade Modal */}
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