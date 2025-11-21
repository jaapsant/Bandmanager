import { Car } from 'lucide-react';
import { Gig, BandMember, AvailabilityStatusValue, MemberAvailability } from '../../types';
import { AvailabilityStatus } from '../AvailabilityStatus';
import { MultiDateBandAvailability } from '../MultiDateBandAvailability';

interface User {
    uid: string;
}

interface BandMembersSectionProps {
    gig: Gig;
    user: User;
    bandMembers: BandMember[];
    canEditGig: boolean;
    sortedInstruments: string[];
    membersByInstrument: Record<string, BandMember[]>;
    updateMemberAvailability: (memberId: string, status: AvailabilityStatusValue) => void;
    toggleMemberDriving: (memberId: string) => void;
    updateGig: (gig: Gig) => Promise<void>;
    t: (key: string) => string;
}

export function BandMembersSection({
    gig,
    user,
    bandMembers,
    canEditGig,
    sortedInstruments,
    membersByInstrument,
    updateMemberAvailability,
    toggleMemberDriving,
    updateGig,
    t,
}: BandMembersSectionProps) {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">{t('gigDetails.sections.bandMembers')}</h3>
            {gig.isMultiDay ? (
                <MultiDateBandAvailability
                    gig={gig}
                    onUpdateMemberAvailability={async (memberId, date, status) => {
                        if (!user) return;

                        try {
                            const currentAvailability = gig.memberAvailability[memberId] || {
                                status: 'maybe',
                                note: '',
                                canDrive: false,
                                dateAvailability: {}
                            };

                            const updatedAvailability: MemberAvailability = {
                                ...currentAvailability,
                                dateAvailability: {
                                    ...currentAvailability.dateAvailability,
                                    [date]: {
                                        status,
                                        note: currentAvailability.dateAvailability?.[date]?.note || '',
                                        canDrive: currentAvailability.dateAvailability?.[date]?.canDrive || false
                                    }
                                }
                            };

                            const updatedGig: Gig = {
                                ...gig,
                                memberAvailability: {
                                    ...gig.memberAvailability,
                                    [memberId]: updatedAvailability
                                }
                            };

                            await updateGig(updatedGig);
                        } catch (err) {
                            console.error('Error updating member availability:', err);
                        }
                    }}
                    onUpdateMemberDriving={async (memberId, date, canDrive) => {
                        if (!user) return;

                        try {
                            const currentAvailability = gig.memberAvailability[memberId] || {
                                status: 'maybe',
                                note: '',
                                canDrive: false,
                                dateAvailability: {}
                            };

                            const updatedAvailability: MemberAvailability = {
                                ...currentAvailability,
                                dateAvailability: {
                                    ...currentAvailability.dateAvailability,
                                    [date]: {
                                        ...currentAvailability.dateAvailability?.[date],
                                        status: currentAvailability.dateAvailability?.[date]?.status || 'maybe',
                                        note: currentAvailability.dateAvailability?.[date]?.note || '',
                                        canDrive
                                    }
                                }
                            };

                            const updatedGig: Gig = {
                                ...gig,
                                memberAvailability: {
                                    ...gig.memberAvailability,
                                    [memberId]: updatedAvailability
                                }
                            };

                            await updateGig(updatedGig);
                        } catch (err) {
                            console.error('Error updating member driving status:', err);
                        }
                    }}
                />
            ) : (
                <div className="space-y-4">
                    {sortedInstruments.map((instrument) => (
                        <div key={instrument}>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">{instrument}</h4>
                            <div className="space-y-2">
                                {membersByInstrument[instrument].map((member) => (
                                    <div key={member.id} className="p-2 bg-gray-50 rounded">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{member.name}</span>
                                            <div className="flex items-center space-x-2">
                                                {canEditGig ? (
                                                    <>
                                                        <div className="flex space-x-1">
                                                            <button
                                                                onClick={() => updateMemberAvailability(member.id, 'available')}
                                                                className={`p-1 rounded-full hover:bg-green-100 ${gig.memberAvailability[member.id]?.status === 'available' ? 'bg-green-100' : ''
                                                                    }`}
                                                            >
                                                                <AvailabilityStatus status="available" size="sm" />
                                                            </button>
                                                            <button
                                                                onClick={() => updateMemberAvailability(member.id, 'unavailable')}
                                                                className={`p-1 rounded-full hover:bg-red-100 ${gig.memberAvailability[member.id]?.status === 'unavailable' ? 'bg-red-100' : ''
                                                                    }`}
                                                            >
                                                                <AvailabilityStatus status="unavailable" size="sm" />
                                                            </button>
                                                            <button
                                                                onClick={() => updateMemberAvailability(member.id, 'maybe')}
                                                                className={`p-1 rounded-full hover:bg-yellow-100 ${gig.memberAvailability[member.id]?.status === 'maybe' ? 'bg-yellow-100' : ''
                                                                    }`}
                                                            >
                                                                <AvailabilityStatus status="maybe" size="sm" />
                                                            </button>
                                                        </div>
                                                        {gig.memberAvailability[member.id]?.status === 'available' && (
                                                            <button
                                                                onClick={() => toggleMemberDriving(member.id)}
                                                                className={`p-1 rounded-full hover:bg-blue-100 ${gig.memberAvailability[member.id]?.canDrive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                                                                    }`}
                                                            >
                                                                <Car className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <AvailabilityStatus status={gig.memberAvailability[member.id]?.status} size="sm" />
                                                        {gig.memberAvailability[member.id]?.status === 'available' &&
                                                            gig.memberAvailability[member.id]?.canDrive && (
                                                                <Car className="w-4 h-4 text-blue-600" />
                                                            )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {gig.memberAvailability[member.id]?.note && (
                                            <p className="text-sm text-gray-500 italic mt-2">
                                                {gig.memberAvailability[member.id].note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
