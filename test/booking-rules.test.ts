// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings, type Booking } from '../src/bookings';
import { at } from './support/time';

/** Asserts that the promise rejects with a BookingError whose message is exactly `message`. */
async function expectRefusal(promise: Promise<unknown>, message: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(BookingError);
  await expect(promise).rejects.toThrow(new BookingError(message));
}

const startsOf = (bookings: Booking[]) => bookings.map((b) => b.start.toISOString());

describe('book', () => {
  it('books each room at the shortest and longest allowed lengths', async () => {
    for (const room of ROOMS) {
      const bookings = createBookings();

      const shortest = await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 30 });
      const longest = await bookings.book({ room, owner: 'ada', start: at('10:30'), minutes: 240 });

      expect(shortest).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00'), end: at('09:30') });
      expect(longest).toStrictEqual({ id: 2, room, owner: 'ada', start: at('10:30'), end: at('14:30') });
    }
  });

  it('rejects a room that is not Atlas, Borealis or Cosmos', async () => {
    const bookings = createBookings();

    for (const room of ['atlas', 'Zenith', '']) {
      await expectRefusal(
        bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }),
        `There is no room called "${room}".`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('rejects a booking without the name of the person making it', async () => {
    const bookings = createBookings();

    for (const owner of ['', '   ']) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }),
        'A booking needs the name of the person making it.',
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('rejects a start that is not on the hour or the half hour in UTC', async () => {
    const bookings = createBookings();
    const starts = [
      at('09:15'),
      new Date('2026-03-02T09:00:30Z'),
      new Date('2026-03-02T09:00:00.001Z'),
      // 09:00 at UTC+05:45 is 03:15 UTC.
      new Date('2026-03-02T09:00:00+05:45'),
      new Date('not a date'),
    ];

    for (const start of starts) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }),
        'A booking starts on the hour or the half hour.',
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('rejects a length outside 30 minutes to 4 hours or not in steps of 30 minutes', async () => {
    const bookings = createBookings();

    for (const minutes of [0, -30, 15, 45, 30.5, 270]) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }),
        'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });
});

describe('clashes', () => {
  it('rejects a booking that overlaps another booking of the same room', async () => {
    const bookings = createBookings();
    const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });
    const overlapping = [
      { start: at('10:00'), minutes: 120 }, // the same time
      { start: at('10:30'), minutes: 60 }, // inside it
      { start: at('09:00'), minutes: 240 }, // around it
      { start: at('09:30'), minutes: 60 }, // over its start
      { start: at('11:30'), minutes: 60 }, // over its end
    ];

    for (const { start, minutes } of overlapping) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'grace', start, minutes }),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([first]);
  });

  it('allows back-to-back bookings and the same time in another room', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const after = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('12:00'), minutes: 30 });
    const before = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:30'), minutes: 30 });
    const otherRoom = await bookings.book({ room: 'Borealis', owner: 'grace', start: at('10:00'), minutes: 120 });

    expect(after).toMatchObject({ room: 'Atlas', start: at('12:00'), end: at('12:30') });
    expect(before).toMatchObject({ room: 'Atlas', start: at('09:30'), end: at('10:00') });
    expect(otherRoom).toMatchObject({ room: 'Borealis', start: at('10:00'), end: at('12:00') });
    expect(startsOf(await bookings.list('Atlas'))).toStrictEqual([
      '2026-03-02T09:30:00.000Z',
      '2026-03-02T10:00:00.000Z',
      '2026-03-02T12:00:00.000Z',
    ]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    const late = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('11:00'), minutes: 60 });
    await bookings.book({ room: 'Cosmos', owner: 'ada', start: at('10:00'), minutes: 60 });

    expect(await bookings.list('Atlas')).toStrictEqual([morning, late, afternoon]);
  });
});

describe('cancel', () => {
  it('refuses a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(bookings.cancel(booking.id, 'grace'), 'Only the person who made a booking can cancel it.');

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('cancelling a booking frees its time for a new booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const other = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('11:00'), minutes: 30 });

    await bookings.cancel(booking.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([other]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('10:00'), minutes: 60 });
    expect(rebooked).toMatchObject({ room: 'Atlas', owner: 'grace', start: at('10:00'), end: at('11:00') });
  });

  it('rejects cancelling a booking that does not exist', async () => {
    const bookings = createBookings();

    await expectRefusal(bookings.cancel(99, 'ada'), 'There is no booking 99.');
  });
});
