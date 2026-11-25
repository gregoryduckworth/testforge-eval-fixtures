// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { BookingError, ROOMS, createBookings } from '../src/bookings';

/** A time on 2 March 2026, in UTC. */
const at = (time: string) => new Date(`2026-03-02T${time}:00Z`);

/** Asserts that an attempt is refused with a BookingError carrying exactly this message. */
async function expectRefusal(attempt: Promise<unknown>, message: string): Promise<void> {
  await expect(attempt).rejects.toBeInstanceOf(BookingError);
  await expect(attempt).rejects.toHaveProperty('message', message);
}

describe('book', () => {
  it('books a free room', async () => {
    const bookings = createBookings();

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('09:00'), end: at('10:00') });
  });

  it('books each of the rooms Atlas, Borealis and Cosmos', async () => {
    const bookings = createBookings();
    expect(ROOMS).toStrictEqual(['Atlas', 'Borealis', 'Cosmos']);

    for (const [index, room] of ROOMS.entries()) {
      const booking = await bookings.book({ room, owner: 'ada', start: at('09:30'), minutes: 240 });

      const expected = { id: index + 1, room, owner: 'ada', start: at('09:30'), end: at('13:30') };
      expect(booking).toStrictEqual(expected);
      expect(await bookings.list(room)).toStrictEqual([expected]);
    }
  });

  it('refuses an unknown room, naming it in the error', async () => {
    const bookings = createBookings();

    await expectRefusal(
      bookings.book({ room: 'Zenith', owner: 'ada', start: at('09:00'), minutes: 60 }),
      'There is no room called "Zenith".',
    );
    await expectRefusal(
      bookings.book({ room: 'atlas', owner: 'ada', start: at('09:00'), minutes: 60 }),
      'There is no room called "atlas".',
    );
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it.each(['', '   '])('refuses a booking without the name of the person making it', async (owner) => {
    const bookings = createBookings();

    await expectRefusal(
      bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 }),
      'A booking needs the name of the person making it.',
    );
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  it.each([
    { label: '09:15 UTC', start: at('09:15') },
    { label: '30 seconds past the hour', start: new Date('2026-03-02T09:00:30Z') },
    { label: '1 ms past the hour', start: new Date('2026-03-02T09:00:00.001Z') },
    { label: '09:00 at +05:45 (03:15 UTC)', start: new Date('2026-03-02T09:00:00+05:45') },
    { label: 'an invalid date', start: new Date('not a date') },
  ])('refuses a start that is not on the UTC hour or half hour', async ({ start }) => {
    const bookings = createBookings();

    await expectRefusal(
      bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 }),
      'A booking starts on the hour or the half hour.',
    );
    expect(await bookings.list('Atlas')).toStrictEqual([]);
  });

  describe('accepts lengths of 30 minutes to 4 hours in 30-minute steps and refuses any other', () => {
    it.each([
      { minutes: 30, end: '10:30' },
      { minutes: 90, end: '11:30' },
      { minutes: 240, end: '14:00' },
    ])('accepts $minutes minutes', async ({ minutes, end }) => {
      const bookings = createBookings();

      const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes });

      expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at('10:00'), end: at(end) });
    });

    it.each([0, -30, 15, 45, 270, 30.5, Number.NaN])('refuses %d minutes', async (minutes) => {
      const bookings = createBookings();

      await expectRefusal(
        bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes }),
        'A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.',
      );
      expect(await bookings.list('Atlas')).toStrictEqual([]);
    });
  });
});

describe('clashes', () => {
  const first = { id: 1, room: 'Atlas', owner: 'ada', start: at('10:00'), end: at('11:00') };

  it.each([
    { label: 'starts before and ends inside', start: '09:30', minutes: 60 },
    { label: 'starts inside and ends after', start: '10:30', minutes: 60 },
    { label: 'shares the start', start: '10:00', minutes: 30 },
    { label: 'contains it', start: '09:00', minutes: 180 },
  ])('refuses a booking that overlaps another booking of the same room', async ({ start, minutes }) => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(
      bookings.book({ room: 'Atlas', owner: 'grace', start: at(start), minutes }),
      'Atlas is already booked from 2026-03-02T10:00:00.000Z.',
    );
    expect(await bookings.list('Atlas')).toStrictEqual([first]);
  });

  it('books different rooms at the same time', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const booking = await bookings.book({ room: 'Borealis', owner: 'grace', start: at('10:00'), minutes: 60 });

    const borealis = { id: 2, room: 'Borealis', owner: 'grace', start: at('10:00'), end: at('11:00') };
    expect(booking).toStrictEqual(borealis);
    expect(await bookings.list('Atlas')).toStrictEqual([first]);
    expect(await bookings.list('Borealis')).toStrictEqual([borealis]);
  });

  it('books a room back to back with its other bookings', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const after = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('11:00'), minutes: 30 });
    const before = await bookings.book({ room: 'Atlas', owner: 'linus', start: at('09:00'), minutes: 60 });

    const afterExpected = { id: 2, room: 'Atlas', owner: 'grace', start: at('11:00'), end: at('11:30') };
    const beforeExpected = { id: 3, room: 'Atlas', owner: 'linus', start: at('09:00'), end: at('10:00') };
    expect(after).toStrictEqual(afterExpected);
    expect(before).toStrictEqual(beforeExpected);
    expect(await bookings.list('Atlas')).toStrictEqual([beforeExpected, first, afterExpected]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:00'), minutes: 60 });
    await bookings.book({ room: 'Atlas', owner: 'linus', start: at('11:30'), minutes: 30 });
    await bookings.book({ room: 'Cosmos', owner: 'ada', start: at('08:00'), minutes: 30 });

    const atlas = await bookings.list('Atlas');

    expect(atlas).toStrictEqual([
      { id: 2, room: 'Atlas', owner: 'grace', start: at('09:00'), end: at('10:00') },
      { id: 3, room: 'Atlas', owner: 'linus', start: at('11:30'), end: at('12:00') },
      { id: 1, room: 'Atlas', owner: 'ada', start: at('14:00'), end: at('15:00') },
    ]);
  });
});

describe('cancel', () => {
  const booked = { id: 1, room: 'Atlas', owner: 'ada', start: at('10:00'), end: at('11:00') };

  it('refuses to cancel a booking for anyone but the person who made it', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(bookings.cancel(1, 'grace'), 'Only the person who made a booking can cancel it.');
    expect(await bookings.list('Atlas')).toStrictEqual([booked]);
  });

  it('cancelling a booking frees its time', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await bookings.cancel(1, 'ada');

    expect(await bookings.list('Atlas')).toStrictEqual([]);
    const rebooked = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('10:00'), minutes: 60 });
    const expected = { id: 2, room: 'Atlas', owner: 'grace', start: at('10:00'), end: at('11:00') };
    expect(rebooked).toStrictEqual(expected);
    expect(await bookings.list('Atlas')).toStrictEqual([expected]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    await expectRefusal(bookings.cancel(2, 'ada'), 'There is no booking 2.');
    expect(await bookings.list('Atlas')).toStrictEqual([booked]);
  });
});
