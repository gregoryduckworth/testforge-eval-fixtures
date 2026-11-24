// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';

/** A time on 2 March 2026, in UTC. */
const at = (time: string) => new Date(`2026-03-02T${time}Z`);

/** Asserts that the promise rejects with a BookingError carrying exactly this message. */
async function expectRefusal(promise: Promise<unknown>, message: string): Promise<void> {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(BookingError);
  expect(error).toMatchObject({ name: 'BookingError', message });
}

const LENGTH_MESSAGE = 'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.';
const START_MESSAGE = 'A booking starts on the hour or the half hour.';

describe('book: what a booking must name', () => {
  it.each(ROOMS)('books each of the rooms Atlas, Borealis and Cosmos (%s)', async (room) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room, owner: 'ada', start: at('09:00:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00:00'), end: at('10:00:00') });
  });

  it.each(['Zenith', 'atlas'])('rejects a room that is not Atlas, Borealis or Cosmos and names it (%s)', async (room) => {
    const bookings = createBookings();

    await expectRefusal(
      bookings.book({ room, owner: 'ada', start: at('09:00:00'), minutes: 60 }),
      `There is no room called "${room}".`,
    );
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it.each([{ owner: '' }, { owner: '   ' }])(
    'rejects a booking without the name of the person making it (owner "$owner")',
    async ({ owner }) => {
      const bookings = createBookings();

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner, start: at('09:00:00'), minutes: 60 }),
        'A booking needs the name of the person making it.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([]);
    },
  );
});

describe('book: start and length', () => {
  it('accepts starts on the hour and half hour', async () => {
    const bookings = createBookings();

    const onTheHour = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00:00'), minutes: 30 });
    const onTheHalfHour = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:30:00'), minutes: 30 });

    expect(onTheHour.start).toStrictEqual(at('09:00:00'));
    expect(onTheHalfHour.start).toStrictEqual(at('09:30:00'));
  });

  it.each([
    { label: '11:15', start: at('11:15:00') },
    { label: '11:00:30', start: at('11:00:30') },
    { label: '11:30:00.001', start: at('11:30:00.001') },
    { label: 'an invalid date', start: new Date('not a date') },
  ])('rejects any other start ($label)', async ({ start }) => {
    const bookings = createBookings();

    await expectRefusal(bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 30 }), START_MESSAGE);
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it('accepts the shortest (30 minutes) and longest (4 hours) bookings', async () => {
    const bookings = createBookings();

    const shortest = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00:00'), minutes: 30 });
    const longest = await bookings.book({ room: 'Borealis', owner: 'ada', start: at('09:00:00'), minutes: 240 });

    expect(shortest.end).toStrictEqual(at('09:30:00'));
    expect(longest.end).toStrictEqual(at('13:00:00'));
  });

  it.each([0, 15, 45, 270, 30.5, -30])(
    'rejects lengths outside 30 minutes to 4 hours or not in 30-minute steps (%s minutes)',
    async (minutes) => {
      const bookings = createBookings();

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00:00'), minutes }),
        LENGTH_MESSAGE,
      );
      expect(await bookings.list('Atlas')).toStrictEqual([]);
    },
  );
});

describe('book: clashes', () => {
  it.each([
    { start: '09:30', minutes: 60 }, // overlaps the start
    { start: '11:30', minutes: 60 }, // overlaps the end
    { start: '10:30', minutes: 30 }, // inside it
    { start: '10:00', minutes: 120 }, // the same time
    { start: '09:00', minutes: 240 }, // around it
  ])(
    'rejects a booking that overlaps another booking of the same room ($start for $minutes minutes)',
    async ({ start, minutes }) => {
      const bookings = createBookings();
      const first = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'bob', start: at(`${start}:00`), minutes }),
        'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([first]);
    },
  );

  it('books different rooms at the same time', async () => {
    const bookings = createBookings();
    const atlas = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });

    const borealis = await bookings.book({ room: 'Borealis', owner: 'bob', start: at('10:00:00'), minutes: 120 });
    const cosmos = await bookings.book({ room: 'Cosmos', owner: 'cy', start: at('10:00:00'), minutes: 120 });

    expect(await bookings.list('Atlas')).toStrictEqual([atlas]);
    expect(await bookings.list('Borealis')).toStrictEqual([borealis]);
    expect(await bookings.list('Cosmos')).toStrictEqual([cosmos]);
  });

  it('books a room starting exactly when another booking ends', async () => {
    const bookings = createBookings();
    const middle = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 120 });

    const after = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('12:00:00'), minutes: 30 });
    const before = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('09:30:00'), minutes: 30 });

    expect(after).toMatchObject({ start: at('12:00:00'), end: at('12:30:00') });
    expect(before).toMatchObject({ start: at('09:30:00'), end: at('10:00:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([before, middle, after]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('09:00:00'), minutes: 60 });
    const lunchtime = await bookings.book({ room: 'Atlas', owner: 'cy', start: at('11:30:00'), minutes: 60 });
    await bookings.book({ room: 'Borealis', owner: 'dee', start: at('10:00:00'), minutes: 60 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, lunchtime, afternoon]);
  });
});

describe('cancel', () => {
  it('rejects cancelling by anyone but the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 60 });

    await expectRefusal(bookings.cancel(booking.id, 'bob'), 'Only the person who made a booking can cancel it.');

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('cancelling a booking frees its time for another booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 60 });

    await bookings.cancel(booking.id, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'bob', start: at('10:00:00'), minutes: 60 });
    expect(rebooked).toMatchObject({ owner: 'bob', start: at('10:00:00'), end: at('11:00:00') });
    expect(await bookings.list('Atlas')).toStrictEqual([rebooked]);
  });

  it('rejects cancelling a booking that does not exist', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00:00'), minutes: 60 });
    const missingId = booking.id + 41;

    await expectRefusal(bookings.cancel(missingId, 'ada'), `There is no booking ${missingId}.`);

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });
});
