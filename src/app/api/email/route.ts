import { GigInviteEmail } from '../../../lib/emails/GigInviteEmail';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { render } from '@react-email/render';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { gig, recipients } = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailHtml = render(GigInviteEmail({ gig, baseUrl }));

    const response = await fetch('https://api.useplunk.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        to: recipients,
        subject: `Gig Invitation: ${gig.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Plunk API error:', errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 