// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';

/** A time on 2 March 2026, in UTC. */
const at = (time: string) => new Date(`2026-03-02T${time}:00Z`);

/** Asserts that a call was refused with a BookingError carrying exactly this message. */
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

  describe.each(ROOMS)('%s', (room) => {
    it('books each room for 30 minutes and for 4 hours', async () => {
      const bookings = createBookings();

      const short = await bookings.book({ room, owner: 'ada', start: at('09:30'), minutes: 30 });
      const long = await bookings.book({ room, owner: 'ada', start: at('11:00'), minutes: 240 });

      expect(short).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:30'), end: at('10:00') });
      expect(long).toStrictEqual({ id: 2, room, owner: 'ada', start: at('11:00'), end: at('15:00') });
      expect(await bookings.list(room)).toStrictEqual([short, long]);
    });
  });

  describe.each([0, 15, 45, 270, 30.5, -30])('a length of %s minutes', (minutes) => {
    it('refuses a length that is not 30 minutes to 4 hours in steps of 30', async () => {
      const bookings = createBookings();

      await expectRefused(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes }),
        'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([]);
    });
  });

  describe.each(['', '   '])('an owner of "%s"', (owner) => {
    it('refuses a booking without the name of the person making it', async () => {
      const bookings = createBookings();

      await expectRefused(
        bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }),
        'A booking needs the name of the person making it.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([]);
    });
  });

  describe.each([
    { label: 'quarter past', start: new Date('2026-03-02T09:15:00Z') },
    { label: '30 seconds past', start: new Date('2026-03-02T09:00:30Z') },
    { label: '1 ms past', start: new Date('2026-03-02T09:00:00.001Z') },
    { label: 'an invalid date', start: new Date('not a date') },
    { label: 'on the hour at +05:45 only', start: new Date('2026-03-02T09:00:00+05:45') },
  ])('a start $label', ({ start }) => {
    it('refuses a start that is not on the hour or the half hour UTC', async () => {
      const bookings = createBookings();

      await expectRefused(
        bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }),
        'A booking starts on the hour or the half hour.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([]);
    });
  });

  describe.each(['atlas', 'Atlas '])('a room called "%s"', (room) => {
    it('says which room does not exist', async () => {
      const bookings = createBookings();

      await expectRefused(
        bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 }),
        `There is no room called "${room}".`,
      );
      expect(await bookings.list('Atlas')).toStrictEqual([]);
    });
  });
});

describe('clashes', () => {
  describe.each([
    { shape: 'ending inside it', start: '09:30', minutes: 60 },
    { shape: 'starting inside it', start: '11:30', minutes: 60 },
    { shape: 'inside it', start: '10:30', minutes: 30 },
    { shape: 'around it', start: '09:00', minutes: 240 },
    { shape: 'at the same time', start: '10:00', minutes: 120 },
  ])('a booking $shape', ({ start, minutes }) => {
    it('refuses a booking that overlaps another booking of the same room', async () => {
      const bookings = createBookings();
      const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

      await expectRefused(
        bookings.book({ room: 'Atlas', owner: 'bob', start: at(start), minutes }),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([first]);
    });
  });

  it('books different rooms for the same time', async () => {
    const bookings = createBookings();

    const atlas = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    const borealis = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('10:00'), minutes: 60 });
    const cosmos = await bookings.book({ room: 'Cosmos', owner: 'cy', start: at('10:00'), minutes: 60 });

    expect(await bookings.list('Atlas')).toStrictEqual([atlas]);
    expect(await bookings.list('Borealis')).toStrictEqual([borealis]);
    expect(await bookings.list('Cosmos')).toStrictEqual([cosmos]);
  });

  it('books a room starting exactly when another booking ends', async () => {
    const bookings = createBookings();
    const middle = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const after = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('11:00'), minutes: 60 });
    const before = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 60 });

    expect(after).toStrictEqual({ id: 2, room: 'Atlas', owner: 'bob', start: at('11:00'), end: at('12:00') });
    expect(before).toStrictEqual({ id: 3, room: 'Atlas', owner: 'bob', start: at('09:00'), end: at('10:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([before, middle, after]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });
    const midday = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('11:30'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'ada', start: at('08:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, midday, afternoon]);
  });
});

describe('cancel', () => {
  it('lets the person who made a booking cancel it and frees its time', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);

    await bookings.cancel(booking.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 60 });
    expect(rebooked).toStrictEqual({ id: 2, room: 'Atlas', owner: 'bob', start: at('10:00'), end: at('11:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([rebooked]);
  });

  it('refuses a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefused(bookings.cancel(booking.id, 'bob'), 'Only the person who made a booking can cancel it.');

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
    await expectRefused(
      bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 60 }),
      'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
    );
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();

    await expectRefused(bookings.cancel(99, 'ada'), 'There is no booking 99.');
  });
});
