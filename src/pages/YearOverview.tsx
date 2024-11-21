import { useParams, useNavigate } from 'react-router-dom';
import { useGigs } from '../context/GigContext';
import { useMembers } from '../context/MemberContext';
import { ArrowLeft } from 'lucide-react';

export function YearOverview() {
  const { year } = useParams();
  const { gigs } = useGigs();
  const { members } = useMembers();
  const navigate = useNavigate();

  const yearGigs = gigs.filter(
    gig => new Date(gig.date).getFullYear().toString() === year
  );

  const stats = {
    totalGigs: yearGigs.length,
    completedGigs: yearGigs.filter(gig => gig.status === 'completed').length,
    cancelledGigs: yearGigs.filter(gig => gig.status === 'declined').length,
    totalPay: yearGigs.reduce((sum, gig) => sum + (Number(gig.pay) || 0), 0),
    totalDistance: yearGigs.reduce((sum, gig) => sum + (Number(gig.distance) || 0), 0),
  };

  const memberStats = members.map(member => {
    const memberGigs = yearGigs.filter(gig => 
      gig.availability?.some(a => a.memberId === member.id)
    );

    return {
      member,
      stats: {
        available: memberGigs.filter(gig => 
          gig.availability?.find(a => a.memberId === member.id)?.status === 'available'
        ).length,
        unavailable: memberGigs.filter(gig => 
          gig.availability?.find(a => a.memberId === member.id)?.status === 'unavailable'
        ).length,
        tentative: memberGigs.filter(gig => 
          gig.availability?.find(a => a.memberId === member.id)?.status === 'tentative'
        ).length,
        totalDistance: memberGigs.reduce((sum, gig) => {
          const isAvailable = gig.availability?.find(a => 
            a.memberId === member.id
          )?.status === 'available';
          return sum + (isAvailable ? (Number(gig.distance) || 0) : 0);
        }, 0)
      }
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/gigs', { state: { showHistory: true } })}
            className="flex items-center text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Gig History
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {year} Year Overview
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Gigs</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalGigs}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Completed Gigs</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completedGigs}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Cancelled Gigs</h3>
            <p className="text-3xl font-bold text-red-600">{stats.cancelledGigs}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Pay</h3>
            <p className="text-3xl font-bold text-indigo-600">
              ${stats.totalPay.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Distance</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {stats.totalDistance.toLocaleString()} km
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Band Member Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberStats?.map(({ member, stats }) => (
            <div key={member.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{member.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">{stats.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unavailable:</span>
                  <span className="font-medium text-red-600">{stats.unavailable}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tentative:</span>
                  <span className="font-medium text-yellow-600">{stats.tentative}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Total Distance:</span>
                  <span className="font-medium text-indigo-600">
                    {stats.totalDistance.toLocaleString()} km
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}