// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13, TC14
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';
import { at } from './support/time';

/** Bookings with Atlas taken by ada from 10:00 to 12:00. */
async function withAtlasBooked() {
  const bookings = createBookings();
  const taken = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });
  return { bookings, taken };
}

describe('book: what a booking must name', () => {
  describe('books each of the rooms Atlas, Borealis and Cosmos', () => {
    it.each(ROOMS)('%s', async (room) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });

      expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00'), end: at('10:00') });
    });
  });

  describe('refuses a room that is not Atlas, Borealis or Cosmos', () => {
    it.each(['Zenith', 'atlas', ''])('%j', async (room) => {
      const bookings = createBookings();

      const booking = bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });

      await expect(booking).rejects.toStrictEqual(new BookingError(`There is no room called "${room}".`));
    });
  });

  describe('refuses a booking without the name of the person making it', () => {
    it.each(['', '   '])('owner %j', async (owner) => {
      const bookings = createBookings();

      const booking = bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 });

      await expect(booking).rejects.toStrictEqual(
        new BookingError('A booking needs the name of the person making it.'),
      );
    });
  });
});

describe('book: when a booking starts', () => {
  describe('accepts starts on the hour and on the half hour', () => {
    it.each(['09:00', '09:30'])('%s', async (time) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at(time), minutes: 30 });

      expect(booking.start).toStrictEqual(at(time));
    });
  });

  describe('refuses a start that is not on the hour or the half hour', () => {
    it.each([
      { label: '09:15', start: at('09:15') },
      { label: '09:00:30', start: at('09:00:30') },
      { label: '09:29:59.999', start: at('09:29:59.999') },
      { label: 'an invalid date', start: new Date(Number.NaN) },
    ])('$label', async ({ start }) => {
      const bookings = createBookings();

      const booking = bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 });

      await expect(booking).rejects.toStrictEqual(new BookingError('A booking starts on the hour or the half hour.'));
    });
  });
});

describe('book: how long a booking lasts', () => {
  describe('accepts the shortest and longest lengths, 30 minutes and 4 hours', () => {
    it.each([
      { minutes: 30, end: '09:30' },
      { minutes: 240, end: '13:00' },
    ])('$minutes minutes', async ({ minutes, end }) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes });

      expect(booking.end).toStrictEqual(at(end));
    });
  });

  describe('refuses a length outside 30 minutes to 4 hours or not in 30-minute steps', () => {
    it.each([0, -30, 15, 45, 270, 30.5])('%s minutes', async (minutes) => {
      const bookings = createBookings();

      const booking = bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes });

      await expect(booking).rejects.toStrictEqual(
        new BookingError('A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.'),
      );
    });
  });
});

describe('book: clashes', () => {
  describe('refuses a booking that overlaps another booking of the same room', () => {
    it.each([
      { label: 'starts before, ends inside', start: '09:30', minutes: 60 },
      { label: 'starts inside, ends after', start: '11:30', minutes: 60 },
      { label: 'inside', start: '10:30', minutes: 30 },
      { label: 'around', start: '09:00', minutes: 240 },
      { label: 'the same time', start: '10:00', minutes: 120 },
    ])('$label', async ({ start, minutes }) => {
      const { bookings } = await withAtlasBooked();

      const booking = bookings.book({ room: 'Atlas', owner: 'bob', start: at(start), minutes });

      await expect(booking).rejects.toStrictEqual(
        new BookingError('Atlas is already booked from 2026-03-02T10:00:00.000Z.'),
      );
    });
  });

  it('books different rooms at the same time', async () => {
    const { bookings } = await withAtlasBooked();

    const booking = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('10:00'), minutes: 120 });

    expect(await bookings.list('Borealis')).toStrictEqual([booking]);
  });

  it('books a room starting exactly when its previous booking ends, and ending when its next one starts', async () => {
    const { bookings, taken } = await withAtlasBooked();

    const after = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('12:00'), minutes: 60 });
    const before = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('09:00'), minutes: 60 });

    expect(await bookings.list('Atlas')).toStrictEqual([before, taken, after]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00'), minutes: 60 });
    const midday = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:00'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'dee', start: at('10:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, midday, afternoon]);
  });
});

describe('cancel', () => {
  it('lets the person who made a booking cancel it, freeing its time', async () => {
    const { bookings, taken } = await withAtlasBooked();

    await bookings.cancel(taken.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00'), minutes: 120 });
    expect(await bookings.list('Atlas')).toStrictEqual([rebooked]);
  });

  it('refuses a cancellation by anyone other than the person who made the booking', async () => {
    const { bookings, taken } = await withAtlasBooked();

    const cancelling = bookings.cancel(taken.id, 'bob');

    await expect(cancelling).rejects.toStrictEqual(
      new BookingError('Only the person who made a booking can cancel it.'),
    );
    expect(await bookings.list('Atlas')).toStrictEqual([taken]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const { bookings, taken } = await withAtlasBooked();
    const missingId = taken.id + 1;

    const cancelling = bookings.cancel(missingId, 'ada');

    await expect(cancelling).rejects.toStrictEqual(new BookingError(`There is no booking ${missingId}.`));
    expect(await bookings.list('Atlas')).toStrictEqual([taken]);
  });
});
