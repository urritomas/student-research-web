'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Modal from '@/components/ui/Modal';
import {
  FiCheck,
  FiX,
  FiMapPin,
  FiClock,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiMonitor,
  FiMove,
} from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getAllDefenses,
  getPendingDefenses,
  verifyDefense,
  rejectDefense,
  setDefenseVenue,
  type Defense,
} from '@/lib/api/coordinator';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type DefenseVariant = 'success' | 'warning' | 'error' | 'default' | 'primary';

function statusBadge(status: string): { label: string; variant: DefenseVariant } {
  switch (status) {
    case 'pending': return { label: 'Pending', variant: 'warning' };
    case 'approved': return { label: 'Approved', variant: 'success' };
    case 'moved': return { label: 'Moved', variant: 'primary' };
    case 'rejected': return { label: 'Rejected', variant: 'error' };
    case 'scheduled': return { label: 'Scheduled', variant: 'default' };
    case 'completed': return { label: 'Completed', variant: 'success' };
    case 'cancelled': return { label: 'Cancelled', variant: 'error' };
    default: return { label: status, variant: 'default' };
  }
}

export default function CoordinatorDefensesPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');

  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [pendingDefenses, setPendingDefenses] = useState<Defense[]>([]);
  const [allDefenses, setAllDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedDefense, setSelectedDefense] = useState<Defense | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'move' | 'reject' | null>(null);
  const [venue, setVenue] = useState('');
  const [verifiedSchedule, setVerifiedSchedule] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sorting & expand
  const [sortBy, setSortBy] = useState<'time' | 'status'>('time');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadDefenses() {
    setLoading(true);
    const [pendingRes, allRes] = await Promise.all([
      getPendingDefenses(),
      getAllDefenses(),
    ]);
    if (pendingRes.data) setPendingDefenses(pendingRes.data);
    if (allRes.data) setAllDefenses(allRes.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    loadDefenses().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, []);

  function openModal(defense: Defense, type: 'approve' | 'move' | 'reject') {
    setSelectedDefense(defense);
    setModalType(type);
    setVenue(defense.venue || defense.location || '');
    setVerifiedSchedule('');
    setNotes('');
  }

  function closeModal() {
    setSelectedDefense(null);
    setModalType(null);
    setVenue('');
    setVerifiedSchedule('');
    setNotes('');
  }

  async function handleApprove() {
    if (!selectedDefense) return;
    setSubmitting(true);
    const res = await verifyDefense(selectedDefense.id, {
      venue: venue || undefined,
      notes: notes || undefined,
    });
    if (!res.error) {
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }

  async function handleMove() {
    if (!selectedDefense || !verifiedSchedule) return;
    setSubmitting(true);
    const res = await verifyDefense(selectedDefense.id, {
      venue: venue || undefined,
      verifiedSchedule,
      notes: notes || undefined,
    });
    if (!res.error) {
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }

  async function handleReject() {
    if (!selectedDefense) return;
    setSubmitting(true);
    const res = await rejectDefense(selectedDefense.id, notes || undefined);
    if (!res.error) {
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }



  const displayedDefenses = (() => {
    const list = tab === 'pending' ? pendingDefenses : allDefenses;
    const statusOrder: Record<string, number> = { pending: 0, moved: 1, approved: 2, rejected: 3, scheduled: 4, completed: 5, cancelled: 6 };
    return [...list].sort((a, b) => {
      if (sortBy === 'status') {
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      }
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });
  })();

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Defense Management</h1>
          <p className="text-neutral-600 mt-1">Review, verify, and manage defense schedules</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 pb-0">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'pending'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Pending Verification
            {pendingDefenses.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-warning-100 text-warning-700 rounded-full">
                {pendingDefenses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'all'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            All Defenses
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : displayedDefenses.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              {tab === 'pending' ? 'No defenses pending verification.' : 'No defenses found.'}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Sort controls */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">Sort by:</span>
              <button
                onClick={() => setSortBy('time')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  sortBy === 'time' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setSortBy('status')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  sortBy === 'status' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Status
              </button>
            </div>

            {displayedDefenses.map((defense) => {
              const badge = statusBadge(defense.status);
              const isExpanded = expandedId === defense.id;
              return (
                <Card key={defense.id} padding="md">
                  {/* Header row - always visible */}
                  <div
                    className="flex flex-col lg:flex-row lg:items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : defense.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-800 truncate">
                          {defense.project_title}
                        </h3>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <Badge variant="default">{defense.defense_type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <FiClock className="text-neutral-400" />
                          {formatDateTime(defense.scheduled_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMonitor className="text-neutral-400" />
                          {defense.modality || 'Online'}
                        </span>
                        {defense.created_by_name && (
                          <span className="text-neutral-500">
                            Proposed by {defense.created_by_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Actions for pending only */}
                      {defense.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal(defense, 'approve'); }}
                          >
                            <FiCheck className="mr-1" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal(defense, 'move'); }}
                          >
                            <FiMove className="mr-1" /> Move
                          </Button>
                          <Button
                            variant="error"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal(defense, 'reject'); }}
                          >
                            <FiX className="mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {isExpanded ? (
                        <FiChevronUp className="text-neutral-400" />
                      ) : (
                        <FiChevronDown className="text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-neutral-500">Project Code:</span>{' '}
                        <span className="text-neutral-800">{defense.project_code}</span>
                      </div>
                      <div>
                        <span className="font-medium text-neutral-500">Location:</span>{' '}
                        <span className="text-neutral-800">{defense.venue || defense.location || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-neutral-500">Modality:</span>{' '}
                        <span className="text-neutral-800">{defense.modality || 'Online'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-neutral-500">Proposed by:</span>{' '}
                        <span className="text-neutral-800">{defense.created_by_name || 'Unknown'}</span>
                      </div>
                      {defense.verified_by_name && (
                        <div>
                          <span className="font-medium text-neutral-500">Verified by:</span>{' '}
                          <span className="text-success-600">{defense.verified_by_name}</span>
                        </div>
                      )}
                      {defense.verified_schedule && defense.verified_schedule !== defense.scheduled_at && (
                        <div>
                          <span className="font-medium text-neutral-500">Modified Schedule:</span>{' '}
                          <span className="text-neutral-800">{formatDateTime(defense.verified_schedule)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Approve Modal — location only */}
      <Modal
        isOpen={modalType === 'approve' && !!selectedDefense}
        onClose={closeModal}
        title="Approve Defense Schedule"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Approve the defense schedule for <strong>{selectedDefense?.project_title}</strong> on{' '}
            <strong>{selectedDefense ? formatDateTime(selectedDefense.scheduled_at) : ''}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Location (optional update)</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter venue or room"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add notes about this approval..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleApprove} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move Modal — time/date + location */}
      <Modal
        isOpen={modalType === 'move' && !!selectedDefense}
        onClose={closeModal}
        title="Move Defense Schedule"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Move and approve the defense for <strong>{selectedDefense?.project_title}</strong>.
            The current schedule is{' '}
            <strong>{selectedDefense ? formatDateTime(selectedDefense.scheduled_at) : ''}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">New Date &amp; Time</label>
            <input
              type="datetime-local"
              value={verifiedSchedule}
              onChange={(e) => setVerifiedSchedule(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Location (optional update)</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter venue or room"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Reason for moving the schedule..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleMove} disabled={submitting || !verifiedSchedule}>
              {submitting ? 'Confirming...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={modalType === 'reject' && !!selectedDefense}
        onClose={closeModal}
        title="Reject Defense Schedule"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Reject the defense schedule for <strong>{selectedDefense?.project_title}</strong>. This will cancel the scheduled defense.
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Reason</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Explain why this schedule is being rejected..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="error" onClick={handleReject} disabled={submitting}>
              {submitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>


    </DashboardLayout>
  );
}
