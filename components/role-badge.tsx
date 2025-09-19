'use client';

import { UserRole } from '@/lib/types';
import { Shield, Microscope, User, HelpCircle } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const getRoleConfig = () => {
    switch (role) {
      case UserRole.DOCTOR:
        return {
          icon: Shield,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Doctor'
        };
      case UserRole.RESEARCHER:
        return {
          icon: Microscope,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          label: 'Researcher'
        };
      case UserRole.PATIENT:
        return {
          icon: User,
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Patient'
        };
      default:
        return {
          icon: HelpCircle,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Unknown'
        };
    }
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-sm font-medium ${config.color} ${className}`}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}