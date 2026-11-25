import { describe, expect, it } from 'vitest';
import { BookingError, createBookings } from '../src/bookings';
import { at } from './time';

describe('book', () => {
  it('books a free room', async () => {
    const bookings = createBookings();

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end: at('10:00') });
  });

  it('refuses a room that does not exist', async () => {
    const bookings = createBookings();

    await expect(bookings.book({ room: 'Zenith', owner: 'ada', start: at('09:00'), minutes: 60 })).rejects.toThrow(
      BookingError,
    );
  });
});
