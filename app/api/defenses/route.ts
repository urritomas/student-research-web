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
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}