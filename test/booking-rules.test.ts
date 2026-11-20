// ROOM-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13
import { describe, expect, it } from 'vitest';
import { BookingError, createBookings, ROOMS } from '../src/bookings';
import { at } from './support/time';

describe('book', () => {
  it.each(ROOMS)("books each of the office's rooms: %s", async (room) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 1, room, owner: 'ada', start: at('09:00'), end: at('10:00') });
  });

  it.each([{ room: 'Zenith' }, { room: 'atlas' }, { room: '' }])(
    "refuses a room that is not one of the office's: $room",
    async ({ room }) => {
      const bookings = createBookings();

      const refusal = bookings.book({ room, owner: 'ada', start: at('09:00'), minutes: 60 });

      await expect(refusal).rejects.toThrow(BookingError);
      await expect(refusal).rejects.toThrow(`There is no room called "${room}".`);
    },
  );

  it.each([
    { label: 'empty', owner: '' },
    { label: 'only spaces', owner: '   ' },
  ])('refuses a booking whose owner is $label', async ({ owner }) => {
    const bookings = createBookings();

    const refusal = bookings.book({ room: 'Atlas', owner, start: at('09:00'), minutes: 60 });

    await expect(refusal).rejects.toThrow(BookingError);
    await expect(refusal).rejects.toThrow('A booking needs the name of the person making it.');
  });

  it.each([
    { start: '09:30', minutes: 30, end: '10:00' }, // shortest booking, on the half hour
    { start: '08:00', minutes: 240, end: '12:00' }, // longest booking, on the hour
    { start: '10:00', minutes: 90, end: '11:30' }, // a step between the limits
  ])('books $minutes minutes starting at $start', async ({ start, minutes, end }) => {
    const bookings = createBookings();

    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at(start), minutes });

    expect(booking).toStrictEqual({ id: 1, room: 'Atlas', owner: 'ada', start: at(start), end: at(end) });
  });

  it.each([
    { label: '09:15', start: at('09:15') },
    { label: '09:00:30', start: new Date('2026-03-02T09:00:30Z') },
    { label: '09:00 at +05:45 (03:15 UTC)', start: new Date('2026-03-02T09:00:00+05:45') },
    { label: 'an invalid date', start: new Date('not a date') },
  ])('refuses a start that is not on the hour or half hour UTC: $label', async ({ start }) => {
    const bookings = createBookings();

    const refusal = bookings.book({ room: 'Atlas', owner: 'ada', start, minutes: 60 });

    await expect(refusal).rejects.toThrow(BookingError);
    await expect(refusal).rejects.toThrow('A booking starts on the hour or the half hour.');
  });

  it.each([{ minutes: 0 }, { minutes: 15 }, { minutes: 45 }, { minutes: 270 }, { minutes: -30 }, { minutes: 30.5 }])(
    'refuses a booking lasting $minutes minutes',
    async ({ minutes }) => {
      const bookings = createBookings();

      const refusal = bookings.book({ room: 'Atlas', owner: 'ada', start: at('09:00'), minutes });

      await expect(refusal).rejects.toThrow(BookingError);
      await expect(refusal).rejects.toThrow('A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.');
    },
  );
});

describe('clashes', () => {
  it.each([
    { shape: 'covers the same slot as another', start: '10:00', minutes: 120 },
    { shape: 'starts during another', start: '11:00', minutes: 120 },
    { shape: 'ends during another', start: '09:00', minutes: 90 },
    { shape: 'contains another', start: '09:00', minutes: 240 },
    { shape: 'lies within another', start: '10:30', minutes: 30 },
  ])('refuses a booking of the same room that $shape', async ({ start, minutes }) => {
    const bookings = createBookings();
    const existing = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 120 });

    const refusal = bookings.book({ room: 'Atlas', owner: 'grace', start: at(start), minutes });

    await expect(refusal).rejects.toThrow(BookingError);
    await expect(refusal).rejects.toThrow('Atlas is already booked from 2026-03-02T10:00:00.000Z.');
    expect(await bookings.list('Atlas')).toStrictEqual([existing]);
  });

  it.each([
    { shape: 'ends as it starts', start: '11:00', end: '11:30' },
    { shape: 'starts as it ends', start: '09:30', end: '10:00' },
  ])('books a room back to back with another booking that $shape', async ({ start, end }) => {
    const bookings = createBookings();
    const existing = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const booking = await bookings.book({ room: 'Atlas', owner: 'grace', start: at(start), minutes: 30 });

    expect(booking).toStrictEqual({ id: 2, room: 'Atlas', owner: 'grace', start: at(start), end: at(end) });
    const listed = await bookings.list('Atlas');
    expect(listed).toHaveLength(2);
    expect(listed).toContainEqual(existing);
    expect(listed).toContainEqual(booking);
  });

  it('books the same time in a different room', async () => {
    const bookings = createBookings();
    await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const booking = await bookings.book({ room: 'Borealis', owner: 'grace', start: at('10:00'), minutes: 60 });

    expect(booking).toStrictEqual({ id: 2, room: 'Borealis', owner: 'grace', start: at('10:00'), end: at('11:00') });
    expect(await bookings.list('Borealis')).toStrictEqual([booking]);
  });
});

describe('list', () => {
  it("lists a room's bookings by start time", async () => {
    const bookings = createBookings();
    const afternoon = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('14:00'), minutes: 60 });
    const morning = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('09:00'), minutes: 60 });
    await bookings.book({ room: 'Cosmos', owner: 'linus', start: at('10:00'), minutes: 60 });
    const midday = await bookings.book({ room: 'Atlas', owner: 'alan', start: at('11:30'), minutes: 30 });

    const listed = await bookings.list('Atlas');

    expect(listed).toStrictEqual([morning, midday, afternoon]);
  });
});

describe('cancel', () => {
  it('cancelling a booking frees its time for another booking', async () => {
    const bookings = createBookings();
    const cancelled = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });
    await bookings.cancel(cancelled.id, 'ada');

    const booking = await bookings.book({ room: 'Atlas', owner: 'grace', start: at('10:00'), minutes: 60 });

    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('refuses a cancellation by someone other than the person who made the booking', async () => {
    const bookings = createBookings();
    const booking = await bookings.book({ room: 'Atlas', owner: 'ada', start: at('10:00'), minutes: 60 });

    const refusal = bookings.cancel(booking.id, 'grace');

    await expect(refusal).rejects.toThrow(BookingError);
    await expect(refusal).rejects.toThrow('Only the person who made a booking can cancel it.');
    expect(await bookings.list('Atlas')).toStrictEqual([booking]);
  });

  it('refuses to cancel a booking that does not exist', async () => {
    const bookings = createBookings();

    const refusal = bookings.cancel(42, 'ada');

    await expect(refusal).rejects.toThrow(BookingError);
    await expect(refusal).rejects.toThrow('There is no booking 42.');
  });
});
