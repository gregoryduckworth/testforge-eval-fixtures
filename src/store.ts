import type { Booking } from './bookings';

/** Where bookings are kept. The app uses its database; tests and local runs use memoryStore(). */
export interface BookingStore {
  forRoom(room: string): Promise<Booking[]>;
  get(id: number): Promise<Booking | undefined>;
  add(booking: Omit<Booking, 'id'>): Promise<Booking>;
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
    add: (booking) => {
      const added = copy({ ...booking, id: nextId++ });
      bookings.set(added.id, added);
      return Promise.resolve(copy(added));
    },
    remove: (id) => {
      bookings.delete(id);
      return Promise.resolve();
    },
  };
}
