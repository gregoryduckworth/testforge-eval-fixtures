// PERFORMANCE-20261122-FC61: TC1
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
    // TC1: detail scenario keeps p95 latency under 28.8 ms and p99 under 31.2 ms
    // (the median of the last good runs, p95 24 ms and p99 26 ms, plus 20% headroom).
    'http_req_duration{scenario:detail}': ['p(95)<28.8', 'p(99)<31.2'],
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

// Run when the CLI replaces the scenarios (e.g. `k6 run --vus 1 --iterations 1`): one pass of each journey.
export default function () {
  list();
  detail();
}
