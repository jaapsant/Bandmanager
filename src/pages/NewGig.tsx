import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Gig } from '../types';
import { useGigs } from '../context/GigContext';
import { useAuth } from '../context/AuthContext';

export function NewGig() {
  const navigate = useNavigate();
  const { addGig } = useGigs();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<Gig>>({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'pending',
    isWholeDay: false,
    location: '',
    memberAvailability: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name?.trim() || !formData.date) {
        throw new Error('Name and date are required');
      }

      if (!user) {
        throw new Error('You must be logged in to create a gig');
      }

      // Validate date is not in the past
      const gigDate = new Date(formData.date);
      gigDate.setHours(23, 59, 59, 999); // End of the selected day
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      if (gigDate < today) {
        throw new Error('Cannot create gigs in the past');
      }

      // Validate time range if not whole day event
      if (!formData.isWholeDay && formData.startTime && formData.endTime) {
        const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
        const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
        
        if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
          throw new Error('End time must be after start time');
        }
      }

      // Prepare gig data, removing undefined values
      const gigData: Omit<Gig, 'id'> = {
        name: formData.name.trim(),
        date: formData.date,
        status: formData.status || 'pending',
        isWholeDay: formData.isWholeDay || false,
        memberAvailability: {},
        startTime: formData.isWholeDay ? null : formData.startTime || null,
        endTime: formData.isWholeDay ? null : formData.endTime || null,
        location: formData.location?.trim() || null,
        pay: formData.pay || null,
        description: formData.description?.trim() || null,
        createdBy: user.uid,
      };

      await addGig(gigData);
      navigate('/gigs');
    } catch (error) {
      console.error('Error creating gig:', error);
      setError(error instanceof Error ? error.message : 'Failed to create gig. Please try again.');
    }
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/gigs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Gigs
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Gig</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gig Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter venue or location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Whole Day Event
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="isWholeDay"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formData.isWholeDay}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      isWholeDay: e.target.checked,
                      startTime: e.target.checked ? null : prev.startTime,
                      endTime: e.target.checked ? null : prev.endTime,
                    }))}
                  />
                  <label htmlFor="isWholeDay" className="ml-2 block text-sm text-gray-700">
                    This is a whole day event
                  </label>
                </div>
              </div>

              {!formData.isWholeDay && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.startTime || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.endTime || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.pay || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pay: e.target.value ? parseFloat(e.target.value) : null }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/gigs')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Gig
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}