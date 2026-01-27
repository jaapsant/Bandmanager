import { Calendar, Clock, Euro, MapPin, Car, X, Plus, Route, Loader2 } from 'lucide-react';
import { Gig } from '../../types';
import { MultiDateAvailabilityOverview } from '../MultiDateAvailabilityOverview';
import { AvailabilityOverview } from '../AvailabilityOverview';
import { formatDate } from '../../utils/dateFormat';

interface GigInfoSectionProps {
    gig: Gig;
    editedGig: Gig | null;
    isEditing: boolean;
    isPastGig: boolean;
    totalDrivers: number;
    formatTime: () => string;
    openInGoogleMaps: (location: string) => void;
    onUpdateGig: (updater: (prev: Gig | null) => Gig | null) => void;
    onSelectSingleDate?: (date: string) => void;
    onCalculateDistance?: () => void;
    isCalculatingDistance?: boolean;
    t: (key: string) => string;
}

export function GigInfoSection({
    gig,
    editedGig,
    isEditing,
    isPastGig,
    totalDrivers,
    formatTime,
    openInGoogleMaps,
    onUpdateGig,
    onSelectSingleDate,
    onCalculateDistance,
    isCalculatingDistance = false,
    t,
}: GigInfoSectionProps) {
    const canCalculate = (editedGig?.location || '').trim().length > 0 && !isCalculatingDistance;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-4">
                    {/* Date Section */}
                    <div className="flex items-center text-gray-600">
                        <Calendar className="w-5 h-5 mr-3" />
                        {isEditing ? (
                            <div className="space-y-2 w-full">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="date"
                                        className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                        value={editedGig?.date}
                                        onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, date: e.target.value } : null)}
                                        disabled={isPastGig}
                                    />
                                    {editedGig?.isMultiDay && (
                                        <span className="text-sm text-gray-500">
                                            (Primary date)
                                        </span>
                                    )}
                                </div>

                                {editedGig?.isMultiDay && (
                                    <div className="space-y-2 pl-0">
                                        {editedGig.dates.map((date, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <input
                                                    type="date"
                                                    className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                                    value={date}
                                                    onChange={(e) => {
                                                        const newDates = [...editedGig.dates];
                                                        newDates[index] = e.target.value;
                                                        onUpdateGig(prev => prev ? { ...prev, dates: newDates } : null);
                                                    }}
                                                    disabled={isPastGig}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newDates = editedGig.dates.filter((_, i) => i !== index);
                                                        onUpdateGig(prev => prev ? { ...prev, dates: newDates } : null);
                                                    }}
                                                    className="p-1 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
                                                    title={t('newGig.form.dates.remove')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                onUpdateGig(prev => prev ? {
                                                    ...prev,
                                                    dates: [...prev.dates, '']
                                                } : null);
                                            }}
                                            className="flex items-center text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            {t('newGig.form.dates.addDate')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <span>{formatDate(gig.date)}</span>
                                {gig.isMultiDay && gig.dates.length > 0 && (
                                    <div className="mt-1 pl-4 space-y-1 text-sm text-gray-500">
                                        {gig.dates.map((date, index) => (
                                            <div key={index}>
                                                {formatDate(date)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Time Section */}
                    <div className="flex items-center text-gray-600">
                        <Clock className="w-5 h-5 mr-3" />
                        {isEditing ? (
                            <div className="flex items-center space-x-4">
                                {isPastGig ? (
                                    <span>{formatTime()}</span>
                                ) : (
                                    <>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="mr-2"
                                                checked={editedGig?.isWholeDay}
                                                onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? {
                                                    ...prev,
                                                    isWholeDay: e.target.checked,
                                                    startTime: e.target.checked ? null : prev.startTime,
                                                    endTime: e.target.checked ? null : prev.endTime,
                                                } : null)}
                                            />
                                            All Day
                                        </label>
                                        {!editedGig?.isWholeDay && (
                                            <>
                                                <input
                                                    type="time"
                                                    className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                                    value={editedGig?.startTime || ''}
                                                    onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, startTime: e.target.value } : null)}
                                                />
                                                <span>-</span>
                                                <input
                                                    type="time"
                                                    className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                                    value={editedGig?.endTime || ''}
                                                    onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, endTime: e.target.value } : null)}
                                                />
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <span>{formatTime()}</span>
                        )}
                    </div>

                    {/* Location Section */}
                    <div className="flex items-center text-gray-600">
                        {isEditing ? (
                            <>
                                <MapPin className="w-5 h-5 mr-3" />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                        value={editedGig?.location || ''}
                                        onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, location: e.target.value } : null)}
                                        placeholder="Enter location"
                                    />
                                    <input
                                        type="number"
                                        className="w-20 border-b border-gray-300 focus:outline-none focus:border-red-500"
                                        value={editedGig?.distance || ''}
                                        onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? {
                                            ...prev,
                                            distance: e.target.value ? parseFloat(e.target.value) : null
                                        } : null)}
                                        placeholder="km"
                                        min="0"
                                        step="0.1"
                                    />
                                    {onCalculateDistance && (
                                        <button
                                            type="button"
                                            onClick={onCalculateDistance}
                                            disabled={!canCalculate}
                                            className={`p-1.5 rounded transition-colors ${
                                                canCalculate
                                                    ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                                    : 'text-gray-300 cursor-not-allowed'
                                            }`}
                                            title={
                                                !(editedGig?.location || '').trim()
                                                    ? t('newGig.form.distance.error.emptyLocation')
                                                    : t('newGig.form.distance.calculate')
                                            }
                                        >
                                            {isCalculatingDistance ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Route className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <span
                                    title="Open in Google Maps"
                                    className="cursor-pointer hover:text-red-600"
                                    onClick={() => gig.location && openInGoogleMaps(gig.location)}
                                >
                                    <MapPin className="w-5 h-5 mr-3" />
                                </span>
                                <span>
                                    {gig.location}
                                    {gig.distance && (
                                        <span className="text-gray-400 ml-2">
                                            ({gig.distance} km)
                                        </span>
                                    )}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Pay Section */}
                    <div className="flex items-center text-gray-600">
                        <Euro className="w-5 h-5 mr-3" />
                        {isEditing ? (
                            <input
                                type="number"
                                className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                value={editedGig?.pay || ''}
                                onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, pay: e.target.value ? parseFloat(e.target.value) : null } : null)}
                                placeholder="Enter pay amount"
                            />
                        ) : (
                            gig.pay && <span>{gig.pay},-</span>
                        )}
                    </div>
                </div>

                {/* Description Section */}
                {(gig.description || isEditing) && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">{t('gigDetails.sections.description')}</h3>
                        {isEditing ? (
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={editedGig?.description || ''}
                                onChange={(e) => onUpdateGig((prev: Gig | null) => prev ? { ...prev, description: e.target.value } : null)}
                                rows={4}
                                placeholder={t('gigDetails.sections.descriptionPlaceholder')}
                            />
                        ) : (
                            <p className="text-gray-600">{gig.description}</p>
                        )}
                    </div>
                )}

                {/* Band Availability Overview */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{t('gigDetails.sections.bandAvailability')}</h3>
                        {!gig.isMultiDay && totalDrivers > 0 && (
                            <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <Car className="w-4 h-4" />
                                <span className="ml-1 text-sm font-medium">{totalDrivers}</span>
                            </div>
                        )}
                    </div>
                    {gig.isMultiDay ? (
                        <MultiDateAvailabilityOverview
                            gig={gig}
                            onSelectSingleDate={onSelectSingleDate}
                        />
                    ) : (
                        <AvailabilityOverview memberAvailability={gig.memberAvailability} />
                    )}
                </div>
            </div>
        </div>
    );
}
