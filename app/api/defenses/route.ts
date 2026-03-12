import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch('http://localhost:4000/api/defenses', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'cookie' : req.headers.get('cookie') || '', // Forward cookies for auth
    },
    body: JSON.stringify(body),
  });

  

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  const res = await fetch('http://localhost:4000/api/defenses/me', {
    headers: {
      'Content-Type': 'application/json',
      'cookie': req.headers.get('cookie') || '',
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const defenseId = body?.defenseId;

  if (!defenseId) {
    return NextResponse.json({ error: 'defenseId is required' }, { status: 400 });
  }

  const res = await fetch(`http://localhost:4000/api/defenses/${defenseId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}