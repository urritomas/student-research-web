'use client';

import React from 'react';
import NewAccountConfigModal from '@/components/NewAccountConfigModal';

export default function OnboardingPage() {
  const handleClose = () => {
    // Don't allow closing without completing setup
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <NewAccountConfigModal
        isOpen={true}
        onClose={handleClose}
        userId="demo-user-001"
        userEmail="demo@university.edu"
        googleDisplayName="Demo User"
        googlePhotoUrl={null}
      />
    </div>
  );
}
