import { useState, useEffect, useRef } from 'react';
import { X, Send, Bold, Italic, Link, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Gig, BandMember } from '../../types';

interface GigWithMissingMembers {
    gig: Gig;
    missingMemberIds: string[];
}

interface EmailDraftDialogProps {
    isOpen: boolean;
    currentGigId: string;
    initialRecipientEmails: string[];
    initialSubject: string;
    initialHtml: string;
    sending: boolean;
    gigsWithMissingMembers: GigWithMissingMembers[];
    bandMembers: BandMember[];
    onSend: (subject: string, html: string, recipientEmails: string[]) => void;
    onCancel: () => void;
    onFetchEmails: (memberIds: string[]) => Promise<string[]>;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export function EmailDraftDialog({
    isOpen,
    currentGigId,
    initialRecipientEmails,
    initialSubject,
    initialHtml,
    sending,
    gigsWithMissingMembers,
    bandMembers,
    onSend,
    onCancel,
    onFetchEmails,
    t,
}: EmailDraftDialogProps) {
    const [subject, setSubject] = useState(initialSubject);
    const [recipientsExpanded, setRecipientsExpanded] = useState(false);
    const [selectedGigIds, setSelectedGigIds] = useState<Set<string>>(new Set([currentGigId]));
    const [recipientEmails, setRecipientEmails] = useState<string[]>(initialRecipientEmails);
    const [loadingEmails, setLoadingEmails] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    // Update local state when initial values change (when dialog opens)
    useEffect(() => {
        setSubject(initialSubject);
        setSelectedGigIds(new Set([currentGigId]));
        setRecipientEmails(initialRecipientEmails);
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml;
        }
    }, [initialSubject, initialHtml, currentGigId, initialRecipientEmails]);

    // Update recipients when selected gigs change
    useEffect(() => {
        const updateRecipients = async () => {
            // Get all unique member IDs from selected gigs
            const allMemberIds = new Set<string>();
            gigsWithMissingMembers.forEach(({ gig, missingMemberIds }) => {
                if (selectedGigIds.has(gig.id)) {
                    missingMemberIds.forEach(id => allMemberIds.add(id));
                }
            });

            if (allMemberIds.size === 0) {
                setRecipientEmails([]);
                return;
            }

            setLoadingEmails(true);
            try {
                const emails = await onFetchEmails(Array.from(allMemberIds));
                setRecipientEmails(emails);
            } catch (error) {
                console.error('Failed to fetch emails:', error);
            } finally {
                setLoadingEmails(false);
            }
        };

        if (isOpen) {
            updateRecipients();
        }
    }, [selectedGigIds, gigsWithMissingMembers, onFetchEmails, isOpen]);

    if (!isOpen) return null;

    const handleSend = () => {
        const html = editorRef.current?.innerHTML || '';
        onSend(subject, html, recipientEmails);
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleBold = () => execCommand('bold');
    const handleItalic = () => execCommand('italic');
    const handleList = () => execCommand('insertUnorderedList');

    const handleLink = () => {
        const url = prompt(t('gigDetails.emailDraft.enterUrl'));
        if (url) {
            execCommand('createLink', url);
        }
    };

    const isEditorEmpty = () => {
        if (!editorRef.current) return true;
        const text = editorRef.current.innerText.trim();
        return text === '';
    };

    const toggleGigSelection = (gigId: string) => {
        const newSelected = new Set(selectedGigIds);
        if (newSelected.has(gigId)) {
            // Don't allow deselecting if it's the only one selected
            if (newSelected.size > 1) {
                newSelected.delete(gigId);
            }
        } else {
            newSelected.add(gigId);
        }
        setSelectedGigIds(newSelected);
    };

    const getMemberName = (memberId: string) => {
        return bandMembers.find(m => m.id === memberId)?.name || memberId;
    };

    // Filter to only show gigs that have missing members (excluding current gig which is always shown)
    const otherGigsWithMissing = gigsWithMissingMembers.filter(
        ({ gig, missingMemberIds }) => gig.id !== currentGigId && missingMemberIds.length > 0
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{t('gigDetails.emailDraft.title')}</h3>
                    <button
                        onClick={onCancel}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <button
                            type="button"
                            onClick={() => setRecipientsExpanded(!recipientsExpanded)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <label className="block text-sm font-medium text-gray-700">
                                {t('gigDetails.emailDraft.recipients')}
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                    {loadingEmails ? '...' : `${recipientEmails.length} ${t('gigDetails.emailDraft.recipientCount')}`}
                                </span>
                                {recipientsExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </div>
                        </button>

                        {recipientsExpanded && (
                            <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
                                <div className="max-h-60 overflow-y-auto">
                                    {gigsWithMissingMembers.map(({ gig, missingMemberIds }) => {
                                        if (missingMemberIds.length === 0) return null;
                                        const isSelected = selectedGigIds.has(gig.id);
                                        const isCurrentGig = gig.id === currentGigId;

                                        return (
                                            <div
                                                key={gig.id}
                                                className={`p-3 border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-red-50' : 'bg-white'}`}
                                            >
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleGigSelection(gig.id)}
                                                        disabled={isCurrentGig && selectedGigIds.size === 1}
                                                        className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {gig.name}
                                                            {isCurrentGig && (
                                                                <span className="ml-2 text-xs text-gray-500">
                                                                    ({t('gigDetails.emailDraft.currentGig')})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{gig.date}</div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {t('gigDetails.emailDraft.missingMembers')}: {missingMemberIds.map(getMemberName).join(', ')}
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {otherGigsWithMissing.length === 0 && (
                                    <div className="p-3 text-sm text-gray-500 text-center">
                                        {t('gigDetails.emailDraft.noOtherGigs')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('gigDetails.emailDraft.subject')}
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('gigDetails.emailDraft.message')}
                        </label>
                        <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent">
                            <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={handleBold}
                                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                                    title={t('gigDetails.emailDraft.bold')}
                                >
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleItalic}
                                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                                    title={t('gigDetails.emailDraft.italic')}
                                >
                                    <Italic className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLink}
                                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                                    title={t('gigDetails.emailDraft.addLink')}
                                >
                                    <Link className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleList}
                                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                                    title={t('gigDetails.emailDraft.bulletList')}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                            <style>
                                {`
                                    .email-editor a {
                                        color: #2563eb;
                                        text-decoration: underline;
                                    }
                                    .email-editor a:hover {
                                        color: #1d4ed8;
                                    }
                                    .email-editor ul {
                                        list-style-type: disc;
                                        padding-left: 1.5rem;
                                        margin: 0.5rem 0;
                                    }
                                    .email-editor p {
                                        margin: 0.25rem 0;
                                    }
                                `}
                            </style>
                            <div
                                ref={editorRef}
                                contentEditable
                                className="email-editor min-h-[200px] p-3 focus:outline-none"
                                dangerouslySetInnerHTML={{ __html: initialHtml }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onCancel}
                        disabled={sending}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                        {t('gigDetails.emailDraft.cancel')}
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !subject.trim() || isEditorEmpty() || recipientEmails.length === 0 || loadingEmails}
                        className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {sending ? t('gigDetails.emailDraft.sending') : t('gigDetails.emailDraft.send')}
                    </button>
                </div>
            </div>
        </div>
    );
}
