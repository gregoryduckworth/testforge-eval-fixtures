// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13, TC14
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';

/** A time on 2 March 2026, in UTC. */
const at = (time: string) => new Date(`2026-03-02T${time}Z`);

describe('book', () => {
  it.each(ROOMS)('books each of the rooms Atlas, Borealis and Cosmos', async (room) => {
    const bookings = createBookings();
    const booking = await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });
    expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00'), end: at('10:00') });
  });

  it('refuses a room that is not Atlas, Borealis or Cosmos, naming it', async () => {
    const result = createBookings().book({ room: 'atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    await expect(result).rejects.toThrow(BookingError);
    await expect(result).rejects.toThrow('There is no room called "atlas".');
  });

  it.each(['', '   '])('refuses a booking without the name of the person making it', async (owner) => {
    const result = createBookings().book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 });
    await expect(result).rejects.toThrow(BookingError);
    await expect(result).rejects.toThrow('A booking needs the name of the person making it.');
  });

  it.each([at('09:15'), at('09:00:30'), new Date('not a date')])(
    'refuses a start that is not on the hour or the half hour',
    async (start) => {
      const result = createBookings().book({ room: 'Atlas', owner: 'ada', start, minutes: 60 });
      await expect(result).rejects.toThrow(BookingError);
      await expect(result).rejects.toThrow('A booking starts on the hour or the half hour.');
    },
  );

  it('accepts bookings of 30 minutes and of 4 hours starting on the half hour', async () => {
    const bookings = createBookings();
    const short = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:30'), minutes: 30 });
    const long = await bookings.book({ room: 'Borealis', owner: 'ada', start: at('09:30'), minutes: 240 });
    expect(short.end).toStrictEqual(at('10:00'));
    expect(long.end).toStrictEqual(at('13:30'));
  });

  it.each([0, 270, 45, 30.5])('refuses lengths outside 30 minutes to 4 hours or not in steps of 30', async (minutes) => {
    const result = createBookings().book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes });
    await expect(result).rejects.toThrow(BookingError);
    await expect(result).rejects.toThrow('A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.');
  });
});

describe('clashes', () => {
  it('refuses a booking that overlaps another of the same room', async () => {
    const bookings = createBookings();
    const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    const result = bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:30'), minutes: 60 });
    await expect(result).rejects.toThrow(BookingError);
    await expect(result).rejects.toThrow('Atlas is already booked from 2026-03-02T09:00:00.000Z.');
    expect(await bookings.list('Atlas')).toStrictEqual([first]);
  });

  it('books different rooms for the same time', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    const booking = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('09:00'), minutes: 60 });
    expect(booking).toStrictEqual({ id: 2, room: 'Borealis', owner: 'bob', start: at('09:00'), end: at('10:00') });
  });

  it('books a room starting exactly when its previous booking ends', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    const booking = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 30 });
    expect(booking).toStrictEqual({ id: 2, room: 'Atlas', owner: 'bob', start: at('10:00'), end: at('10:30') });
  });

  // Suspected defect: book() checks for a clash and adds the booking across an await, so two
  // overlapping requests made at the same time both pass the check and both are stored.
  it.fails('accepts only one of two overlapping bookings made at the same time', async () => {
    const bookings = createBookings();
    const results = await Promise.allSettled([
      bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 }),
      bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:30'), minutes: 60 }),
    ]);
    expect(results.map((r) => r.status)).toStrictEqual(['fulfilled', 'rejected']);
    expect(await bookings.list('Atlas')).toHaveLength(1);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 30 });
    await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 30 });
    await bookings.book({ room: 'Cosmos', owner: 'cy', start: at('10:00'), minutes: 30 });
    await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:00'), minutes: 30 });
    const listed = await bookings.list('Atlas');
    expect(listed.map((b) => [b.room, b.start])).toStrictEqual([
      ['Atlas', at('09:00')],
      ['Atlas', at('11:00')],
      ['Atlas', at('14:00')],
    ]);
  });
});

describe('cancel', () => {
  it('the person who made a booking cancels it and frees its time', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    await bookings.cancel(booking.id, 'ada');
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 60 });
    expect(await bookings.list('Atlas')).toStrictEqual([rebooked]);
  });

  it('refuses a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    const result = bookings.cancel(booking.id, 'bob');
    await expect(result).rejects.toThrow(BookingError);
    await expect(result).rejects.toThrow('Only the person who made a booking can cancel it.');
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const result = createBookings().cancel(99, 'ada');
    await expect(result).rejects.toThrow(BookingError);
    await expect(result).rejects.toThrow('There is no booking 99.');
  });
});
