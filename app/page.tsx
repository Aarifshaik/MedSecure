'use client';

import { useState, useEffect } from 'react';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { RoleBadge } from '@/components/role-badge';
import { PatientList } from '@/components/patient-list';
import { UploadModal } from '@/components/upload-modal';
import { GrantAccessModal } from '@/components/grant-access-modal';
import { RegisterPatientModal } from '@/components/register-patient-modal';
import { EventLog } from '@/components/event-log';
import { FetchFileButton } from '@/components/fetch-file-button';
import { DebugInfo } from '@/components/debug-info';
import { useWallet } from '@/hooks/use-wallet';
import { useContract } from '@/hooks/use-contract';
import { useToast } from '@/components/ui/toast';
import { UserRole, DataEntry, Patient } from '@/lib/types';
import { Plus, Upload, Share2, FileText, Shield, AlertTriangle } from 'lucide-react';

export default function Home() {
  const { isConnected, account, role, connect } = useWallet();
  const { getPatientData } = useContract();
  const { addToast, ToastContainer } = useToast();

  // Debug: Log the current role
  console.log('Current role:', role);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientData, setPatientData] = useState<DataEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load patient data when patient is selected
  useEffect(() => {
    const loadPatientData = async () => {
      if (!selectedPatient) return;
      
      setLoadingData(true);
      try {
        const data = await getPatientData(selectedPatient.address);
        setPatientData(data);
      } catch (error) {
        console.error('Failed to load patient data:', error);
        addToast({
          type: 'error',
          title: 'Failed to load data',
          message: 'Could not retrieve patient medical records'
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadPatientData();
  }, [selectedPatient, getPatientData, addToast]);

  // Welcome screen when not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ToastContainer />
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <Shield className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">MedSecure</h1>
              <p className="text-gray-600">
                Secure blockchain-based patient data sharing platform
              </p>
            </div>
            
            <WalletConnectButton />
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center space-x-2 text-yellow-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Setup Required</span>
              </div>
              <p className="text-xs text-yellow-700">
                Make sure to deploy the smart contract and update the contract address in the environment variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main application interface
  return (
    <div className="min-h-screen">
      <ToastContainer />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">MedSecure</h1>
              <RoleBadge role={role} />
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info - Remove in production */}
        <DebugInfo />
        
        {/* Role-specific dashboards */}
        {role === UserRole.DOCTOR && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h2>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register Patient</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PatientList onPatientSelect={setSelectedPatient} />
              </div>
              <div>
                <EventLog />
              </div>
            </div>

            {selectedPatient && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Patient Records: {selectedPatient.address.slice(0, 6)}...{selectedPatient.address.slice(-4)}
                </h3>
                
                {loadingData ? (
                  <p className="text-gray-500">Loading medical records...</p>
                ) : patientData.length === 0 ? (
                  <p className="text-gray-500">No medical records found for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {patientData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{entry.description}</p>
                            <p className="text-sm text-gray-500">
                              Type: {['Personal Info', 'Diagnosis', 'Treatment', 'Lab Results', 'General Medical'][entry.dataType]} • 
                              {entry.timestamp.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">CID: {entry.cid.slice(0, 20)}...</p>
                          </div>
                        </div>
                        <FetchFileButton cid={entry.cid} filename={entry.description} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {role === UserRole.RESEARCHER && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Researcher Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PatientList onPatientSelect={setSelectedPatient} />
              </div>
              <div>
                <EventLog />
              </div>
            </div>

            {selectedPatient && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Research Data Access: {selectedPatient.address.slice(0, 6)}...{selectedPatient.address.slice(-4)}
                </h3>
                
                {loadingData ? (
                  <p className="text-gray-500">Loading accessible records...</p>
                ) : patientData.length === 0 ? (
                  <p className="text-gray-500">No accessible records found. Access may not be granted.</p>
                ) : (
                  <div className="space-y-3">
                    {patientData.filter(entry => entry.isDiagnosisData).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded bg-blue-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">{entry.description}</p>
                            <p className="text-sm text-blue-700">
                              Research Data • {['Personal Info', 'Diagnosis', 'Treatment', 'Lab Results', 'General Medical'][entry.dataType]} • 
                              {entry.timestamp.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-blue-500">CID: {entry.cid.slice(0, 20)}...</p>
                          </div>
                        </div>
                        <FetchFileButton cid={entry.cid} filename={entry.description} />
                      </div>
                    ))}
                    {patientData.filter(entry => entry.isDiagnosisData).length === 0 && (
                      <p className="text-gray-500 italic">No diagnosis data available for research.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {role === UserRole.PATIENT && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Patient Dashboard</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowGrantModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Manage Access</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Data</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">My Medical Records</h3>
                  </div>
                  <div className="p-6">
                    {account && (
                      <div>
                        {/* This will automatically load when component mounts */}
                        <div className="text-sm text-gray-500 mb-4">
                          Address: {account}
                        </div>
                        {/* Patient data will be shown here - implement similar to doctor view */}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <EventLog />
              </div>
            </div>
          </div>
        )}

        {role === UserRole.UNKNOWN && (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg border p-8 max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Not Configured</h2>
              <p className="text-gray-600 mb-4">
                Your account is not registered in the system. Please contact a doctor to register as a patient,
                or ensure your account is configured as a doctor or researcher in the smart contract.
              </p>
              <p className="text-sm text-gray-500">
                Connected as: {account}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          // Refresh data if needed
          setShowUploadModal(false);
        }}
      />
      
      <GrantAccessModal
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        onSuccess={() => {
          // Refresh data if needed
          setShowGrantModal(false);
        }}
      />
      
      <RegisterPatientModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => {
          // Refresh patient list
          setShowRegisterModal(false);
        }}
      />
    </div>
  );
}