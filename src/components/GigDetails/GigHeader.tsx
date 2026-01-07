import { Edit2, Save, X, Trash2, Mail } from 'lucide-react';
import { Gig, BandMember } from '../../types';
import { AddToCalendar } from '../AddToCalendar';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface GigHeaderProps {
    gig: Gig;
    editedGig: Gig | null;
    isEditing: boolean;
    isPastGig: boolean;
    canEditGig: boolean;
    statusOptions: ReadonlyArray<{ readonly value: string; readonly label: string; readonly color: string }>;
    bandMembers: BandMember[];
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
    onUpdateGig: (updater: (prev: Gig | null) => Gig | null) => void;
}

export function GigHeader({
    gig,
    editedGig,
    isEditing,
    isPastGig,
    canEditGig,
    statusOptions,
    bandMembers,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onUpdateGig,
}: GigHeaderProps) {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);

    const handleSendGigEmail = async () => {
        if (!user?.email) {
            toast.error('No user email found');
            return;
        }
        setSending(true);

        try {
            // 1. Identify members who haven't responded
            const missingMembers = bandMembers.filter(member => {
                const availability = gig.memberAvailability[member.id];
                // If no availability record, or status is 'maybe' (assuming 'maybe' means not yet decided/responded)
                // Adjust logic if 'maybe' is a valid response. The user said "not yet added their availability".
                // Usually "maybe" is the default state if we pre-fill, but here we check for existence or explicit 'maybe' if that's the default.
                // Let's assume !availability is the main check.
                return !availability;
            });

            if (missingMembers.length === 0) {
                toast.success('All members have responded!');
                setSending(false);
                return;
            }

            // 2. Fetch emails for these members
            const missingMemberIds = missingMembers.map(m => m.id);
            // Firestore 'in' query supports up to 10 items. If more, we need to batch or fetch all.
            // For simplicity and small bands, let's fetch all users and filter, or batch if needed.
            // Let's try fetching all users for now as it's safer than complex batching logic for this task.
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const emails: string[] = [];

            usersSnapshot.forEach(doc => {
                if (missingMemberIds.includes(doc.id)) {
                    const userData = doc.data();
                    if (userData.email) {
                        emails.push(userData.email);
                    }
                }
            });

            if (emails.length === 0) {
                toast.error('No emails found for missing members');
                setSending(false);
                return;
            }

            const gigLink = window.location.href;
            const response = await fetch('/.netlify/functions/sendEmail', {
                method: 'POST',
                body: JSON.stringify({
                    to: emails.join(','), // Send to all
                    subject: `Action Required: Availability for ${gig.name}`,
                    text: `Please add your availability for the gig "${gig.name}" on ${gig.date}.\n\nLink: ${gigLink}`,
                    html: `<p>Please add your availability for the gig "<strong>${gig.name}</strong>" on ${gig.date}.</p><p><a href="${gigLink}">Click here to view the gig</a></p>`
                }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Email sent to ${emails.length} members!`);
                if (data.previewUrl) {
                    console.log('Preview URL:', data.previewUrl);
                    toast((_) => (
                        <span>
                            Email sent! <a href={data.previewUrl} target="_blank" rel="noreferrer" className="underline">View Preview</a>
                        </span>
                    ), { duration: 10000 });
                }
            } else {
                throw new Error(data.error || 'Failed to send');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to send gig email');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
                {isEditing ? (
                    <input
                        type="text"
                        className="text-3xl font-bold text-gray-900 w-full border-b border-gray-300 focus:outline-none focus:border-red-500"
                        value={editedGig?.name}
                        onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, name: e.target.value } : null)}
                        disabled={isPastGig}
                    />
                ) : (
                    <h1 className="text-3xl font-bold text-gray-900">{gig.name}</h1>
                )}
            </div>
            <div className="flex items-center space-x-4">
                {isEditing ? (
                    <select
                        className={`px-4 py-2 rounded-full text-sm ${statusOptions.find(s => s.value === editedGig?.status)?.color}`}
                        value={editedGig?.status}
                        onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, status: e.target.value as Gig['status'] } : null)}
                    >
                        {statusOptions.map(status => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <span className={`px-4 py-2 rounded-full text-sm ${gig.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : statusOptions.find(s => s.value === gig.status)?.color
                        }`}>
                        {gig.status === 'completed' ? 'Completed' : statusOptions.find(s => s.value === gig.status)?.label}
                    </span>
                )}
                {canEditGig && !isEditing && (
                    <>
                        <button
                            onClick={onEdit}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </>
                )}
                {canEditGig && (
                    <button
                        onClick={handleSendGigEmail}
                        disabled={sending}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                        title="Email Gig Link"
                    >
                        <Mail className="w-5 h-5" />
                    </button>
                )}
                <AddToCalendar gig={gig} />
                {isEditing && (
                    <div className="flex space-x-2">
                        <button
                            onClick={onCancel}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onSave}
                            className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-full"
                        >
                            <Save className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
