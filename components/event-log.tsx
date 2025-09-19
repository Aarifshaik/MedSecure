'use client';

import { useState, useEffect } from 'react';
import { ContractEvent } from '@/lib/types';
import { contractService } from '@/lib/contract';
import { Clock, FileText, Share, UserPlus, Loader2 } from 'lucide-react';

export function EventLog() {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const [dataEvents, accessEvents, patientEvents] = await Promise.all([
          contractService.getEvents('DataAdded'),
          contractService.getEvents('AccessGranted'),
          contractService.getEvents('PatientRegistered'),
        ]);

        const allEvents: ContractEvent[] = [
          ...dataEvents.map(e => ({ ...e, event: 'DataAdded' })),
          ...accessEvents.map(e => ({ ...e, event: 'AccessGranted' })),
          ...patientEvents.map(e => ({ ...e, event: 'PatientRegistered' })),
        ];

        // Sort by block number (newest first)
        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
        setEvents(allEvents.slice(0, 20)); // Show latest 20 events
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'DataAdded':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'AccessGranted':
        return <Share className="w-4 h-4 text-green-600" />;
      case 'PatientRegistered':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getEventDescription = (event: ContractEvent) => {
    switch (event.event) {
      case 'DataAdded':
        return (
          <div>
            <span className="font-medium">Data uploaded</span>
            <div className="text-sm text-gray-500">
              Patient: {formatAddress(event.args[0])} • CID: {event.args[1].slice(0, 12)}...
            </div>
          </div>
        );
      case 'AccessGranted':
        return (
          <div>
            <span className="font-medium">Access granted</span>
            <div className="text-sm text-gray-500">
              From: {formatAddress(event.args[0])} • To: {formatAddress(event.args[1])}
            </div>
          </div>
        );
      case 'PatientRegistered':
        return (
          <div>
            <span className="font-medium">Patient registered</span>
            <div className="text-sm text-gray-500">
              Address: {formatAddress(event.args[0])}
            </div>
          </div>
        );
      default:
        return <span>Unknown event</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      
      <div className="divide-y">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No events found
          </div>
        ) : (
          events.map((event, index) => (
            <div key={`${event.transactionHash}-${index}`} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  {getEventIcon(event.event)}
                </div>
                <div className="flex-1 min-w-0">
                  {getEventDescription(event)}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <span>Block #{event.blockNumber}</span>
                    <span>Tx: {event.transactionHash.slice(0, 10)}...</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}