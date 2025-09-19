'use client';

import { Patient } from '@/lib/types';
import { User, Database, Calendar } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onClick?: (patient: Patient) => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={() => onClick?.(patient)}
    >
      <div className="flex items-start space-x-3">
        <div className="bg-gray-100 p-2 rounded-full">
          <User className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">
            {patient.name || formatAddress(patient.address)}
          </div>
          {patient.name && (
            <div className="text-xs text-gray-500 font-mono">
              {formatAddress(patient.address)}
            </div>
          )}
          <div className="mt-2 space-y-1 text-sm text-gray-500">
            {patient.age && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Age: {patient.age}</span>
              </div>
            )}
            {patient.phoneNumber && (
              <div className="flex items-center space-x-1">
                <span>📞 {patient.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Database className="w-3 h-3" />
              <span>{patient.dataCount || 0} records</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Registered {formatDate(patient.registeredAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}