import { Edit2, Save, X, Trash2, Mail } from 'lucide-react';
import { Gig, BandMember } from '../../types';
import { AddToCalendar } from '../AddToCalendar';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { sendEmail, getEmailsForUserIds } from '../../utils/emailService';
import { getGigReminderEmailTemplate } from '../../utils/emailTemplates';
import { EmailDraftDialog } from './EmailDraftDialog';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [sending, setSending] = useState(false);
    const [showEmailDraft, setShowEmailDraft] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
    const [emailTemplate, setEmailTemplate] = useState({ subject: '', text: '' });

    // Check if all members have responded
    const allMembersResponded = bandMembers.every(member => {
        const availability = gig.memberAvailability[member.id];
        return !!availability;
    });

    const handleOpenEmailDraft = async () => {
        if (!user?.email) {
            toast.error('No user email found');
            return;
        }

        try {
            // 1. Identify members who haven't responded
            const missingMembers = bandMembers.filter(member => {
                const availability = gig.memberAvailability[member.id];
                return !availability;
            });

            if (missingMembers.length === 0) {
                toast.success(t('gigDetails.emailDraft.allResponded'));
                return;
            }

            // 2. Fetch emails for these members
            const missingMemberIds = missingMembers.map(m => m.id);
            const emails = await getEmailsForUserIds(missingMemberIds);

            if (emails.length === 0) {
                toast.error(t('gigDetails.emailDraft.noEmails'));
                return;
            }

            // 3. Prepare the draft
            const gigLink = window.location.href;
            const template = getGigReminderEmailTemplate(gig, gigLink);

            setEmailRecipients(emails);
            setEmailTemplate({ subject: template.subject, text: template.text });
            setShowEmailDraft(true);
        } catch (error) {
            console.error(error);
            toast.error(t('gigDetails.emailDraft.prepareFailed'));
        }
    };

    const handleSendEmail = async (subject: string, body: string) => {
        setSending(true);

        try {
            const gigLink = window.location.href;
            const result = await sendEmail({
                bcc: emailRecipients,
                subject,
                text: body,
                html: `<p>${body.replace(/\n/g, '</p><p>')}</p><p><a href="${gigLink}">${t('gigDetails.emailDraft.clickHere')}</a></p>`,
            });

            if (result.success) {
                toast.success(t('gigDetails.emailDraft.sent', { count: emailRecipients.length }));
                setShowEmailDraft(false);
                if (result.previewUrl) {
                    console.log('Preview URL:', result.previewUrl);
                    toast((_) => (
                        <span>
                            {t('gigDetails.emailDraft.sentWithPreview')} <a href={result.previewUrl} target="_blank" rel="noreferrer" className="underline">{t('gigDetails.emailDraft.viewPreview')}</a>
                        </span>
                    ), { duration: 10000 });
                }
            } else {
                throw new Error(result.error || 'Failed to send');
            }
        } catch (error) {
            console.error(error);
            toast.error(t('gigDetails.emailDraft.sendFailed'));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mb-6">
            <div className="mb-3">
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
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
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
                        <span className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${gig.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : statusOptions.find(s => s.value === gig.status)?.color
                            }`}>
                            {gig.status === 'completed' ? 'Completed' : statusOptions.find(s => s.value === gig.status)?.label}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
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
                            onClick={handleOpenEmailDraft}
                            disabled={sending || allMembersResponded}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={allMembersResponded ? t('gigDetails.emailDraft.allRespondedTooltip') : t('gigDetails.emailDraft.tooltip')}
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

            <EmailDraftDialog
                isOpen={showEmailDraft}
                recipients={emailRecipients}
                initialSubject={emailTemplate.subject}
                initialBody={emailTemplate.text}
                sending={sending}
                onSend={handleSendEmail}
                onCancel={() => setShowEmailDraft(false)}
                t={t}
            />
        </div>
    );
}
