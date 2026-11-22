// PERFORMANCE-20261122-D1B7: TC1
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
    // TC1: detail scenario keeps p95 and p99 latency within 20% of the last good runs
    // (22 ms and 23 ms then, so p95 < 26.4 ms and p99 < 27.6 ms).
    'http_req_duration{scenario:detail}': ['p(95)<26.4', 'p(99)<27.6'],
  },
};

// Run with --vus/--iterations (a smoke run), k6 drops the scenarios and calls the default function:
// exercise both flows once. The scenarios above name their own exec, so load runs never call this.
export default function () {
  list();
  detail();
}

export function list() {
  const res = http.get(`${BASE_URL}/orders`);
  check(res, { 'lists the orders': (r) => r.status === 200 });
}

export function detail() {
  const id = 1 + Math.floor(Math.random() * 60);
  const res = http.get(`${BASE_URL}/orders/${id}`);
  check(res, { 'returns the order': (r) => r.status === 200 });
}
