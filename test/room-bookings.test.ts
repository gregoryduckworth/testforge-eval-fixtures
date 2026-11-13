// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';
import { at } from './support/time';

/** What a call rejects with, or the value it resolved with if it wasn't refused. */
const outcome = (promise: Promise<unknown>): Promise<unknown> => promise.catch((error: unknown) => error);

describe('book', () => {
  describe('books each of the rooms Atlas, Borealis and Cosmos on the half hour', () => {
    it.each(ROOMS)('books %s', async (room) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room, owner: 'ada', start: at('09:30'), minutes: 30 });

      expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:30'), end: at('10:00') });
    });
  });

  describe('refuses a room that is not Atlas, Borealis or Cosmos', () => {
    it.each(['Zenith', 'atlas', ''])('refuses room %j', async (room) => {
      const bookings = createBookings();

      const error = await outcome(bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', `There is no room called "${room}".`);
    });
  });

  describe('refuses a booking without the name of the person making it', () => {
    it.each(['', '   '])('refuses owner %j', async (owner) => {
      const bookings = createBookings();

      const error = await outcome(bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'A booking needs the name of the person making it.');
    });
  });

  describe('refuses a start that is not on the hour or the half hour in UTC', () => {
    it.each([
      { label: '09:15Z', start: at('09:15') },
      { label: '09:00:30Z', start: new Date('2026-03-02T09:00:30Z') },
      { label: '09:00:00.001Z', start: new Date('2026-03-02T09:00:00.001Z') },
      { label: '09:00+05:45, which is 03:15Z', start: new Date('2026-03-02T09:00:00+05:45') },
      { label: 'an invalid date', start: new Date('not a date') },
    ])('refuses a start at $label', async ({ start }) => {
      const bookings = createBookings();

      const error = await outcome(bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'A booking starts on the hour or the half hour.');
    });
  });

  describe('accepts the shortest and longest lengths, 30 minutes and 4 hours', () => {
    it.each([
      { minutes: 30, end: at('09:30') },
      { minutes: 240, end: at('13:00') },
    ])('accepts $minutes minutes', async ({ minutes, end }) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes });

      expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end });
    });
  });

  describe('refuses a length outside 30 minutes to 4 hours or not in steps of 30 minutes', () => {
    it.each([0, -30, 15, 45, 270, 30.5, Number.NaN])('refuses %s minutes', async (minutes) => {
      const bookings = createBookings();

      const error = await outcome(bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.');
    });
  });
});

describe('clashes', () => {
  describe('refuses a booking that overlaps another booking of the same room', () => {
    it.each([
      { shape: 'is the same slot', start: at('10:00'), minutes: 60 },
      { shape: 'starts inside it', start: at('10:30'), minutes: 60 },
      { shape: 'ends inside it', start: at('09:30'), minutes: 60 },
      { shape: 'contains it', start: at('09:00'), minutes: 180 },
      { shape: 'lies inside it', start: at('10:00'), minutes: 30 },
    ])('refuses one that $shape', async ({ start, minutes }) => {
      const bookings = createBookings();
      const existing = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

      const error = await outcome(bookings.book({ room: 'Atlas', owner: 'bob', start, minutes }));

      expect(error).toBeInstanceOf(BookingError);
      expect(error).toHaveProperty('message', 'Atlas is already booked from 2026-03-02T10:00:00.000Z.');
      expect(await bookings.list('Atlas')).toStrictEqual([existing]);
    });
  });

  it('books different rooms for the same time', async () => {
    const bookings = createBookings();
    const atlas = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const borealis = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('10:00'), minutes: 60 });
    const cosmos = await bookings.book({ room: 'Cosmos', owner: 'cy', start: at('10:00'), minutes: 60 });

    expect(borealis).toStrictEqual({ id: 2, room: 'Borealis', owner: 'bob', start: at('10:00'), end: at('11:00') });
    expect(cosmos).toStrictEqual({ id: 3, room: 'Cosmos', owner: 'cy', start: at('10:00'), end: at('11:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([atlas]);
    expect(await bookings.list('Borealis')).toStrictEqual([borealis]);
    expect(await bookings.list('Cosmos')).toStrictEqual([cosmos]);
  });

  it('books a room starting exactly when another booking ends', async () => {
    const bookings = createBookings();
    const middle = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const after = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('11:00'), minutes: 30 });
    const before = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('09:30'), minutes: 30 });

    expect(after).toStrictEqual({ id: 2, room: 'Atlas', owner: 'bob', start: at('11:00'), end: at('11:30') });
    expect(before).toStrictEqual({ id: 3, room: 'Atlas', owner: 'cy', start: at('09:30'), end: at('10:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([before, middle, after]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 60 });
    const midday = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:30'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'dee', start: at('10:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed.map((b) => b.id)).toStrictEqual([2, 3, 1]);
    expect(listed).toStrictEqual([morning, midday, afternoon]);
  });
});

describe('cancel', () => {
  it('lets the person who made a booking cancel it and frees its time', async () => {
    const bookings = createBookings();
    const cancelled = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const kept = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('12:00'), minutes: 30 });

    await bookings.cancel(cancelled.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([kept]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 60 });
    expect(rebooked).toStrictEqual({ id: 3, room: 'Atlas', owner: 'bob', start: at('10:00'), end: at('11:00') });
  });

  it('refuses to cancel a booking for someone who did not make it', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const error = await outcome(bookings.cancel(booking.id, 'bob'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'Only the person who made a booking can cancel it.');
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const error = await outcome(bookings.cancel(99, 'ada'));

    expect(error).toBeInstanceOf(BookingError);
    expect(error).toHaveProperty('message', 'There is no booking 99.');
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });
});
