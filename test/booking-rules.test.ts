// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13, TC14
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';
import { at } from './support/time';

/** What a refused call rejected with, or what it resolved to if it wasn't refused. */
const outcome = (promise: Promise<unknown>): Promise<unknown> => promise.catch((error: unknown) => error);

describe('book', () => {
  it.each(ROOMS)("books each of the office's rooms: %s", async (room) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00'), end: at('10:00') });
  });

  it.each(['Zenith', 'atlas', ''])('refuses a booking of a room called %j', async (room) => {
    const bookings = createBookings();

    const error = await outcome(bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', `There is no room called "${room}".`);
  });

  it.each(['', '   '])('refuses a booking without the name of the person making it: %j', async (owner) => {
    const bookings = createBookings();

    const error = await outcome(bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'A booking needs the name of the person making it.');
  });

  it('books a slot that starts on the half hour', async () => {
    const bookings = createBookings();

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:30'), minutes: 30 });

    expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:30'), end: at('10:00') });
  });

  it.each([
    { label: 'a quarter past the hour', start: at('09:15') },
    { label: 'thirty seconds past the hour', start: at('09:00:30') },
    { label: 'an invalid date', start: new Date('not a date') },
  ])('refuses a booking that starts at $label', async ({ start }) => {
    const bookings = createBookings();

    const error = await outcome(bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'A booking starts on the hour or the half hour.');
  });

  it.each([
    { minutes: 30, end: at('09:30') },
    { minutes: 90, end: at('10:30') },
    { minutes: 240, end: at('13:00') },
  ])('books a slot of $minutes minutes', async ({ minutes, end }) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes });

    expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end });
  });

  it.each([{ minutes: 0 }, { minutes: -30 }, { minutes: 45 }, { minutes: 270 }, { minutes: 30.5 }])(
    'refuses a booking of $minutes minutes',
    async ({ minutes }) => {
      const bookings = createBookings();

      const error = await outcome(bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.');
    },
  );
});

describe('clashes', () => {
  it.each([
    { shape: 'is the same slot', start: '10:00', minutes: 120 },
    { shape: 'starts before it and ends inside it', start: '09:00', minutes: 90 },
    { shape: 'starts inside it and ends after it', start: '11:30', minutes: 60 },
    { shape: 'contains it', start: '09:00', minutes: 240 },
    { shape: 'lies inside it', start: '10:30', minutes: 30 },
  ])('refuses a booking of the same room that $shape', async ({ start, minutes }) => {
    const bookings = createBookings();
    const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const error = await outcome(bookings.book({ room: 'Atlas', owner: 'bob', start: at(start), minutes }));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'Atlas is already booked from 2026-03-02T10:00:00.000Z.');
    expect(await bookings.list('Atlas')).toStrictEqual([first]);
  });

  it('books the same slot in a different room', async () => {
    const bookings = createBookings();
    const atlas = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const borealis = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('10:00'), minutes: 120 });

    expect(borealis).toStrictEqual({ id: 2, room: 'Borealis', owner: 'bob', start: at('10:00'), end: at('12:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([atlas]);
    expect(await bookings.list('Borealis')).toStrictEqual([borealis]);
  });

  it.each([
    { shape: 'starts exactly when another ends', start: '12:00', end: '13:00' },
    { shape: 'ends exactly when another starts', start: '09:00', end: '10:00' },
  ])('books a slot that $shape', async ({ start, end }) => {
    const bookings = createBookings();
    const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const second = await bookings.book({ room: 'Atlas', owner: 'bob', start: at(start), minutes: 60 });

    expect(second).toStrictEqual({ id: 2, room: 'Atlas', owner: 'bob', start: at(start), end: at(end) });
    const listed = await bookings.list('Atlas');
    expect(listed).toHaveLength(2);
    expect(listed).toContainEqual(first);
    expect(listed).toContainEqual(second);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 60 });
    const late = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:00'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'dee', start: at('10:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, late, afternoon]);
  });
});

describe('cancel', () => {
  it('refuses a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const error = await outcome(bookings.cancel(booking.id, 'bob'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'Only the person who made a booking can cancel it.');
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('cancels a booking for the person who made it and frees its time', async () => {
    const bookings = createBookings();
    const cancelled = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const kept = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('12:00'), minutes: 60 });

    await bookings.cancel(cancelled.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([kept]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 60 });
    expect(rebooked).toMatchObject({ room: 'Atlas', owner: 'bob', start: at('10:00'), end: at('11:00') });
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();

    const error = await outcome(bookings.cancel(99, 'ada'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'There is no booking 99.');
  });
});
