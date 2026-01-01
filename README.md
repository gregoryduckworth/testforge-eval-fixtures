# room-bookings

Booking the office's meeting rooms. `createBookings()` takes a `BookingStore`: the app passes its
database, and tests and local runs use `memoryStore()`.

```bash
npm install
npm run typecheck   # tsc, strict
npm run lint        # ESLint with type information; warnings fail too
npm test
```

CI runs all three on every pull request.
