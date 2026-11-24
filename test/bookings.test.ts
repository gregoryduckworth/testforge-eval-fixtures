// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { BookingError, createBookings, ROOMS, type BookingRequest } from '../src/bookings';

/** A time on 2 March 2026, in UTC. */
const at = (time: string) => new Date(`2026-03-02T${time}:00Z`);

/** A valid request for Atlas at 09:00 for an hour, with the given fields changed. */
const request = (changes: Partial<BookingRequest> = {}): BookingRequest => ({
  room: 'Atlas',
  owner: 'ada',
  start: at('09:00'),
  minutes: 60,
  ...changes,
});

/** Expects the call to reject with a BookingError carrying exactly this message. */
async function expectRefused(call: Promise<unknown>, message: string): Promise<void> {
  const error: unknown = await call.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(BookingError);
  expect(error).toHaveProperty('message', message);
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

  describe('books each room at the shortest and longest lengths, starting on the hour or half hour', () => {
    it.each(ROOMS)('%s', async (room) => {
      const bookings = createBookings();

      const shortest = await bookings.book({ room, owner: 'ada', start: at('09:30'), minutes: 30 });
      const longest = await bookings.book({ room, owner: 'ada', start: at('11:00'), minutes: 240 });

      expect(shortest).toMatchObject({ room, owner: 'ada', start: at('09:30'), end: at('10:00') });
      expect(longest).toMatchObject({ room, owner: 'ada', start: at('11:00'), end: at('15:00') });
    });
  });

  describe('refuses a room that is not Atlas, Borealis or Cosmos', () => {
    it.each(['Zenith', 'atlas', ''])('room "%s"', async (room) => {
      const bookings = createBookings();

      await expectRefused(bookings.book(request({ room })), `There is no room called "${room}".`);
    });
  });

  describe('refuses a booking without the name of the person making it', () => {
    it.each(['', '   '])('owner "%s"', async (owner) => {
      const bookings = createBookings();

      await expectRefused(bookings.book(request({ owner })), 'A booking needs the name of the person making it.');
    });
  });

  describe('refuses a start that is not on the hour or the half hour', () => {
    it.each([
      { label: 'a quarter past', start: at('09:15') },
      { label: 'thirty seconds past', start: new Date('2026-03-02T09:00:30Z') },
      { label: 'one millisecond past', start: new Date('2026-03-02T09:00:00.001Z') },
      { label: 'an invalid date', start: new Date('not a date') },
    ])('$label', async ({ start }) => {
      const bookings = createBookings();

      await expectRefused(bookings.book(request({ start })), 'A booking starts on the hour or the half hour.');
    });
  });

  describe('refuses a length outside 30 minutes to 4 hours or not a multiple of 30 minutes', () => {
    it.each([0, -30, 15, 45, 30.5, 270])('%s minutes', async (minutes) => {
      const bookings = createBookings();

      await expectRefused(
        bookings.book(request({ minutes })),
        'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
      );
    });
  });

  describe('refuses a booking that overlaps another booking of the same room', () => {
    it.each([
      { label: 'starting before and ending inside', start: at('09:30'), minutes: 60 },
      { label: 'starting inside and ending after', start: at('11:30'), minutes: 60 },
      { label: 'lying inside', start: at('10:30'), minutes: 30 },
      { label: 'enclosing it', start: at('09:00'), minutes: 240 },
      { label: 'at the same time', start: at('10:00'), minutes: 120 },
    ])('$label', async ({ start, minutes }) => {
      const bookings = createBookings();
      const existing = await bookings.book(request({ owner: 'ada', start: at('10:00'), minutes: 120 }));

      await expectRefused(
        bookings.book(request({ owner: 'grace', start, minutes })),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([existing]);
    });
  });

  it('books different rooms at the same time', async () => {
    const bookings = createBookings();

    const made = [];
    for (const room of ROOMS) {
      made.push(await bookings.book(request({ room, start: at('10:00'), minutes: 60 })));
    }

    for (const [index, room] of ROOMS.entries()) {
      expect(await bookings.list(room)).toStrictEqual([made[index]]);
    }
  });

  it('books a room right before and right after another booking', async () => {
    const bookings = createBookings();
    await bookings.book(request({ start: at('10:00'), minutes: 60 }));

    const after = await bookings.book(request({ owner: 'grace', start: at('11:00'), minutes: 60 }));
    const before = await bookings.book(request({ owner: 'grace', start: at('09:00'), minutes: 60 }));

    expect(after).toMatchObject({ start: at('11:00'), end: at('12:00') });
    expect(before).toMatchObject({ start: at('09:00'), end: at('10:00') });
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    await bookings.book(request({ start: at('14:00') }));
    await bookings.book(request({ start: at('09:00') }));
    await bookings.book(request({ start: at('11:30') }));
    await bookings.book(request({ room: 'Borealis', start: at('10:00') }));

    const listed = await bookings.list('Atlas');

    expect(listed.map((b) => b.start)).toStrictEqual([at('09:00'), at('11:30'), at('14:00')]);
    expect(listed.map((b) => b.room)).toStrictEqual(['Atlas', 'Atlas', 'Atlas']);
  });
});

describe('cancel', () => {
  it('lets the person who made a booking cancel it and frees its time', async () => {
    const bookings = createBookings();
    const booking = await bookings.book(request({ owner: 'ada', start: at('10:00'), minutes: 60 }));

    await bookings.cancel(booking.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([]);
    const rebooked = await bookings.book(request({ owner: 'grace', start: at('10:00'), minutes: 60 }));
    expect(rebooked).toMatchObject({ room: 'Atlas', owner: 'grace', start: at('10:00'), end: at('11:00') });
  });

  it('refuses to cancel a booking for someone who did not make it', async () => {
    const bookings = createBookings();
    const booking = await bookings.book(request({ owner: 'ada', start: at('10:00'), minutes: 60 }));

    await expectRefused(bookings.cancel(booking.id, 'grace'), 'Only the person who made a booking can cancel it.');

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();
    await bookings.book(request());

    await expectRefused(bookings.cancel(99, 'ada'), 'There is no booking 99.');
  });
});
