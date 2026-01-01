import type { Booking } from './bookings';

/** Where bookings are kept. The app uses its database; tests and local runs use memoryStore(). */
export interface BookingStore {
  forRoom(room: string): Promise<Booking[]>;
  get(id: number): Promise<Booking | undefined>;
  /**
   * Adds a booking unless one of its room's bookings clashes with it, and returns that booking instead.
   * The check and the add are one step (the app's database does both in one transaction), so two bookings
   * made at the same moment can't both miss each other.
   */
  addUnlessClash(
    booking: Omit<Booking, 'id'>,
    clashes: (other: Booking) => boolean,
  ): Promise<{ added: Booking } | { clash: Booking }>;
  remove(id: number): Promise<void>;
}

const copy = (booking: Booking): Booking => ({
  ...booking,
  start: new Date(booking.start),
  end: new Date(booking.end),
});

/** Bookings in memory, numbered from 1 in the order they are added. */
export function memoryStore(): BookingStore {
  const bookings = new Map<number, Booking>();
  let nextId = 1;
  return {
    forRoom: (room) => Promise.resolve([...bookings.values()].filter((b) => b.room === room).map(copy)),
    get: (id) => {
      const booking = bookings.get(id);
      return Promise.resolve(booking && copy(booking));
    },
    addUnlessClash: (booking, clashes) => {
      const clash = [...bookings.values()].find((b) => b.room === booking.room && clashes(copy(b)));
      if (clash) return Promise.resolve({ clash: copy(clash) });
      const added = copy({ ...booking, id: nextId++ });
      bookings.set(added.id, added);
      return Promise.resolve({ added: copy(added) });
    },
    remove: (id) => {
      bookings.delete(id);
      return Promise.resolve();
    },
  };
}
