import { ReactNode } from 'react';
import { Users, Music, Trash2 } from 'lucide-react';
import { TFunction } from 'i18next';
import { DndContext, DragEndEvent, closestCenter, DragOverlay, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BandMember } from '../../types';
import { DraggableMember } from '../DraggableMember';
import { DroppableInstrument } from '../DroppableInstrument';

interface InstrumentMembersCardProps {
  instruments: string[];
  membersByInstrument: Record<string, BandMember[]>;
  activeMember: BandMember | null;
  canManageBand: boolean;
  userId: string | undefined;
  sensors: SensorDescriptor<SensorOptions>[];
  showInstrumentForm: boolean;
  newInstrument: string;
  onDragStart: (event: DragEndEvent) => void;
  onDragEnd: (event: DragEndEvent) => Promise<void>;
  onRemoveInstrument: (instrument: string) => Promise<void>;
  onShowInstrumentForm: () => void;
  onHideInstrumentForm: () => void;
  onNewInstrumentChange: (value: string) => void;
  onInstrumentSubmit: (e: React.FormEvent) => Promise<void>;
  isEmailVerified: boolean;
  t: TFunction;
}

export function InstrumentMembersCard({
  instruments,
  membersByInstrument,
  activeMember,
  canManageBand,
  userId,
  sensors,
  showInstrumentForm,
  newInstrument,
  onDragStart,
  onDragEnd,
  onRemoveInstrument,
  onShowInstrumentForm,
  onHideInstrumentForm,
  onNewInstrumentChange,
  onInstrumentSubmit,
  isEmailVerified,
  t,
}: InstrumentMembersCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Users className="w-6 h-6 text-red-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">{t('bandMembers.title')}</h1>
        </div>
        {canManageBand && isEmailVerified && (
          <button
            onClick={onShowInstrumentForm}
            className="bg-white text-gray-600 px-3 sm:px-4 py-2 rounded-md flex items-center hover:bg-gray-50 border border-gray-300"
          >
            <Music className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">{t('bandMembers.instruments.addButton')}</span>
            <span className="sm:hidden ml-1">+</span>
          </button>
        )}
      </div>

      {showInstrumentForm && (
        <form onSubmit={onInstrumentSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('bandMembers.instruments.form.title')}
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={newInstrument}
              onChange={(e) => onNewInstrumentChange(e.target.value)}
              placeholder={t('bandMembers.instruments.form.placeholder')}
            />
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onHideInstrumentForm}
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
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instruments.map((instrument) => (
            <DroppableInstrument
              key={instrument}
              instrument={instrument}
              members={membersByInstrument[instrument] || []}
              canManage={canManageBand || !!userId}
              headerContent={
                canManageBand && instrument !== 'Unassigned' && (
                  <button
                    onClick={() => onRemoveInstrument(instrument)}
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
                    canDrag={canManageBand || member.id === userId}
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
  );
}
