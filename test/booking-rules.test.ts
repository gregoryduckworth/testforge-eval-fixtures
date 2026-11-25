// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13, TC14
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';
import { at } from './time';

/**
 * Awaits an action that must be refused with a BookingError carrying exactly this message.
 * Soft assertions labelled with the input, so a test looping over inputs reports every one that fails.
 */
async function expectRefusal(action: Promise<unknown>, message: string, input: string): Promise<void> {
  const error: unknown = await action.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  const label = `refusal of ${input}`;
  expect.soft(error, label).toBeInstanceOf(BookingError);
  expect.soft(error, label).toHaveProperty('message', message);
}

describe('book', () => {
  it('books each of the rooms Atlas, Borealis and Cosmos', async () => {
    const bookings = createBookings();

    const booked = [];
    for (const room of ['Atlas', 'Borealis', 'Cosmos']) {
      booked.push(await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }));
    }

    expect(booked).toStrictEqual([
      { id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { id: 2, room: 'Borealis', owner: 'ada', start: at('09:00'), end: at('10:00') },
      { id: 3, room: 'Cosmos', owner: 'ada', start: at('09:00'), end: at('10:00') },
    ]);
    expect(ROOMS).toStrictEqual(['Atlas', 'Borealis', 'Cosmos']);
  });

  it('rejects a room that is not Atlas, Borealis or Cosmos', async () => {
    const bookings = createBookings();

    for (const room of ['Zenith', 'atlas', '']) {
      await expectRefusal(
        bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }),
        `There is no room called "${room}".`,
        `room ${JSON.stringify(room)}`,
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
        `owner ${JSON.stringify(owner)}`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('accepts starts on the hour and the half hour in UTC', async () => {
    const bookings = createBookings();

    const onTheHour = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 30 });
    const onTheHalfHour = await bookings.book({ room: 'Borealis', owner: 'ada', start: at('09:30'), minutes: 30 });

    expect(onTheHour).toMatchObject({ room: 'Atlas', start: at('09:00'), end: at('09:30') });
    expect(onTheHalfHour).toMatchObject({ room: 'Borealis', start: at('09:30'), end: at('10:00') });
  });

  it('rejects a start that is not on the hour or the half hour', async () => {
    const bookings = createBookings();

    for (const start of [at('09:15'), at('09:00:30.000'), at('09:30:00.001'), new Date('not a date')]) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }),
        'A booking starts on the hour or the half hour.',
        `start ${Number.isNaN(start.getTime()) ? 'Invalid Date' : start.toISOString()}`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('accepts lengths from 30 minutes to 4 hours in steps of 30 minutes', async () => {
    const bookings = createBookings();

    const shortest = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 30 });
    const middle = await bookings.book({ room: 'Borealis', owner: 'ada', start: at('09:00'), minutes: 90 });
    const longest = await bookings.book({ room: 'Cosmos', owner: 'ada', start: at('09:00'), minutes: 240 });

    expect(shortest.end).toStrictEqual(at('09:30'));
    expect(middle.end).toStrictEqual(at('10:30'));
    expect(longest.end).toStrictEqual(at('13:00'));
  });

  it('rejects lengths outside 30 minutes to 4 hours or off the 30-minute step', async () => {
    const bookings = createBookings();

    for (const minutes of [0, -30, 29, 45, 270, 30.5]) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }),
        'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
        `${minutes} minutes`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });
});

describe('clashes', () => {
  it('rejects a booking that overlaps another booking of the same room', async () => {
    const bookings = createBookings();
    const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const overlapping = [
      { start: at('10:00'), minutes: 60 }, // the same slot
      { start: at('09:30'), minutes: 60 }, // runs into its start
      { start: at('10:30'), minutes: 60 }, // starts before it ends
      { start: at('09:00'), minutes: 180 }, // encloses it
    ];
    for (const { start, minutes } of overlapping) {
      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'grace', start, minutes }),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
        `Atlas from ${start.toISOString()} for ${minutes} minutes`,
      );
    }
    expect(await bookings.list('Atlas')).toStrictEqual([first]);
  });

  it('books different rooms at the same time', async () => {
    const bookings = createBookings();
    const atlas = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const borealis = await bookings.book({ room: 'Borealis', owner: 'grace', start: at('10:00'), minutes: 60 });

    expect(borealis).toStrictEqual({ id: 2, room: 'Borealis', owner: 'grace', start: at('10:00'), end: at('11:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([atlas]);
    expect(await bookings.list('Borealis')).toStrictEqual([borealis]);
  });

  it('books a room starting exactly when another booking ends', async () => {
    const bookings = createBookings();
    const middle = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const after = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('11:00'), minutes: 30 });
    const before = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:30'), minutes: 30 });

    expect(after).toMatchObject({ start: at('11:00'), end: at('11:30') });
    expect(before).toMatchObject({ start: at('09:30'), end: at('10:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([before, middle, after]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:00'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'ada', start: at('10:00'), minutes: 60 });
    const midday = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('11:30'), minutes: 30 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, midday, afternoon]);
  });
});

describe('cancel', () => {
  it('refuses a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(
      bookings.cancel(booking.id, 'grace'),
      'Only the person who made a booking can cancel it.',
      'cancel by grace',
    );

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('cancels a booking by its owner and frees its time', async () => {
    const bookings = createBookings();
    const cancelled = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const kept = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('12:00'), minutes: 60 });

    await bookings.cancel(cancelled.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([kept]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('10:00'), minutes: 60 });
    expect(rebooked).toMatchObject({ room: 'Atlas', owner: 'grace', start: at('10:00'), end: at('11:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([rebooked, kept]);
  });

  it('rejects cancelling a booking that does not exist', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const missingId = booking.id + 98;

    await expectRefusal(bookings.cancel(missingId, 'ada'), `There is no booking ${missingId}.`, `cancel of ${missingId}`);

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });
});
