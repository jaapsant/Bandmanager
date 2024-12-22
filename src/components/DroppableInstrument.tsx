import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Music } from 'lucide-react';

interface DroppableInstrumentProps {
  instrument: string;
  members: any[];
  children: React.ReactNode;
  canManage: boolean;
  headerContent?: React.ReactNode;
}

export function DroppableInstrument({ 
  instrument, 
  members, 
  children,
  canManage,
  headerContent,
}: DroppableInstrumentProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: instrument,
    disabled: !canManage,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-4 ${
        isOver && active ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Music className="w-4 h-4 text-gray-400 mr-2" />
          <h3 className="font-medium text-gray-900">
            {instrument}
            <span className="ml-2 text-sm text-gray-500">
              ({members.length})
            </span>
          </h3>
        </div>
        {headerContent}
      </div>
      <div className="space-y-1 min-h-[2rem]">
        {children}
      </div>
    </div>
  );
}