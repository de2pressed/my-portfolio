import { NextResponse } from 'next/server';
import {
  addReview,
  getReviews,
  hasReviewForEmail,
} from '../../../lib/content-store';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  return NextResponse.json({ reviews: await getReviews() });
}

export async function POST(request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const { email, message, name } = payload || {};

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { message: 'A valid email address is required to submit a review.' },
        { status: 400 },
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { message: 'A review message is required.' },
        { status: 400 },
      );
    }

    if (await hasReviewForEmail(email)) {
      return NextResponse.json(
        { message: 'A review from this email already exists.' },
        { status: 409 },
      );
    }

    const review = await addReview({
      email,
      message: message.trim(),
      name: name?.trim(),
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to submit review.' },
      { status: 400 },
    );
  }
}
