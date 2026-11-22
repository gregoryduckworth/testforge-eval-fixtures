// PERFORMANCE-20261122-9A43: TC1
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
    // TC1: detail scenario keeps order detail p95 and p99 latency within the last good runs' level.
    // The last good runs held p95 22 ms and p99 23 ms. These limits allow 20% headroom above that.
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

// When the CLI sets --vus/--iterations (a smoke run), k6 replaces the scenarios and runs `default`.
// The scenarios above use `exec` and never run this. It covers both journeys in one iteration.
export default function () {
  list();
  detail();
}
