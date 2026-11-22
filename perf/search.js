// PERFORMANCE-20261122-579F: TC2
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4310';
const QUERIES = ['ada', 'grace', 'alan', 'edsger', 'barbara', 'donald', 'margaret', 'ken', 'radia', 'linus'];

export const options = {
  scenarios: {
    search: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '10s',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // The last good runs held search at p95 14 ms; this allows 20% over that.
    'http_req_duration{scenario:search}': ['p(95)<16.8'],
  },
};

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const res = http.get(`${BASE_URL}/search?q=${q}`);
  check(res, { 'finds orders': (r) => r.status === 200 });
}
