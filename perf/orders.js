// PERFORMANCE-20261122-1D29: TC1
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
    // detail scenario keeps p95 latency under 26.4 ms: its p95 held at 22 ms over the last good
    // runs, and this allows 20% headroom over that baseline.
    'http_req_duration{scenario:detail}': ['p(95)<26.4'],
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

// A run that overrides the scenarios (e.g. `--vus 1 --iterations 1` as a smoke check) runs the
// default function: exercise both journeys once. The named scenarios above don't use it.
export default function () {
  list();
  detail();
}
