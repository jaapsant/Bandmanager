import { Calendar, Clock, AlertCircle, Car, MapPin } from 'lucide-react';
import { Gig } from '../types';
import { statusOptions } from '../data';
import { Link, useNavigate } from 'react-router-dom';
import { AvailabilityOverview } from './AvailabilityOverview';
import { useAuth } from '../context/AuthContext';
import { AddToCalendar } from './AddToCalendar';

interface GigCardProps {
  gig: Gig;
}

export function GigCard({ gig }: GigCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPastGig = new Date(gig.date) < new Date();

  const status = gig.status === 'completed' 
    ? { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' }
    : statusOptions.find((s) => s.value === gig.status);

  const hasUserAvailability = user && gig.memberAvailability[user.uid]?.status;

  // Count available drivers
  const totalDrivers = Object.values(gig.memberAvailability).reduce((count, availability) => {
    if (availability.status === 'available' && availability.canDrive) {
      return count + 1;
    }
    return count;
  }, 0);

  const formatTime = () => {
    if (gig.isWholeDay) {
      return "All Day";
    }
    if (gig.startTime && gig.endTime) {
      return `${gig.startTime} - ${gig.endTime}`;
    }
    return "";
  };

  return (
    <div
      onClick={() => navigate(`/gig/${gig.id}`)}
      className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow p-4 ${
        !hasUserAvailability ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <Link to={`/gig/${gig.id}`} className="flex-grow">
          <h3 className="text-xl font-semibold text-gray-900">{gig.name}</h3>
        </Link>
        <div className="flex items-center space-x-2">
          {!hasUserAvailability && !isPastGig && (
            <span 
              className="flex items-center text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Set availability
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm ${status?.color}`}>
            {status?.label}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 flex-grow">
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{new Date(gig.date).toLocaleDateString()}</span>
          </div>
          {(gig.status === 'pending' || gig.status === 'confirmed') && (
            <AddToCalendar gig={gig} />
          )}
        </div>
        
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{formatTime()}</span>
        </div>

        {gig.location && (
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{gig.location}</span>
          </div>
        )}
        
        {gig.pay && (
          <div className="text-gray-600">
            <span className="font-medium">${gig.pay}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <AvailabilityOverview memberAvailability={gig.memberAvailability} compact />
          {totalDrivers > 0 && (
            <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Car className="w-4 h-4" />
              <span className="ml-1 text-xs font-medium">{totalDrivers}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}