import assert from 'node:assert/strict';
import { isOriginAllowed } from './src/index.js';

const origins = [
  'http://localhost:5173',
  'https://store-rating-platform-client-sepia.vercel.app',
  'https://store-rating-platform-client-*.vercel.app',
];

assert.equal(
  isOriginAllowed('https://store-rating-platform-client-sepia.vercel.app', origins),
  true,
  'allows an exact production origin',
);
assert.equal(
  isOriginAllowed(
    'https://store-rating-platform-client-b9pvlqcu5-shishir-21s-projects.vercel.app',
    origins,
  ),
  true,
  'allows this project’s Vercel preview origin',
);
assert.equal(isOriginAllowed('http://localhost:5173', origins), true, 'allows localhost');
assert.equal(isOriginAllowed('https://evil-site.vercel.app', origins), false, 'rejects unrelated Vercel origins');
assert.equal(
  isOriginAllowed('https://store-rating-platform-client-sepia.vercel.app', [
    'https://override.example.com',
  ]),
  false,
  'uses only an explicit override allowlist',
);

console.log('CORS origin matcher checks passed');
