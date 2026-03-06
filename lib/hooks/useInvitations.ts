'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getMyInvitations,
  respondToInvitation,
  type Invitation,
} from '@/lib/api/projects';

interface UseInvitationsOptions {
  pollMs?: number;
  autoLoad?: boolean;
}

export function useInvitations(options: UseInvitationsOptions = {}) {
  const { pollMs = 15000, autoLoad = true } = options;
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const refreshInvitations = useCallback(async () => {
    const res = await getMyInvitations();
    if (res.error) {
      setError(res.error);
      setInvitations([]);
      return;
    }

    setError(null);
    setInvitations(res.data || []);
  }, []);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    await refreshInvitations();
    setLoading(false);
  }, [refreshInvitations]);

  const respond = useCallback(
    async (invitationId: string, accept: boolean) => {
      setRespondingId(invitationId);
      const res = await respondToInvitation(invitationId, accept);
      if (res.error) {
        setRespondingId(null);
        return { success: false, error: res.error };
      }

      await refreshInvitations();
      setRespondingId(null);
      return { success: true, error: null as string | null };
    },
    [refreshInvitations],
  );

  useEffect(() => {
    if (!autoLoad) return;

    let cancelled = false;

    const runInitialLoad = async () => {
      await loadInvitations();
    };

    runInitialLoad();

    if (!pollMs || pollMs <= 0) return;

    const interval = setInterval(() => {
      if (!cancelled) {
        refreshInvitations();
      }
    }, pollMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [autoLoad, loadInvitations, pollMs, refreshInvitations]);

  return {
    invitations,
    invitationCount: invitations.length,
    loading,
    error,
    respondingId,
    refreshInvitations,
    respond,
  };
}
