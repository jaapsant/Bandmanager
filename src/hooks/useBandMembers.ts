import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useBand } from '../context/BandContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from './useRole';
import { BandMember } from '../types';

export interface SheetMusicSummaryItem {
  instrument: string;
  wantsPrinted: number;
  total: number;
}

export interface UseBandMembersReturn {
  // Data
  bandMembers: BandMember[];
  instruments: string[];
  membersByInstrument: Record<string, BandMember[]>;
  sheetMusicSummary: SheetMusicSummaryItem[];
  totalWantsPrinted: number;
  totalMembers: number;
  user: ReturnType<typeof useAuth>['user'];

  // State
  loading: boolean;
  showInstrumentForm: boolean;
  newInstrument: string;
  error: string;
  success: string;
  activeMember: BandMember | null;
  canManageBand: boolean;

  // DnD
  sensors: ReturnType<typeof useSensors>;

  // Actions
  setShowInstrumentForm: (show: boolean) => void;
  setNewInstrument: (value: string) => void;
  handleDragStart: (event: DragEndEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  handleInstrumentSubmit: (e: React.FormEvent) => Promise<void>;
  handleRemoveInstrument: (instrument: string) => Promise<void>;
  navigateBack: () => void;

  // Translation
  t: ReturnType<typeof useTranslation>['t'];
}

export function useBandMembers(): UseBandMembersReturn {
  const { t } = useTranslation();
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

  // Sort instruments alphabetically and add "Unassigned" at the beginning
  const instruments = useMemo(() => {
    return [t('bandMembers.instruments.unassigned'), ...unsortedInstruments.sort((a, b) => a.localeCompare(b))];
  }, [unsortedInstruments, t]);

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
  const unassignedLabel = t('bandMembers.instruments.unassigned');
  const membersByInstrument = useMemo(() => {
    return bandMembers.reduce((acc, member) => {
      const instrument = member.instrument || unassignedLabel;
      if (!acc[instrument]) {
        acc[instrument] = [];
      }
      acc[instrument].push(member);
      return acc;
    }, {} as Record<string, BandMember[]>);
  }, [bandMembers, unassignedLabel]);

  // Calculate sheet music summary
  const sheetMusicSummary = useMemo(() => {
    return Object.entries(membersByInstrument)
      .map(([instrument, members]) => {
        const wantsPrinted = members.filter(m => m.wantsPrintedSheetMusic).length;
        const total = members.length;
        return { instrument, wantsPrinted, total };
      })
      .filter(item => item.total > 0);
  }, [membersByInstrument]);

  const totalWantsPrinted = useMemo(() => {
    return sheetMusicSummary.reduce((sum, item) => sum + item.wantsPrinted, 0);
  }, [sheetMusicSummary]);

  const totalMembers = bandMembers.length;

  const handleDragStart = useCallback((event: DragEndEvent) => {
    const { active } = event;
    const draggedMember = bandMembers.find(m => m.id === active.id);
    if (draggedMember) {
      setActiveMember(draggedMember);
    }
  }, [bandMembers]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMember(null);

    // Only process if there's a valid drop target
    if (!over || !instruments.includes(over.id as string)) {
      return;
    }

    const memberId = active.id as string;
    const newInstrumentValue = over.id as string;

    // Don't update if dropping in the same instrument group
    const member = bandMembers.find(m => m.id === memberId);
    if (member?.instrument === newInstrumentValue ||
      (!member?.instrument && newInstrumentValue === 'Unassigned')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await updateMemberInstrument(
        memberId,
        newInstrumentValue === t('bandMembers.instruments.unassigned') ? '' : newInstrumentValue
      );
      setSuccess(t('bandMembers.messages.success.updateInstrument'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bandMembers.messages.error.updateInstrument'));
    }
  }, [instruments, bandMembers, updateMemberInstrument, t]);

  const handleInstrumentSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [newInstrument, addInstrument, t]);

  const handleRemoveInstrument = useCallback(async (instrument: string) => {
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
  }, [canManageBand, membersByInstrument, removeInstrument, t]);

  const navigateBack = useCallback(() => {
    navigate('/gigs');
  }, [navigate]);

  return {
    // Data
    bandMembers,
    instruments,
    membersByInstrument,
    sheetMusicSummary,
    totalWantsPrinted,
    totalMembers,
    user,

    // State
    loading,
    showInstrumentForm,
    newInstrument,
    error,
    success,
    activeMember,
    canManageBand,

    // DnD
    sensors,

    // Actions
    setShowInstrumentForm,
    setNewInstrument,
    handleDragStart,
    handleDragEnd,
    handleInstrumentSubmit,
    handleRemoveInstrument,
    navigateBack,

    // Translation
    t,
  };
}
