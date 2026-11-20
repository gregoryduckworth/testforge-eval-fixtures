// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13, TC14, TC15
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';
import { at } from './support/time';

const MINUTE_MS = 60_000;

/** What a call settles with: the error it rejects with, or the value it resolves to when it should not have. */
const settled = (pending: Promise<unknown>): Promise<unknown> => pending.catch((error: unknown) => error);

describe('book', () => {
  it.each(ROOMS)("books each of the office's rooms: %s", async (room) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00'), end: at('10:00') });
  });

  it.each(['Zenith', 'atlas', ''])('refuses a booking of room "%s", saying there is no such room', async (room) => {
    const bookings = createBookings();

    const error = await settled(bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', `There is no room called "${room}".`);
  });

  it.each(['', '   '])('refuses a booking whose owner is "%s"', async (owner) => {
    const bookings = createBookings();

    const error = await settled(bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'A booking needs the name of the person making it.');
  });

  it.each([
    '2026-03-02T09:00:00Z',
    '2026-03-02T09:30:00Z',
    // 03:30 UTC: a half hour in UTC although the local offset is not whole hours
    '2026-03-02T09:00:00+05:30',
  ])('accepts a booking starting at %s', async (start) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: new Date(start), minutes: 30 });

    expect(booking.start).toStrictEqual(new Date(start));
  });

  it.each([
    '2026-03-02T09:15:00Z',
    '2026-03-02T09:00:01Z',
    '2026-03-02T09:29:59.999Z',
    // 03:15 UTC: on the hour locally, but not in UTC
    '2026-03-02T09:00:00+05:45',
    'not a date',
  ])('refuses a booking starting at %s, saying it must start on the hour or half hour', async (start) => {
    const bookings = createBookings();

    const error = await settled(bookings.book({ room: 'Atlas', owner: 'ada', start: new Date(start), minutes: 30 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'A booking starts on the hour or the half hour.');
  });

  it.each([30, 90, 240])('books %i minutes, ending that long after the start', async (minutes) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes });

    expect(booking.end).toStrictEqual(new Date(at('09:00').getTime() + minutes * MINUTE_MS));
  });

  it.each([0, -30, 29, 45, 270, 30.5, Number.NaN])(
    'refuses a booking of %s minutes, saying how long a booking may last',
    async (minutes) => {
      const bookings = createBookings();

      const error = await settled(bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.');
    },
  );
});

describe('book, against the bookings already made', () => {
  it.each([
    { shape: 'is the same slot', start: '10:00', minutes: 120 },
    { shape: 'sits inside it', start: '10:30', minutes: 60 },
    { shape: 'covers it', start: '09:30', minutes: 180 },
    { shape: 'overlaps its start', start: '09:00', minutes: 90 },
    { shape: 'overlaps its end', start: '11:30', minutes: 60 },
  ])('refuses a booking of the same room that $shape', async ({ start, minutes }) => {
    const bookings = createBookings();
    const existing = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const error = await settled(bookings.book({ room: 'Atlas', owner: 'bob', start: at(start), minutes }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'Atlas is already booked from 2026-03-02T10:00:00.000Z.');
    expect(await bookings.list('Atlas')).toStrictEqual([existing]);
  });

  it('books the same slot in a different room', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const booking = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('10:00'), minutes: 120 });

    expect(await bookings.list('Borealis')).toStrictEqual([booking]);
  });

  it.each([
    { shape: 'starts when another ends', start: '12:00', end: '13:00' },
    { shape: 'ends when another starts', start: '09:00', end: '10:00' },
  ])('books a slot that $shape', async ({ start, end }) => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const booking = await bookings.book({ room: 'Atlas', owner: 'bob', start: at(start), minutes: 60 });

    expect(booking).toMatchObject({ room: 'Atlas', owner: 'bob', start: at(start), end: at(end) });
  });

  // Suspected defect: book() reads the room's bookings, then adds the new one in a later step, so two
  // requests made at the same moment both pass the overlap check and the room is booked twice.
  it.fails('refuses one of two simultaneous bookings of the same slot', async () => {
    const bookings = createBookings();

    const results = await Promise.allSettled([
      bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 }),
      bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 60 }),
    ]);

    expect(results.map((result) => result.status).sort()).toStrictEqual(['fulfilled', 'rejected']);
    expect(results.find((result) => result.status === 'rejected')?.reason).toBeInstanceOf(BookingError);
    expect(await bookings.list('Atlas')).toHaveLength(1);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 60 });
    await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:30'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'ada', start: at('10:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed.map((booking) => ({ room: booking.room, start: booking.start }))).toStrictEqual([
      { room: 'Atlas', start: at('09:00') },
      { room: 'Atlas', start: at('11:30') },
      { room: 'Atlas', start: at('14:00') },
    ]);
  });
});

describe('cancel', () => {
  it('frees the time of a booking its owner cancels', async () => {
    const bookings = createBookings();
    const cancelled = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const kept = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('12:00'), minutes: 60 });

    await bookings.cancel(cancelled.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([kept]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 60 });
    expect(rebooked).toMatchObject({ owner: 'bob', start: at('10:00'), end: at('11:00') });
  });

  it('refuses to cancel a booking for someone who did not make it', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const error = await settled(bookings.cancel(booking.id, 'bob'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'Only the person who made a booking can cancel it.');
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const missing = booking.id + 1;

    const error = await settled(bookings.cancel(missing, 'ada'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', `There is no booking ${missing}.`);
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });
});
