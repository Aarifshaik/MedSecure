'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/lib/types';
import { useContract } from '@/hooks/use-contract';
import { PatientCard } from './patient-card';
import { Loader2 } from 'lucide-react';

interface PatientListProps {
  onPatientSelect?: (patient: Patient) => void;
}

export function PatientList({ onPatientSelect }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { getRegisteredPatients } = useContract();

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      try {
        const patientList = await getRegisteredPatients();
        setPatients(patientList);
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [getRegisteredPatients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading patients...</span>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No registered patients found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Registered Patients ({patients.length})
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient, index) => (
          <PatientCard
            key={patient.address || index}
            patient={patient}
            onClick={onPatientSelect}
          />
        ))}
      </div>
    </div>
  );
}