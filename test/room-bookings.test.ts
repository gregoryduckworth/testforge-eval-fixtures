// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13, TC14, TC15
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';
import { memoryStore } from '../src/store';

/** A time on 2 March 2026, in UTC. */
const at = (time: string) => new Date(`2026-03-02T${time}:00Z`);

const LENGTH_REFUSAL = 'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.';

describe('book', () => {
  it("books each of the office's rooms", async () => {
    const bookings = createBookings(memoryStore());

    const booked = [];
    for (const room of ROOMS) {
      booked.push(await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));
    }

    expect(booked.map(({ room, owner, start, end }) => ({ room, owner, start, end }))).toStrictEqual([
      { room: 'Atlas', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { room: 'Borealis', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { room: 'Cosmos', owner: 'ada', start: at('09:00'), end: at('10:00') },
    ]);
  });

  it("refuses a room that is not one of the office's rooms", async () => {
    const bookings = createBookings(memoryStore());

    const attempt = bookings.book({ room: 'Zenith', owner: 'ada', start: at('09:00'), minutes: 60 });

    await expect(attempt).rejects.toStrictEqual(new BookingError('There is no room called "Zenith".'));
  });

  it('refuses a booking without the name of the person making it', async () => {
    const bookings = createBookings(memoryStore());

    const attempt = bookings.book({ room: 'Atlas', owner: '   ', start: at('09:00'), minutes: 60 });

    await expect(attempt).rejects.toStrictEqual(new BookingError('A booking needs the name of the person making it.'));
  });

  it('refuses a booking that does not start on the hour or the half hour', async () => {
    const bookings = createBookings(memoryStore());

    const attempt = bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:15'), minutes: 60 });

    await expect(attempt).rejects.toStrictEqual(new BookingError('A booking starts on the hour or the half hour.'));
  });

  it('books a half-hour start for the shortest length of 30 minutes', async () => {
    const bookings = createBookings(memoryStore());

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:30'), minutes: 30 });

    expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:30'), end: at('10:00') });
  });

  it('books the longest length of 4 hours', async () => {
    const bookings = createBookings(memoryStore());

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 240 });

    expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end: at('13:00') });
  });

  it('refuses a booking longer than 4 hours', async () => {
    const bookings = createBookings(memoryStore());

    const attempt = bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 270 });

    await expect(attempt).rejects.toStrictEqual(new BookingError(LENGTH_REFUSAL));
  });

  it('refuses a booking with no length', async () => {
    const bookings = createBookings(memoryStore());

    const attempt = bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 0 });

    await expect(attempt).rejects.toStrictEqual(new BookingError(LENGTH_REFUSAL));
  });

  it('refuses a length that is not a whole number of half hours', async () => {
    const bookings = createBookings(memoryStore());

    const attempt = bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 45 });

    await expect(attempt).rejects.toStrictEqual(new BookingError(LENGTH_REFUSAL));
  });
});

describe('clashes', () => {
  it('refuses a booking that overlaps another booking of the same room', async () => {
    const bookings = createBookings(memoryStore());
    const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });

    const attempt = bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:30'), minutes: 60 });

    await expect(attempt).rejects.toStrictEqual(
      new BookingError('Atlas is already booked from 2026-03-02T09:00:00.000Z.'),
    );
    expect(await bookings.list('Atlas')).toStrictEqual([first]);
  });

  it('books a room from the moment its previous booking ends', async () => {
    const bookings = createBookings(memoryStore());
    const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });

    const next = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 30 });

    expect(await bookings.list('Atlas')).toStrictEqual([
      first,
      { id: next.id, room: 'Atlas', owner: 'bob', start: at('10:00'), end: at('10:30') },
    ]);
  });

  it('books the same time in a different room', async () => {
    const bookings = createBookings(memoryStore());
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });

    const booking = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('09:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 2, room: 'Borealis', owner: 'bob', start: at('09:00'), end: at('10:00') });
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings(memoryStore());
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 30 });
    await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 30 });
    await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:30'), minutes: 30 });
    await bookings.book({ room: 'Cosmos', owner: 'dee', start: at('10:00'), minutes: 30 });

    const listed = await bookings.list('Atlas');

    expect(listed.map(({ owner, start }) => ({ owner, start }))).toStrictEqual([
      { owner: 'bob', start: at('09:00') },
      { owner: 'cy', start: at('11:30') },
      { owner: 'ada', start: at('14:00') },
    ]);
  });
});

describe('cancel', () => {
  it('refuses to cancel a booking for someone other than the person who made it', async () => {
    const bookings = createBookings(memoryStore());
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });

    const attempt = bookings.cancel(booking.id, 'bob');

    await expect(attempt).rejects.toStrictEqual(new BookingError('Only the person who made a booking can cancel it.'));
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('cancelling a booking frees its time for a new booking', async () => {
    const bookings = createBookings(memoryStore());
    const cancelled = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });

    await bookings.cancel(cancelled.id, 'ada');
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 60 });

    expect(await bookings.list('Atlas')).toStrictEqual([rebooked]);
    expect(rebooked).toStrictEqual({ id: 2, room: 'Atlas', owner: 'bob', start: at('09:00'), end: at('10:00') });
  });
});
