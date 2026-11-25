// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';

/** A time on 2 March 2026, in UTC. */
const at = (time: string) => new Date(`2026-03-02T${time}:00Z`);

/** Asserts that the attempt is refused with a BookingError carrying exactly this message. */
async function expectRefusal(attempt: Promise<unknown>, message: string): Promise<void> {
  await expect(attempt).rejects.toThrow(BookingError);
  await expect(attempt).rejects.toHaveProperty('message', message);
}

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

  it('books each of the rooms Atlas, Borealis and Cosmos', async () => {
    const bookings = createBookings();

    const booked = [];
    for (const room of ROOMS) {
      booked.push(await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));
    }

    expect(booked).toStrictEqual([
      { id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { id: 2, room: 'Borealis', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { id: 3, room: 'Cosmos', owner: 'ada', start: at('09:00'), end: at('10:00') },
    ]);
  });

  it('accepts a half-hour start and lengths of 30 minutes and 4 hours', async () => {
    const bookings = createBookings();

    const shortest = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:30'), minutes: 30 });
    const longest = await bookings.book({ room: 'Borealis', owner: 'ada', start: at('10:00'), minutes: 240 });

    expect(shortest).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:30'), end: at('10:00') });
    expect(longest).toStrictEqual({ id: 2, room: 'Borealis', owner: 'ada', start: at('10:00'), end: at('14:00') });
  });

  it('rejects a room that is not Atlas, Borealis or Cosmos', async () => {
    const bookings = createBookings();

    for (const room of ['Zenith', 'atlas', '']) {
      await expectRefusal(
        bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }),
        `There is no room called "${room}".`,
      );
    }
  });

  it('rejects a booking without the name of the person making it', async () => {
    const bookings = createBookings();

    for (const owner of ['', '   ']) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }),
        'A booking needs the name of the person making it.',
      );
    }
  });

  it('rejects a start that is not on the hour or the half hour', async () => {
    const bookings = createBookings();
    const starts = [
      at('09:15'),
      new Date('2026-03-02T09:00:01Z'),
      new Date('2026-03-02T09:29:59.999Z'),
      new Date('not a date'),
    ];

    for (const start of starts) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }),
        'A booking starts on the hour or the half hour.',
      );
    }
  });

  it('rejects a length that is not 30 minutes to 4 hours in steps of 30 minutes', async () => {
    const bookings = createBookings();

    for (const minutes of [0, -30, 15, 45, 270, 30.5, Number.NaN]) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }),
        'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
      );
    }
  });

  it('rejects a booking that overlaps another booking of the same room', async () => {
    const bookings = createBookings();
    const existing = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });
    const overlapping = [
      { start: at('09:30'), minutes: 60 }, // runs into its start
      { start: at('11:00'), minutes: 30 }, // inside it
      { start: at('09:00'), minutes: 240 }, // around it
      { start: at('11:30'), minutes: 60 }, // runs over its end
    ];

    for (const { start, minutes } of overlapping) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'grace', start, minutes }),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
      );
    }

    expect(await bookings.list('Atlas')).toStrictEqual([existing]);
  });

  it('books different rooms at the same time', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const borealis = await bookings.book({ room: 'Borealis', owner: 'grace', start: at('10:00'), minutes: 60 });
    const cosmos = await bookings.book({ room: 'Cosmos', owner: 'linus', start: at('10:00'), minutes: 60 });

    expect(borealis).toStrictEqual({ id: 2, room: 'Borealis', owner: 'grace', start: at('10:00'), end: at('11:00') });
    expect(cosmos).toStrictEqual({ id: 3, room: 'Cosmos', owner: 'linus', start: at('10:00'), end: at('11:00') });
  });

  it('books a room starting exactly when another booking ends', async () => {
    const bookings = createBookings();
    const middle = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const after = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('11:00'), minutes: 60 });
    const before = await bookings.book({ room: 'Atlas', owner: 'linus', start: at('09:00'), minutes: 60 });

    expect(await bookings.list('Atlas')).toStrictEqual([before, middle, after]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:00'), minutes: 60 });
    const midday = await bookings.book({ room: 'Atlas', owner: 'linus', start: at('11:30'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'ada', start: at('08:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, midday, afternoon]);
  });
});

describe('cancel', () => {
  it('lets the person who made a booking cancel it, freeing its time', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await bookings.cancel(booking.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('10:00'), minutes: 60 });
    expect(rebooked).toStrictEqual({ id: 2, room: 'Atlas', owner: 'grace', start: at('10:00'), end: at('11:00') });
  });

  it('rejects a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(bookings.cancel(booking.id, 'grace'), 'Only the person who made a booking can cancel it.');

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('rejects cancelling a booking that does not exist', async () => {
    const bookings = createBookings();

    await expectRefusal(bookings.cancel(42, 'ada'), 'There is no booking 42.');
  });
});
