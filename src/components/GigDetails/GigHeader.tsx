import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { Gig } from '../../types';
import { AddToCalendar } from '../AddToCalendar';

interface GigHeaderProps {
    gig: Gig;
    editedGig: Gig | null;
    isEditing: boolean;
    isPastGig: boolean;
    canEditGig: boolean;
    statusOptions: Array<{ value: string; label: string; color: string }>;
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
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onUpdateGig,
}: GigHeaderProps) {
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
