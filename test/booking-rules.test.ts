// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';
import { at } from './support/time';

/** What a call rejected with, or undefined when it succeeded. */
const refusal = (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => undefined,
    (error: unknown) => error,
  );

describe('book', () => {
  it.each(ROOMS)("books each of the office's rooms: %s", async (room) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00'), end: at('10:00') });
  });

  it.each(['Zenith', 'atlas', ''])("refuses a room that is not one of the office's rooms: %j", async (room) => {
    const bookings = createBookings();

    const error = await refusal(bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', `There is no room called "${room}".`);
  });

  it.each(['', '   '])('refuses a booking without the name of the person making it: %j', async (owner) => {
    const bookings = createBookings();

    const error = await refusal(bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'A booking needs the name of the person making it.');
  });

  it.each([
    { start: '09:30', minutes: 30, end: '10:00' },
    { start: '09:00', minutes: 240, end: '13:00' },
  ])(
    'accepts a half-hour start and the shortest and longest lengths: $start for $minutes minutes',
    async ({ start, minutes, end }) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at(start), minutes });

      expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at(start), end: at(end) });
    },
  );

  it.each([
    { label: '09:15Z', start: new Date('2026-03-02T09:15:00Z') },
    { label: '09:00:30Z', start: new Date('2026-03-02T09:00:30Z') },
    { label: '09:00+05:45, which is 03:15Z', start: new Date('2026-03-02T09:00:00+05:45') },
    { label: 'an invalid date', start: new Date('not a date') },
  ])('refuses a start that is not on the hour or half hour in UTC: $label', async ({ start }) => {
    const bookings = createBookings();

    const error = await refusal(bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'A booking starts on the hour or the half hour.');
  });

  it.each([0, 15, 45, 60.5, 270, -30])(
    'refuses a length outside 30 minutes to 4 hours or not in 30-minute steps: %d minutes',
    async (minutes) => {
      const bookings = createBookings();

      const error = await refusal(bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.');
    },
  );
});

describe('clashes', () => {
  it.each([
    { start: '09:30', minutes: 60 },
    { start: '10:30', minutes: 60 },
    { start: '10:00', minutes: 60 },
    { start: '09:30', minutes: 120 },
    { start: '10:00', minutes: 30 },
  ])(
    'refuses a booking that overlaps another booking of the same room: $start for $minutes minutes',
    async ({ start, minutes }) => {
      const bookings = createBookings();
      await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

      const error = await refusal(bookings.book({ room: 'Atlas', owner: 'grace', start: at(start), minutes }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'Atlas is already booked from 2026-03-02T10:00:00.000Z.');
    },
  );

  it('allows a booking that starts exactly when another ends', async () => {
    const bookings = createBookings();
    const existing = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const after = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('11:00'), minutes: 30 });
    const before = await bookings.book({ room: 'Atlas', owner: 'linus', start: at('09:00'), minutes: 60 });

    expect(after).toStrictEqual({ id: 2, room: 'Atlas', owner: 'grace', start: at('11:00'), end: at('11:30') });
    expect(before).toStrictEqual({ id: 3, room: 'Atlas', owner: 'linus', start: at('09:00'), end: at('10:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([before, existing, after]);
  });

  it('allows the same time in a different room', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const booking = await bookings.book({ room: 'Borealis', owner: 'grace', start: at('10:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 2, room: 'Borealis', owner: 'grace', start: at('10:00'), end: at('11:00') });
    expect(await bookings.list('Borealis')).toStrictEqual([booking]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:00'), minutes: 60 });
    const midday = await bookings.book({ room: 'Atlas', owner: 'linus', start: at('11:30'), minutes: 60 });
    await bookings.book({ room: 'Cosmos', owner: 'ada', start: at('08:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, midday, afternoon]);
  });
});

describe('cancel', () => {
  it('cancelling a booking frees its time', async () => {
    const bookings = createBookings();
    const cancelled = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const kept = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('12:00'), minutes: 60 });

    await bookings.cancel(cancelled.id, 'ada');
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('10:00'), minutes: 60 });

    expect(rebooked).toStrictEqual({ id: 3, room: 'Atlas', owner: 'grace', start: at('10:00'), end: at('11:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([rebooked, kept]);
  });

  it('refuses a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const error = await refusal(bookings.cancel(booking.id, 'grace'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'Only the person who made a booking can cancel it.');
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();

    const error = await refusal(bookings.cancel(99, 'ada'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'There is no booking 99.');
  });
});
