import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { BandMember } from '../types';

interface AvailabilityStatusProps {
  status?: BandMember['availability']['status'];
  size?: 'sm' | 'md';
}

export function AvailabilityStatus({ status, size = 'md' }: AvailabilityStatusProps) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  switch (status) {
    case 'available':
      return <Check className={`${sizeClasses} text-green-500`} />;
    case 'unavailable':
      return <X className={`${sizeClasses} text-red-500`} />;
    case 'tentative':
      return <HelpCircle className={`${sizeClasses} text-yellow-500`} />;
    default:
      return <div className={`${sizeClasses} rounded-full bg-gray-200`} />;
  }
}