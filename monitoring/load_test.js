import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 15 }, // Ramp-up
    { duration: '40s', target: 25 }, // High load
    { duration: '15s', target: 0 },  // Ramp-down
  ],
};

// Use host.docker.internal if inside docker, otherwise fallback to localhost
const BASE_URL = __ENV.TARGET_URL || 'http://host.docker.internal:5000';

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });

  http.get(`${BASE_URL}/metrics`);
  sleep(0.5);
}
