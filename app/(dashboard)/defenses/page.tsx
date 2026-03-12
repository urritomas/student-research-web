'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { type ProjectMember } from '@/lib/api/projects';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';

interface ScheduledDefense {
  id: string;
  project_title: string;
  project_code: string;
  start_time: string;
  end_time: string;
  defense_type: string;
  location: string;
  status: string;
  status_label?: 'Approved' | 'Pending' | 'Cancelled';
}

type UiNotice = { type: 'success' | 'error'; message: string } | null;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function computeTotalTime(start: string, end: string) {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export default function MeetingSchedule() {
  const { user, isLoading, handleLogout } = useDashboardUser('Adviser');

  const searchParams = useSearchParams();

  const [defenses, setDefenses] = useState<ScheduledDefense[]>([]);
  const [defensesLoading, setDefensesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notice, setNotice] = useState<UiNotice>(null);
  const [selectedDefense, setSelectedDefense] = useState<ScheduledDefense | null>(null);

  const [form, setForm] = useState({
    projectId: '',
    projectCode: '',
    projectTitle: '',
    section: '',
    startTime: '',
    endTime: '',
    date: '',
    allowPartialTime: false,
    meetingType: 'Online',
    defenseType: 'Proposal',
    roomOption: '',
  });

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    const projectId = searchParams.get('project_id');
    const projectCode = searchParams.get('project_code');
    const title = searchParams.get('title');
    if (projectId || projectCode || title) {
      setForm(prev => ({
        ...prev,
        projectId: projectId || prev.projectId,
        projectCode: projectCode || prev.projectCode,
        projectTitle: title || prev.projectTitle,
      }));
    }

    // Load members passed from advisees detail page
    const storedMembers = localStorage.getItem('projectMembers');
    if (storedMembers) {
      try {
        setProjectMembers(JSON.parse(storedMembers));
      } catch (err) {
        console.error('Failed to parse stored members:', err);
      }
      localStorage.removeItem('projectMembers');
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function fetchDefenses() {
      try {
        const res = await fetch('/api/defenses', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch defenses');
        const data = await res.json();
        if (!cancelled) setDefenses(data);
      } catch (err) {
        console.error('Failed to load defenses:', err);
      } finally {
        if (!cancelled) setDefensesLoading(false);
      }
    }
    fetchDefenses();
    return () => { cancelled = true; };
  }, []);

  const fetchDefenses = async () => {
    const res = await fetch('/api/defenses', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch defenses');
    const data = await res.json();
    setDefenses(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const defenseTypeMap: Record<string, 'proposal' | 'midterm' | 'final'> = {
      Proposal: 'proposal',
      Midterm: 'midterm',
      Final: 'final',
    };

    if (!form.projectId) {
      setNotice({ type: 'error', message: 'Project ID is required. Please open booking from a project page.' });
      return;
    }
    if (!form.date || !form.startTime || !form.endTime) {
      setNotice({ type: 'error', message: 'Date, start time, and end time are required.' });
      return;
    }
    if (form.meetingType === 'Face-to-Face' && !form.roomOption) {
      setNotice({ type: 'error', message: 'Please select a room for Face-to-Face meetings.' });
      return;
    }

    const startDate = new Date(`${form.date}T${form.startTime}:00`);
    const endDate = new Date(`${form.date}T${form.endTime}:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
      setNotice({ type: 'error', message: 'End time must be after start time.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setNotice(null);

      const payload = {
        project_id: form.projectId,
        defense_type: defenseTypeMap[form.defenseType] || 'proposal',
        start_time: `${form.date}T${form.startTime}:00`,
        end_time: `${form.date}T${form.endTime}:00`,
        location: form.meetingType === 'Face-to-Face'
          ? `Face-to-Face - ${form.roomOption}`
          : 'Online',
        partial_time: form.allowPartialTime ? 1 : 0,
        section: form.section || null,
      };

      const res = await fetch('/api/defenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to book meeting.');
      }

      setNotice({ type: 'success', message: 'Meeting booked successfully.' });
      handleClear();
      await fetchDefenses();
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to book meeting.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!selectedDefense || isCancelling) return;

    try {
      setIsCancelling(true);
      const res = await fetch('/api/defenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defenseId: selectedDefense.id }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to cancel meeting.');
      }

      setNotice({ type: 'success', message: 'Meeting cancelled successfully.' });
      setSelectedDefense(null);
      await fetchDefenses();
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to cancel meeting.' });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusMeta = (defense: ScheduledDefense) => {
    const label = defense.status_label || (defense.status === 'cancelled' ? 'Cancelled' : defense.status === 'completed' ? 'Approved' : 'Pending');
    if (label === 'Cancelled') return { label, variant: 'error' as const };
    if (label === 'Approved') return { label, variant: 'approved' as const };
    return { label: 'Pending', variant: 'pending' as const };
  };

  const handleClear = () => {
    setForm({
      projectId: '',
      projectCode: '',
      projectTitle: '',
      section: '',
      startTime: '',
      endTime: '',
      date: '',
      allowPartialTime: false,
      meetingType: 'Online',
      defenseType: 'Proposal',
      roomOption: '',
    });
  };

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading...</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold text-primary-700">Meeting Schedule</h1>
              <p className="text-neutral-600 mt-1">Manage your meeting availability and scheduled sessions</p>
            </div>

            {notice && (
              <div className={`rounded-lg border px-4 py-3 text-sm ${notice.type === 'error'
                ? 'border-error-200 bg-error-50 text-error-700'
                : 'border-success-200 bg-success-50 text-success-700'
              }`}>
                {notice.message}
              </div>
            )}

            {/* Book a Meeting Form */}
            <div>
              <Card className="border border-neutral-300 p-6">
                <h1 className="text-xl font-semibold text-neutral-700 mb-6">Book a Meeting</h1>

                {/* Project Code and Project Title and Section*/}
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Project Code</label>
                    <input
                      type="text"
                      name="projectCode"
                      value={form.projectCode || ''}
                      onChange={handleChange}
                      placeholder="Project Code"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Project Title</label>
                    <input
                      type="text"
                      name="projectTitle"
                      value={form.projectTitle || ''}
                      onChange={handleChange}
                      placeholder="Project Title"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={form.section || ''}
                      onChange={handleChange}
                      placeholder="Section"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Team Members - read-only */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Team Members</label>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    {projectMembers.length > 0 ? (
                      <div className="space-y-2">
                        {projectMembers.map((member) => (
                          <div key={member.id} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="text-neutral-700 font-medium">{member.users?.full_name || 'Unknown'}</p>
                              <p className="text-neutral-500 text-xs">{member.users?.email || 'No email'}</p>
                            </div>
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded capitalize">
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400">No members loaded</p>
                    )}
                  </div>
                </div>

                {/* Time Range & Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime || ''}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime || ''}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date || ''}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Allow Partial Time Toggle */}
                <div className="flex items-center justify-between mb-4 py-2">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Allow Partial Time</p>
                    <p className="text-xs text-neutral-500">Enable if you're willing to wait for participants to finish their other meetings</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, allowPartialTime: !prev.allowPartialTime }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.allowPartialTime ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.allowPartialTime ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Meeting Type & Defense Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">Meeting Type</p>
                    <div className="space-y-1">
                      {['Online', 'Face-to-Face'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="meetingType"
                            value={type}
                            checked={form.meetingType === type}
                            onChange={handleChange}
                            className="accent-primary-500"
                          />
                          <span className="text-sm text-neutral-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">Defense Type</p>
                    <div className="space-y-1">
                      {['Proposal', 'Midterm', 'Final'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="defenseType"
                            value={type}
                            checked={form.defenseType === type}
                            onChange={handleChange}
                            className="accent-primary-500"
                          />
                          <span className="text-sm text-neutral-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Room Option - only for Face-to-Face */}
                {form.meetingType === 'Face-to-Face' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Room Option</label>
                    <select
                      name="roomOption"
                      value={form.roomOption || ''}
                      onChange={handleChange}
                      className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a room</option>
                      <option value="room1">Room 1</option>
                      <option value="room2">Room 2</option>
                      <option value="room3">Room 3</option>
                    </select>
                  </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button variant="error" onClick={handleSubmit} loading={isSubmitting}>
                    {isSubmitting ? 'Booking...' : 'Book Meeting'}
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>

              </Card>
            </div>

            <div className="pt-6">
              <h1 className="text-3xl font-bold text-primary-700">Recent Scheduled Meetings</h1>
              <Card className="border border-neutral-300 mt-4 overflow-hidden">
                {defensesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-neutral-500">Loading meetings...</p>
                  </div>
                ) : defenses.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-neutral-500">No scheduled meetings yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 font-medium text-neutral-600">Project Title</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Project Code</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Start Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">End Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Total Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Status</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {defenses.map((d) => (
                          <tr
                            key={d.id}
                            className="hover:bg-neutral-50 cursor-pointer"
                            onClick={() => setSelectedDefense(d)}
                          >
                            <td className="px-4 py-3 text-neutral-800">{d.project_title}</td>
                            <td className="px-4 py-3 text-neutral-600">{d.project_code}</td>
                            <td className="px-4 py-3 text-neutral-600">{formatDateTime(d.start_time)}</td>
                            <td className="px-4 py-3 text-neutral-600">{formatDateTime(d.end_time)}</td>
                            <td className="px-4 py-3 text-neutral-600">{computeTotalTime(d.start_time, d.end_time)}</td>
                            <td className="px-4 py-3">
                              <Badge variant={getStatusMeta(d).variant}>{getStatusMeta(d).label}</Badge>
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              Click row
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!selectedDefense}
        onClose={() => setSelectedDefense(null)}
        title="Meeting Details"
        size="md"
      >
        {selectedDefense && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-neutral-500">Project</p>
              <p className="font-medium text-neutral-800">{selectedDefense.project_title}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Schedule</p>
              <p className="font-medium text-neutral-800">
                {formatDateTime(selectedDefense.start_time)} - {formatDateTime(selectedDefense.end_time)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Location</p>
              <p className="font-medium text-neutral-800">{selectedDefense.location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Status</p>
              <Badge variant={getStatusMeta(selectedDefense).variant}>{getStatusMeta(selectedDefense).label}</Badge>
            </div>

            <ModalFooter>
              <Button variant="outline" onClick={() => setSelectedDefense(null)}>
                Close
              </Button>
              <Button
                variant="error"
                onClick={handleCancelMeeting}
                loading={isCancelling}
                disabled={getStatusMeta(selectedDefense).label === 'Cancelled'}
              >
                {getStatusMeta(selectedDefense).label === 'Cancelled' ? 'Already Cancelled' : 'Cancel Meeting'}
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}