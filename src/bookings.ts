import { memoryStore, type BookingStore } from './store';

export const ROOMS = ['Atlas', 'Borealis', 'Cosmos'] as const;
export type Room = (typeof ROOMS)[number];

export interface Booking {
  id: number;
  room: Room;
  owner: string;
  start: Date;
  end: Date;
}

export interface BookingRequest {
  room: string;
  owner: string;
  start: Date;
  minutes: number;
}

/** A booking or cancellation that was refused; the message says why. */
export class BookingError extends Error {
  override name = 'BookingError';
}

const STEP_MINUTES = 30;
const MAX_MINUTES = 4 * 60;
const MINUTE_MS = 60_000;

function onTheHalfHour(start: Date): boolean {
  return !Number.isNaN(start.getTime()) && start.getTime() % (STEP_MINUTES * MINUTE_MS) === 0;
}

function validLength(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= STEP_MINUTES && minutes <= MAX_MINUTES && minutes % STEP_MINUTES === 0;
}

const overlaps = (a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean =>
  a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();

export function createBookings(store: BookingStore = memoryStore()) {
  return {
    /** Books a room, or rejects with a BookingError. */
    async book(request: BookingRequest): Promise<Booking> {
      const room = ROOMS.find((r) => r === request.room);
      if (!room) throw new BookingError(`There is no room called "${request.room}".`);
      const owner = request.owner.trim();
      if (!owner) throw new BookingError('A booking needs the name of the person making it.');
      if (!onTheHalfHour(request.start)) throw new BookingError('A booking starts on the hour or the half hour.');
      if (!validLength(request.minutes)) {
        throw new BookingError('A booking lasts from 30 minutes to 4 hours, in steps of 30 minutes.');
      }
      const start = new Date(request.start);
      const end = new Date(start.getTime() + request.minutes * MINUTE_MS);
      const result = await store.addUnlessClash({ room, owner, start, end }, (b) => overlaps(b, { start, end }));
      if ('clash' in result) {
        throw new BookingError(`${room} is already booked from ${result.clash.start.toISOString()}.`);
      }
      return result.added;
    },

    /** A room's bookings, by start time. */
    async list(room: Room): Promise<Booking[]> {
      return (await store.forRoom(room)).sort((a, b) => a.start.getTime() - b.start.getTime());
    },

    /** Cancels a booking, which only the person who made it can do. */
    async cancel(id: number, by: string): Promise<void> {
      const booking = await store.get(id);
      if (!booking) throw new BookingError(`There is no booking ${id}.`);
      if (booking.owner !== by.trim()) throw new BookingError('Only the person who made a booking can cancel it.');
      await store.remove(id);
    },
  };
}
