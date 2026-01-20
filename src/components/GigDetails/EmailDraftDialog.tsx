import { useState, useEffect, useRef } from 'react';
import { X, Send, Bold, Italic, Link, List } from 'lucide-react';

interface EmailDraftDialogProps {
    isOpen: boolean;
    recipients: string[];
    initialSubject: string;
    initialHtml: string;
    sending: boolean;
    onSend: (subject: string, html: string) => void;
    onCancel: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export function EmailDraftDialog({
    isOpen,
    recipients,
    initialSubject,
    initialHtml,
    sending,
    onSend,
    onCancel,
    t,
}: EmailDraftDialogProps) {
    const [subject, setSubject] = useState(initialSubject);
    const editorRef = useRef<HTMLDivElement>(null);

    // Update local state when initial values change (when dialog opens)
    useEffect(() => {
        setSubject(initialSubject);
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml;
        }
    }, [initialSubject, initialHtml]);

    if (!isOpen) return null;

    const handleSend = () => {
        const html = editorRef.current?.innerHTML || '';
        onSend(subject, html);
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
                        disabled={sending || !subject.trim() || isEditorEmpty()}
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
