import { Car } from 'lucide-react';
import { Gig, AvailabilityStatusValue } from '../../types';
import { AvailabilityStatus } from '../AvailabilityStatus';
import { MultiDateAvailability } from '../MultiDateAvailability';

interface User {
    uid: string;
    emailVerified?: boolean;
}

interface UserAvailabilitySectionProps {
    gig: Gig;
    user: User;
    isPastGig: boolean;
    updateAvailability: (status: AvailabilityStatusValue, canDrive: boolean | null) => void;
    updateNote: (note: string) => void;
    toggleDriving: () => void;
    onUpdateAvailability: (date: string, status: AvailabilityStatusValue, note?: string) => void;
    onUpdateDrivingStatus: (date: string, canDrive: boolean) => void;
    t: (key: string) => string;
}

export function UserAvailabilitySection({
    gig,
    user,
    isPastGig,
    updateAvailability,
    updateNote,
    toggleDriving,
    onUpdateAvailability,
    onUpdateDrivingStatus,
    t,
}: UserAvailabilitySectionProps) {
    if (isPastGig) return null;

    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('gigDetails.sections.yourAvailability')}</h3>
            {gig.isMultiDay ? (
                <MultiDateAvailability
                    gig={gig}
                    onUpdateAvailability={onUpdateAvailability}
                    onUpdateDrivingStatus={onUpdateDrivingStatus}
                />
            ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => updateAvailability('available', gig.memberAvailability[user.uid]?.canDrive ?? null)}
                                className={`p-2 rounded-full hover:bg-green-100 ${gig.memberAvailability[user.uid]?.status === 'available' ? 'bg-green-100' : ''
                                    }`}
                                title={t('gigs.available')}
                            >
                                <AvailabilityStatus status="available" />
                            </button>
                            <button
                                onClick={() => updateAvailability('unavailable', gig.memberAvailability[user.uid]?.canDrive ?? null)}
                                className={`p-2 rounded-full hover:bg-red-100 ${gig.memberAvailability[user.uid]?.status === 'unavailable' ? 'bg-red-100' : ''
                                    }`}
                                title={t('gigs.unavailable')}
                            >
                                <AvailabilityStatus status="unavailable" />
                            </button>
                            <button
                                onClick={() => updateAvailability('maybe', gig.memberAvailability[user.uid]?.canDrive ?? null)}
                                className={`p-2 rounded-full hover:bg-yellow-100 ${gig.memberAvailability[user.uid]?.status === 'maybe' ? 'bg-yellow-100' : ''
                                    }`}
                                title={t('gigs.maybe')}
                            >
                                <AvailabilityStatus status="maybe" />
                            </button>
                        </div>
                        {gig.memberAvailability[user.uid]?.status === 'available' && (
                            <button
                                onClick={toggleDriving}
                                className={`p-2 rounded-full hover:bg-blue-100 ${gig.memberAvailability[user.uid]?.canDrive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                                    }`}
                                title='Chauffeur'
                            >
                                <Car className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <textarea
                        className="w-full mt-2 p-2 text-sm border rounded-md"
                        placeholder={t('gigDetails.sections.notePlaceholder')}
                        value={gig.memberAvailability[user.uid]?.note || ''}
                        onChange={(e) => updateNote(e.target.value)}
                        rows={3}
                    />
                </div>
            )}
        </div>
    );
}
