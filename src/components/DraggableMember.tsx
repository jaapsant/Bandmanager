import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { BandMember } from '../types';

interface DraggableMemberProps {
  member: BandMember;
  canDrag: boolean;
}

export function DraggableMember({ member, canDrag }: DraggableMemberProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-2 ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
      {...attributes}
    >
      {canDrag && (
        <div {...listeners} className="mr-2 text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <span className="text-sm text-gray-900">{member.name}</span>
    </div>
  );
}