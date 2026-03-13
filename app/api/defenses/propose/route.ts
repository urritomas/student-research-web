import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api/config';

function getAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const sessionToken = req.cookies.get('session_token')?.value;
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/defenses/propose`, {
      method: 'POST',
      headers: getAuthHeaders(req),
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Invalid response from server' };
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}
