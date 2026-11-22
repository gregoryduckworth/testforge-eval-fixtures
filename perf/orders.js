// PERFORMANCE-20261122-4CA5: TC1
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4310';

// A steady arrival rate, so a slower endpoint shows as latency rather than fewer requests.
const steady = (exec) => ({
  executor: 'constant-arrival-rate',
  exec,
  rate: 20,
  timeUnit: '1s',
  duration: '10s',
  preAllocatedVUs: 5,
  maxVUs: 20,
});

export const options = {
  scenarios: {
    list: steady('list'),
    detail: steady('detail'),
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    // The detail scenario's p95 and p99 latency as the last good runs held them (22 ms, 23 ms), with 20% headroom.
    'http_req_duration{scenario:detail}': ['p(95)<26.4', 'p(99)<27.6'],
  },
};

export function list() {
  const res = http.get(`${BASE_URL}/orders`);
  check(res, { 'lists the orders': (r) => r.status === 200 });
}

export function detail() {
  const id = 1 + Math.floor(Math.random() * 60);
  const res = http.get(`${BASE_URL}/orders/${id}`);
  check(res, { 'returns the order': (r) => r.status === 200 });
}

// Run with --vus/--iterations (a smoke run), k6 replaces the scenarios above and calls this:
// one pass through each journey, so the smoke run still exercises both.
export default function () {
  list();
  detail();
}
