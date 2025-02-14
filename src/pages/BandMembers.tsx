import React, { useState } from 'react';
import { ArrowLeft, Music, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBand } from '../context/BandContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { DraggableMember } from '../components/DraggableMember';
import { DroppableInstrument } from '../components/DroppableInstrument';
import { BandMember } from '../types';
import { useTranslation } from 'react-i18next';

export function BandMembers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles } = useRole();
  const { 
    bandMembers, 
    instruments: unsortedInstruments, 
    updateMemberInstrument,
    addInstrument, 
    removeInstrument,
    loading,
  } = useBand();

  const { t } = useTranslation();

  // Sort instruments alphabetically
  const instruments = [t('bandMembers.instruments.unassigned'), ...unsortedInstruments.sort((a, b) => a.localeCompare(b))];

  const [showInstrumentForm, setShowInstrumentForm] = useState(false);
  const [newInstrument, setNewInstrument] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeMember, setActiveMember] = useState<BandMember | null>(null);

  const canManageBand = roles.admin || roles.bandManager;

  // Configure sensors for better drag control
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Group members by instrument
  const membersByInstrument = bandMembers.reduce((acc, member) => {
    const instrument = member.instrument || 'Unassigned';
    if (!acc[instrument]) {
      acc[instrument] = [];
    }
    acc[instrument].push(member);
    return acc;
  }, {} as Record<string, typeof bandMembers>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('bandMembers.loading')}</div>
      </div>
    );
  }

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const draggedMember = bandMembers.find(m => m.id === active.id);
    if (draggedMember) {
      setActiveMember(draggedMember);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMember(null);

    // Only process if there's a valid drop target
    if (!over || !instruments.includes(over.id as string)) {
      return;
    }

    const memberId = active.id as string;
    const newInstrument = over.id as string;
    
    // Don't update if dropping in the same instrument group
    const member = bandMembers.find(m => m.id === memberId);
    if (member?.instrument === newInstrument || 
        (!member?.instrument && newInstrument === 'Unassigned')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await updateMemberInstrument(
        memberId, 
        newInstrument === t('bandMembers.instruments.unassigned') ? '' : newInstrument
      );
      setSuccess(t('bandMembers.messages.success.updateInstrument'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bandMembers.messages.error.updateInstrument'));
    }
  };

  const handleInstrumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newInstrument.trim()) {
      try {
        await addInstrument(newInstrument);
        setNewInstrument('');
        setShowInstrumentForm(false);
        setSuccess(t('bandMembers.messages.success.addInstrument'));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('bandMembers.messages.error.addInstrument'));
      }
    }
  };

  const handleRemoveInstrument = async (instrument: string) => {
    if (!canManageBand) return;
    
    const hasMembers = membersByInstrument[instrument]?.length > 0;
    if (hasMembers) {
      setError(t('bandMembers.messages.error.removeInstrument.hasMembers'));
      return;
    }

    try {
      setError('');
      setSuccess('');
      await removeInstrument(instrument);
      setSuccess(t('bandMembers.messages.success.removeInstrument'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bandMembers.messages.error.removeInstrument.failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/gigs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('bandMembers.navigation.backToGigs')}
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-red-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">{t('bandMembers.title')}</h1>
            </div>
            {canManageBand && user?.emailVerified && (
              <button
                onClick={() => setShowInstrumentForm(true)}
                className="bg-white text-gray-600 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 border border-gray-300"
              >
                <Music className="w-5 h-5 mr-2" />
                {t('bandMembers.instruments.addButton')}
              </button>
            )}
          </div>

          {showInstrumentForm && (
            <form onSubmit={handleInstrumentSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('bandMembers.instruments.form.title')}
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  placeholder={t('bandMembers.instruments.form.placeholder')}
                />
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInstrumentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('bandMembers.instruments.form.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  {t('bandMembers.instruments.form.submit')}
                </button>
              </div>
            </form>
          )}

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instruments.map((instrument) => (
                <DroppableInstrument
                  key={instrument}
                  instrument={instrument}
                  members={membersByInstrument[instrument] || []}
                  canManage={canManageBand || !!user?.uid}
                  headerContent={
                    canManageBand && instrument !== 'Unassigned' && (
                      <button
                        onClick={() => handleRemoveInstrument(instrument)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title={t('bandMembers.instruments.removeButton')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  }
                >
                  <SortableContext
                    items={membersByInstrument[instrument]?.map(m => m.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {(membersByInstrument[instrument] || []).map((member) => (
                      <DraggableMember
                        key={member.id}
                        member={member}
                        canDrag={canManageBand || member.id === user?.uid}
                      />
                    ))}
                  </SortableContext>
                </DroppableInstrument>
              ))}
            </div>

            <DragOverlay>
              {activeMember && (
                <div className="bg-white shadow-lg rounded-md p-2 border border-gray-200">
                  <span className="text-sm text-gray-900">{activeMember.name}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}