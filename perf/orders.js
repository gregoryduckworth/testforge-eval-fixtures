// PERFORMANCE-20261122-B7D4: TC1
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
    // detail scenario holds order-detail latency at its last good level (p95 < 28.8 ms, p99 < 31.2 ms):
    // the last good runs held p95 24 ms and p99 26 ms; these allow 20% headroom over them.
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

// Run when the CLI's --vus/--iterations replace the scenarios (a smoke run): one pass of each journey.
export default function () {
  list();
  detail();
}
