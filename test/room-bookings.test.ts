// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13, TC14
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings, type Booking } from '../src/bookings';
import { at } from './support/time';

/** Waits for a call that must be refused and checks it was refused with a BookingError saying `message`. */
async function expectRefusal(call: Promise<unknown>, message: string): Promise<void> {
  const error: unknown = await call.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(BookingError);
  expect(error).toHaveProperty('message', message);
}

/** Who holds each booking and when, without the ids the store assigns. */
const slots = (bookings: Booking[]) => bookings.map((b) => ({ owner: b.owner, start: b.start, end: b.end }));

describe('book: what a booking names', () => {
  describe('books each of the rooms Atlas, Borealis and Cosmos', () => {
    it.each(ROOMS)('%s', async (room) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room, owner: 'ada', start: at('09:00:00'), minutes: 60 });

      expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00:00'), end: at('10:00:00') });
    });
  });

  describe('rejects a room that is not Atlas, Borealis or Cosmos and names it', () => {
    it.each(['Zenith', 'atlas', ''])('"%s"', async (room) => {
      const bookings = createBookings();

      await expectRefusal(
        bookings.book({ room, owner: 'ada', start: at('09:00:00'), minutes: 60 }),
        `There is no room called "${room}".`,
      );
    });
  });

  describe('rejects a booking without the name of the person making it', () => {
    it.each(['', '   '])('owner "%s"', async (owner) => {
      const bookings = createBookings();

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner, start: at('09:00:00'), minutes: 60 }),
        'A booking needs the name of the person making it.',
      );
    });
  });
});

describe('book: when and for how long', () => {
  describe('rejects a start that is not on the hour or the half hour', () => {
    it.each([
      { label: 'a quarter past', start: at('09:15:00') },
      { label: 'a second before the half hour', start: at('09:29:59') },
      { label: 'a millisecond past the hour', start: at('09:00:00.001') },
      { label: 'an invalid date', start: new Date('not a date') },
    ])('$label', async ({ start }) => {
      const bookings = createBookings();

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }),
        'A booking starts on the hour or the half hour.',
      );
    });
  });

  it('accepts starts on the hour and half hour and lengths of 30 minutes and 4 hours', async () => {
    const bookings = createBookings();

    const shortest = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:30:00'), minutes: 30 });
    const longest = await bookings.book({ room: 'Borealis', owner: 'ada', start: at('10:00:00'), minutes: 240 });

    expect(shortest).toMatchObject({ start: at('09:30:00'), end: at('10:00:00') });
    expect(longest).toMatchObject({ start: at('10:00:00'), end: at('14:00:00') });
  });

  describe('rejects a length outside 30 minutes to 4 hours or not a multiple of 30 minutes', () => {
    it.each([0, -30, 15, 45, 270, 30.5])('%s minutes', async (minutes) => {
      const bookings = createBookings();

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00:00'), minutes }),
        'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
      );
    });
  });

  it('a rejected booking is not kept', async () => {
    const bookings = createBookings();
    await expectRefusal(
      bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00:00'), minutes: 45 }),
      'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
    );

    await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00:00'), minutes: 30 });

    expect(slots(await bookings.list('Atlas'))).toStrictEqual([
      { owner: 'bob', start: at('09:00:00'), end: at('09:30:00') },
    ]);
  });
});

describe('book: clashes', () => {
  describe('rejects a booking that overlaps another booking of the same room', () => {
    it.each([
      { label: 'the same time', start: '10:00:00', minutes: 120 },
      { label: 'running into its start', start: '09:00:00', minutes: 90 },
      { label: 'running over its end', start: '11:30:00', minutes: 60 },
      { label: 'inside it', start: '10:30:00', minutes: 30 },
      { label: 'around it', start: '09:30:00', minutes: 180 },
    ])('$label', async ({ start, minutes }) => {
      const bookings = createBookings();
      await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'bob', start: at(start), minutes }),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
      );
      expect(slots(await bookings.list('Atlas'))).toStrictEqual([
        { owner: 'ada', start: at('10:00:00'), end: at('12:00:00') },
      ]);
    });
  });

  it('books different rooms at the same time', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });

    await bookings.book({ room: 'Borealis', owner: 'bob', start: at('10:00:00'), minutes: 120 });
    await bookings.book({ room: 'Cosmos', owner: 'cy', start: at('10:00:00'), minutes: 120 });

    expect(slots(await bookings.list('Atlas'))).toStrictEqual([
      { owner: 'ada', start: at('10:00:00'), end: at('12:00:00') },
    ]);
    expect(slots(await bookings.list('Borealis'))).toStrictEqual([
      { owner: 'bob', start: at('10:00:00'), end: at('12:00:00') },
    ]);
    expect(slots(await bookings.list('Cosmos'))).toStrictEqual([
      { owner: 'cy', start: at('10:00:00'), end: at('12:00:00') },
    ]);
  });

  it('books a room starting exactly when another booking ends', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });

    const after = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('12:00:00'), minutes: 60 });
    const before = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('09:00:00'), minutes: 60 });

    expect(after).toMatchObject({ owner: 'bob', start: at('12:00:00'), end: at('13:00:00') });
    expect(before).toMatchObject({ owner: 'cy', start: at('09:00:00'), end: at('10:00:00') });
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00:00'), minutes: 30 });
    await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00:00'), minutes: 30 });
    await bookings.book({ room: 'Borealis', owner: 'dee', start: at('08:00:00'), minutes: 30 });
    await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:30:00'), minutes: 30 });

    const listed = await bookings.list('Atlas');

    expect(slots(listed)).toStrictEqual([
      { owner: 'bob', start: at('09:00:00'), end: at('09:30:00') },
      { owner: 'cy', start: at('11:30:00'), end: at('12:00:00') },
      { owner: 'ada', start: at('14:00:00'), end: at('14:30:00') },
    ]);
  });
});

describe('cancel', () => {
  it('refuses to cancel a booking for anyone but the person who made it', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });

    await expectRefusal(bookings.cancel(booking.id, 'bob'), 'Only the person who made a booking can cancel it.');

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
    await expectRefusal(
      bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00:00'), minutes: 120 }),
      'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
    );
  });

  it('cancelling a booking frees its time', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });
    const other = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('13:00:00'), minutes: 30 });

    await bookings.cancel(booking.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([other]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00:00'), minutes: 120 });
    expect(rebooked).toMatchObject({ owner: 'bob', start: at('10:00:00'), end: at('12:00:00') });
  });

  it('rejects cancelling a booking that does not exist', async () => {
    const bookings = createBookings();

    await expectRefusal(bookings.cancel(42, 'ada'), 'There is no booking 42.');
  });
});
