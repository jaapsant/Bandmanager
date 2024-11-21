import { useParams, useNavigate } from 'react-router-dom';
import { useGigs } from '../context/GigContext';
import { ArrowLeft, ArrowUpDown, X } from 'lucide-react';
import { useBand } from '../context/BandContext';
import { useState } from 'react';
import { useRole } from '../hooks/useRole';

export function YearOverview() {
  const { year } = useParams();
  const { gigs } = useGigs();
  const navigate = useNavigate();
  const { bandMembers } = useBand();
  const { roles } = useRole();

  const yearGigs = gigs.filter(
    gig => new Date(gig.date).getFullYear().toString() === year
  );

  const stats = {
    totalGigs: yearGigs.length,
    completedGigs: yearGigs.filter(gig => gig.status === 'completed').length,
    cancelledGigs: yearGigs.filter(gig => gig.status === 'declined').length,
    completedPay: yearGigs
      .filter(gig => gig.status === 'completed')
      .reduce((sum, gig) => sum + (Number(gig.pay) || 0), 0),
    confirmedPay: yearGigs
      .filter(gig => gig.status === 'completed' || gig.status === 'confirmed')
      .reduce((sum, gig) => sum + (Number(gig.pay) || 0), 0),
    totalDistance: yearGigs.reduce((sum, gig) => sum + (Number(gig.distance) || 0), 0),
  };

  const memberStats = Array.from(new Set(
    yearGigs.flatMap(gig => 
      Object.entries(gig.memberAvailability || {}).map(([memberId]) => memberId)
    )
  )).map(memberId => {
    const memberName = bandMembers.find(m => m.id === memberId)?.name || memberId;

    const memberGigs = yearGigs.filter(gig => 
      gig.status !== 'declined' && 
      gig.memberAvailability?.[memberId]?.status !== undefined
    );

    return {
      member: { id: memberId, name: memberName },
      stats: {
        available: memberGigs.filter(gig => 
          gig.memberAvailability?.[memberId]?.status === 'available'
        ).length,
        totalDistance: memberGigs.reduce((sum, gig) => {
          const isAvailableAndDriving = gig.memberAvailability?.[memberId]?.status === 'available' 
            && gig.memberAvailability?.[memberId]?.canDrive === true;
          return sum + (isAvailableAndDriving ? (Number(gig.distance) || 0) : 0);
        }, 0)
      }
    };
  });

  console.log('Year Gigs:', yearGigs);
  console.log('Member Stats:', memberStats);

  type SortField = 'name' | 'available' | 'totalDistance';
  const [sortField, setSortField] = useState<SortField>('available');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedMemberStats = [...memberStats].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'name') {
      return direction * a.member.name.localeCompare(b.member.name);
    }
    const primarySort = direction * (a.stats[sortField] - b.stats[sortField]);
    if (primarySort === 0 && sortField === 'available') {
      return -1 * (a.stats.totalDistance - b.stats.totalDistance);
    }
    return primarySort;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const [selectedMember, setSelectedMember] = useState<{
    member: { id: string; name: string };
    gigs: Array<{ title: string; venue: string; distance: number }>;
  } | null>(null);

  const getDriverGigs = (memberId: string) => {
    return yearGigs
      .filter(gig => 
        gig.status !== 'declined' && 
        gig.memberAvailability?.[memberId]?.status === 'available' &&
        gig.memberAvailability?.[memberId]?.canDrive === true
      )
      .map(gig => ({
        title: gig.name,
        venue: gig.location || 'No location',
        distance: Number(gig.distance) || 0
      }));
  };

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
              €{stats.completedPay.toLocaleString()}
            </p>
            {year === new Date().getFullYear().toString() && (
              <p className="text-sm text-gray-500 mt-1">
                Confirmed: €{stats.confirmedPay.toLocaleString()}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Distance</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {stats.totalDistance.toLocaleString()} km
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Band Member Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">
                  <button 
                    className="flex items-center gap-1 font-semibold text-gray-900 hover:text-indigo-600"
                    onClick={() => handleSort('name')}
                  >
                    Name <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                {(roles.admin || roles.bandManager) && (
                  <th className="px-6 py-3 text-left">
                    <button 
                      className="flex items-center gap-1 font-semibold text-gray-900 hover:text-indigo-600"
                      onClick={() => handleSort('available')}
                    >
                      Gigs Played <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                )}
                <th className="px-6 py-3 text-left border-l">
                  <button 
                    className="flex items-center gap-1 font-semibold text-gray-900 hover:text-indigo-600"
                    onClick={() => handleSort('totalDistance')}
                  >
                    Distance Driven <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMemberStats.map(({ member, stats }) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{member.name}</td>
                  {(roles.admin || roles.bandManager) && (
                    <td className="px-6 py-4 text-green-600">{stats.available}</td>
                  )}
                  <td className="px-6 py-4 border-l text-indigo-600">
                    <button
                      onClick={() => setSelectedMember({
                        member,
                        gigs: getDriverGigs(member.id)
                      })}
                      className="hover:underline focus:outline-none"
                    >
                      {stats.totalDistance.toLocaleString()} km
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Driving Details for {selectedMember.member.name}
                </h3>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-right">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMember.gigs.map((gig, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{gig.title}</td>
                        <td className="px-4 py-2">{gig.venue}</td>
                        <td className="px-4 py-2 text-right">{gig.distance.toLocaleString()} km</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="px-4 py-2" colSpan={2}>Total</td>
                      <td className="px-4 py-2 text-right">
                        {selectedMember.gigs.reduce((sum, gig) => sum + gig.distance, 0).toLocaleString()} km
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}