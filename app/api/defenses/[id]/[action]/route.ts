import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api/config';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await params;

  if (!['cancel', 'reschedule'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const body = action === 'reschedule' ? await req.json() : undefined;

  const res = await fetch(`${API_BASE_URL}/defenses/${id}/${action}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
