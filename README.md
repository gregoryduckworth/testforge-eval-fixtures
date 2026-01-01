# orders-api

A small orders API. `npm start` serves it on port 4310 (`PORT` to change it); `npm test` runs its tests.

The load scripts in `perf/` run with [k6](https://k6.io): `k6 run perf/orders.js` with the app up.
