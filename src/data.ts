import { GigStatus } from './types';
import { useTranslation } from 'react-i18next';

export const useStatusOptions = () => {
  const { t } = useTranslation();
  
  return [
    { value: 'pending', label: t('gigs.status.pending'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: t('gigs.status.confirmed'), color: 'bg-green-100 text-green-800' },
    { value: 'declined', label: t('gigs.status.declined'), color: 'bg-red-100 text-red-800' },
  ] as const;
};