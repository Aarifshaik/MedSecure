'use client';

import { useState } from 'react';
import { Database, FileText, Key, Users, Share, Trash2, Download, RefreshCw } from 'lucide-react';
import { localDB } from '@/lib/local-database';
import { localIPFS } from '@/lib/local-ipfs';
import { enhancedUploadService } from '@/lib/enhanced-upload-service';

export function DatabaseAdmin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);

  const refreshStats = () => {
    const dbStats = localDB.getStats();
    const ipfsStats = localIPFS.getStats();
    const uploadStats = enhancedUploadService.getStats();
    
    setStats({
      database: dbStats,
      ipfs: ipfsStats,
      upload: uploadStats
    });
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      enhancedUploadService.clearAllData();
      refreshStats();
    }
  };

  const exportData = () => {
    const dbData = localDB.exportData();
    const ipfsData = localIPFS.exportData();
    
    const exportObj = {
      database: JSON.parse(dbData),
      ipfs: JSON.parse(ipfsData),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medsecure-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border rounded-lg">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Database Administration</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={refreshStats}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
            <button
              onClick={clearAllData}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-4 border-b">
          {[
            { id: 'overview', label: 'Overview', icon: Database },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'files', label: 'Files', icon: FileText },
            { id: 'keys', label: 'Keys', icon: Key },
            { id: 'access', label: 'Access', icon: Share }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <button
              onClick={refreshStats}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Load Statistics
            </button>
            
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Database</h4>
                  <div className="space-y-1 text-sm">
                    <div>Patients: {stats.database.patients}</div>
                    <div>Files: {stats.database.files}</div>
                    <div>Keys: {stats.database.encryptionKeys}</div>
                    <div>Access Grants: {stats.database.accessGrants}</div>
                    <div>Shared Keys: {stats.database.sharedKeys}</div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">IPFS Storage</h4>
                  <div className="space-y-1 text-sm">
                    <div>Total Files: {stats.ipfs.totalFiles}</div>
                    <div>Storage Used: {stats.ipfs.formattedSize}</div>
                    <div>Pinned Files: {stats.ipfs.pinnedFiles}</div>
                    <div>Service: {stats.upload.ipfs.service}</div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div>Total Patients: {stats.upload.summary.totalPatients}</div>
                    <div>Total Files: {stats.upload.summary.totalFiles}</div>
                    <div>Shared Keys: {stats.upload.summary.totalSharedKeys}</div>
                    <div>Access Grants: {stats.upload.summary.totalAccessGrants}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'patients' && (
          <div>
            <h4 className="font-semibold mb-3">Registered Patients</h4>
            <PatientTable />
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            <h4 className="font-semibold mb-3">Uploaded Files</h4>
            <FileTable />
          </div>
        )}

        {activeTab === 'keys' && (
          <div>
            <h4 className="font-semibold mb-3">Encryption Keys</h4>
            <KeyTable />
          </div>
        )}

        {activeTab === 'access' && (
          <div>
            <h4 className="font-semibold mb-3">Access Grants</h4>
            <AccessTable />
          </div>
        )}
      </div>
    </div>
  );
}

function PatientTable() {
  const patients = localDB.getAllPatients();
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {patients.map((patient, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-mono">{patient.address.slice(0, 10)}...</td>
              <td className="px-4 py-2 text-sm">{patient.name}</td>
              <td className="px-4 py-2 text-sm">{patient.age}</td>
              <td className="px-4 py-2 text-sm">{patient.phoneNumber}</td>
              <td className="px-4 py-2 text-sm">{new Date(patient.registeredAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FileTable() {
  const [selectedPatient, setSelectedPatient] = useState('');
  const patients = localDB.getAllPatients();
  const files = selectedPatient ? localDB.getFilesByPatient(selectedPatient) : [];
  
  return (
    <div className="space-y-4">
      <select
        value={selectedPatient}
        onChange={(e) => setSelectedPatient(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Select a patient...</option>
        {patients.map(patient => (
          <option key={patient.address} value={patient.address}>
            {patient.name} ({patient.address.slice(0, 10)}...)
          </option>
        ))}
      </select>
      
      {files.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{file.fileName}</td>
                  <td className="px-4 py-2 text-sm">{file.description}</td>
                  <td className="px-4 py-2 text-sm">
                    {['Personal', 'Diagnosis', 'Treatment', 'Lab', 'General'][file.dataType]}
                  </td>
                  <td className="px-4 py-2 text-sm">{(file.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-2 text-sm font-mono">{file.cid.slice(0, 15)}...</td>
                  <td className="px-4 py-2 text-sm">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KeyTable() {
  return (
    <div className="text-sm text-gray-600">
      <p>Encryption keys are stored securely and cannot be displayed for security reasons.</p>
      <p className="mt-2">Total keys in database: {localDB.getStats().encryptionKeys}</p>
    </div>
  );
}

function AccessTable() {
  const patients = localDB.getAllPatients();
  const [selectedPatient, setSelectedPatient] = useState('');
  const grants = selectedPatient ? localDB.getAccessGrantsByPatient(selectedPatient) : [];
  
  return (
    <div className="space-y-4">
      <select
        value={selectedPatient}
        onChange={(e) => setSelectedPatient(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Select a patient...</option>
        {patients.map(patient => (
          <option key={patient.address} value={patient.address}>
            {patient.name} ({patient.address.slice(0, 10)}...)
          </option>
        ))}
      </select>
      
      {grants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Granted To</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Granted At</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grants.map((grant, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-mono">{grant.grantedTo.slice(0, 15)}...</td>
                  <td className="px-4 py-2 text-sm">{new Date(grant.grantedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      grant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {grant.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}