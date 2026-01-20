import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface EmailDraftDialogProps {
    isOpen: boolean;
    recipients: string[];
    initialSubject: string;
    initialBody: string;
    sending: boolean;
    onSend: (subject: string, body: string) => void;
    onCancel: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export function EmailDraftDialog({
    isOpen,
    recipients,
    initialSubject,
    initialBody,
    sending,
    onSend,
    onCancel,
    t,
}: EmailDraftDialogProps) {
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);

    // Update local state when initial values change (when dialog opens)
    useEffect(() => {
        setSubject(initialSubject);
        setBody(initialBody);
    }, [initialSubject, initialBody]);

    if (!isOpen) return null;

    const handleSend = () => {
        onSend(subject, body);
    };

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('gigDetails.emailDraft.recipients')}
                        </label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                            {recipients.length} {t('gigDetails.emailDraft.recipientCount')}
                        </div>
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
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-y"
                        />
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
                        disabled={sending || !subject.trim() || !body.trim()}
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
