// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings, type Booking } from '../src/bookings';
import { at } from './support/time';

/**
 * Asserts that the action was refused with a BookingError carrying exactly this message. The checks are soft and
 * labelled with the input, so a test that tries several inputs reports each one that isn't refused.
 */
async function expectRefusal(action: Promise<unknown>, message: string, input: string): Promise<void> {
  await expect.soft(action, input).rejects.toBeInstanceOf(BookingError);
  await expect.soft(action, input).rejects.toHaveProperty('message', message);
}

const LENGTH_MESSAGE = 'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.';
const START_MESSAGE = 'A booking starts on the hour or the half hour.';

describe('book: what a booking must name, when it starts and how long it lasts', () => {
  it('books each of the rooms Atlas, Borealis and Cosmos', async () => {
    const bookings = createBookings();

    const made: Booking[] = [];
    for (const room of ROOMS) {
      made.push(await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));
    }

    expect(made).toStrictEqual([
      { id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { id: 2, room: 'Borealis', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { id: 3, room: 'Cosmos', owner: 'ada', start: at('09:00'), end: at('10:00') },
    ]);
  });

  it('accepts lengths from 30 minutes to 4 hours in steps of 30 minutes', async () => {
    const bookings = createBookings();

    const shortest = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:30'), minutes: 30 });
    const middle = await bookings.book({ room: 'Borealis', owner: 'ada', start: at('09:30'), minutes: 90 });
    const longest = await bookings.book({ room: 'Cosmos', owner: 'ada', start: at('09:30'), minutes: 240 });

    expect(shortest.end).toStrictEqual(at('10:00'));
    expect(middle.end).toStrictEqual(at('11:00'));
    expect(longest.end).toStrictEqual(at('13:30'));
  });

  it('rejects a room that is not Atlas, Borealis or Cosmos', async () => {
    const bookings = createBookings();

    for (const room of ['Zenith', 'atlas', '']) {
      await expectRefusal(
        bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }),
        `There is no room called "${room}".`,
        `room "${room}"`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('rejects a booking without the name of the person making it', async () => {
    const bookings = createBookings();
    const message = 'A booking needs the name of the person making it.';

    for (const owner of ['', '   ']) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }),
        message,
        `owner "${owner}"`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('rejects a start that is not on the hour or the half hour in UTC', async () => {
    const bookings = createBookings();
    const starts = [
      at('09:15'),
      new Date('2026-03-02T09:00:30Z'),
      // On the hour in UTC+05:45, but 03:15 in UTC.
      new Date('2026-03-02T09:00:00+05:45'),
      new Date('not a date'),
    ];

    for (const [row, start] of starts.entries()) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }),
        START_MESSAGE,
        `start #${row} (${String(start.getTime())} ms)`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('rejects lengths outside 30 minutes to 4 hours or not in steps of 30 minutes', async () => {
    const bookings = createBookings();

    for (const minutes of [0, -30, 29, 45, 30.5, 270]) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }),
        LENGTH_MESSAGE,
        `${minutes} minutes`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });
});

describe('book: clashes', () => {
  it('rejects a booking that overlaps another booking of the same room', async () => {
    const bookings = createBookings();
    const original = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });
    const overlapping = [
      { start: at('09:30'), minutes: 60 }, // overlaps its start
      { start: at('11:30'), minutes: 60 }, // overlaps its end
      { start: at('10:30'), minutes: 30 }, // inside it
      { start: at('10:00'), minutes: 120 }, // the same time
      { start: at('09:00'), minutes: 240 }, // around it
    ];

    for (const { start, minutes } of overlapping) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'grace', start, minutes }),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
        `${start.toISOString()} for ${minutes} minutes`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([original]);
  });

  it('books different rooms at the same time without a clash', async () => {
    const bookings = createBookings();

    const atlas = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const borealis = await bookings.book({ room: 'Borealis', owner: 'grace', start: at('10:00'), minutes: 60 });
    const cosmos = await bookings.book({ room: 'Cosmos', owner: 'alan', start: at('10:00'), minutes: 60 });

    expect(await bookings.list('Atlas')).toStrictEqual([atlas]);
    expect(await bookings.list('Borealis')).toStrictEqual([borealis]);
    expect(await bookings.list('Cosmos')).toStrictEqual([cosmos]);
  });

  it('books a room starting exactly when another booking ends', async () => {
    const bookings = createBookings();
    const middle = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const after = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('11:00'), minutes: 60 });
    const before = await bookings.book({ room: 'Atlas', owner: 'alan', start: at('09:00'), minutes: 60 });

    expect(after).toStrictEqual({ id: 2, room: 'Atlas', owner: 'grace', start: at('11:00'), end: at('12:00') });
    expect(before).toStrictEqual({ id: 3, room: 'Atlas', owner: 'alan', start: at('09:00'), end: at('10:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([before, middle, after]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:00'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'alan', start: at('10:00'), minutes: 60 });
    const late = await bookings.book({ room: 'Atlas', owner: 'alan', start: at('11:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, late, afternoon]);
  });
});

describe('cancel', () => {
  it('rejects a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(
      bookings.cancel(booking.id, 'grace'),
      'Only the person who made a booking can cancel it.',
      'cancel by grace',
    );

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('cancelling a booking frees its time for another booking', async () => {
    const bookings = createBookings();
    const kept = await bookings.book({ room: 'Atlas', owner: 'alan', start: at('12:00'), minutes: 60 });
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await bookings.cancel(booking.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([kept]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('10:00'), minutes: 60 });
    expect(rebooked).toStrictEqual({ id: 3, room: 'Atlas', owner: 'grace', start: at('10:00'), end: at('11:00') });
  });

  it('rejects cancelling a booking that does not exist', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(bookings.cancel(42, 'ada'), 'There is no booking 42.', 'cancel of booking 42');

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });
});
