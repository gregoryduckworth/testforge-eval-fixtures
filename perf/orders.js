// PERFORMANCE-20261122-579F: TC1
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
    // The last good runs held detail at p95 23 ms and p99 25 ms; these allow 20% over that.
    'http_req_duration{scenario:detail}': ['p(95)<27.6', 'p(99)<30'],
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

// A run that replaces the scenarios (`k6 run --vus 1 --iterations 1`, a smoke check) calls the
// default function; the scenarios above call `list` and `detail` by name and never reach it.
export default function () {
  list();
  detail();
}
