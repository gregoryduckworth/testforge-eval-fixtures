// PERF-12: TC1
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
    // The order page on its own, so the faster list can't hide it. A healthy page sits around
    // 22 ms p95 / 25 ms p99; these limits leave room for noise and fail well before ~90 ms.
    'http_req_duration{scenario:detail}': ['p(95)<40', 'p(99)<50'],
    'http_req_failed{scenario:detail}': ['rate<0.01'],
    // A faster page that drops the product names must still fail the run.
    'checks{scenario:detail}': ['rate>0.99'],
  },
};

// Run when CLI flags such as `--vus 1 --iterations 1` replace the scenarios: one pass of each journey.
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
  const res = http.get(`${BASE_URL}/orders/${id}`, { tags: { name: 'GET /orders/:id' } });
  check(res, {
    'returns the order': (r) => r.status === 200,
    'names the product on every line': (r) => {
      if (r.status !== 200) return false;
      const lines = r.json('lines');
      return Array.isArray(lines) && lines.length > 0 && lines.every((l) => typeof l.productName === 'string' && l.productName !== '');
    },
  });
}
