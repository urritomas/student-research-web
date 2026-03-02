'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';

export default function MeetingSchedule() {
  const { user, isLoading, handleLogout } = useDashboardUser('Adviser');

  const [form, setForm] = useState({
    name: '',
    section: '',
    time: '',
    date: '',
    allowPartialTime: false,
    meetingType: 'Online',
    roomOption: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = () => {
    console.log('Booking meeting:', form);
    // TODO: call your API here
  };

  const handleClear = () => {
    setForm({
      name: '',
      section: '',
      time: '',
      date: '',
      allowPartialTime: false,
      meetingType: 'Online',
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

            {/* Book a Meeting Form */}
            <div>
              <Card className="border border-neutral-300 p-6">
                <h1 className="text-xl font-semibold text-neutral-700 mb-6">Book a Meeting</h1>

                {/* Name & Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                    <p className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={form.section}
                      onChange={handleChange}
                      placeholder="Section name"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Time & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
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

                {/* Meeting Type */}
                <div className="mb-4">
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

                {/* Room Option - only for Face-to-Face */}
                {form.meetingType === 'Face-to-Face' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Room Option</label>
                    <select
                      name="roomOption"
                      value={form.roomOption}
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
                  <Button variant="error" onClick={handleSubmit}>
                    Book Meeting
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>

              </Card>
            </div>

            <div className="pt-6">
              <h1 className="text-3xl font-bold text-primary-700">Recent Scheduled Meetings</h1>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}