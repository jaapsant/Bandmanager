interface DeleteConfirmDialogProps {
    isOpen: boolean;
    gigName: string;
    onConfirm: () => void;
    onCancel: () => void;
    t: (key: string, params?: Record<string, any>) => string;
}

export function DeleteConfirmDialog({
    isOpen,
    gigName,
    onConfirm,
    onCancel,
    t,
}: DeleteConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">{t('gigDetails.deleteModal.title')}</h3>
                <p className="text-gray-600 mb-6">
                    {t('gigDetails.deleteModal.message')}
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        {t('gigDetails.deleteModal.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        {t('gigDetails.deleteModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
