import { formatKickoffToIST, formatKickoffDateIST, formatKickoffTimeIST } from './time';

test('formatKickoffToIST returns correct IST string', () => {
  const input = '2026-06-22T00:30:00Z'; // 00:30 UTC -> 06:00 IST
  const out = formatKickoffToIST(input);
  expect(out).toContain('Jun');
  expect(out).toContain('IST');
  // Should show 6:00 AM in IST (depending on locale formatting)
  expect(out).toMatch(/6:\d{2}\s?(?:AM|PM)\s?IST|06:\d{2}\s?(?:AM|PM)\s?IST/i);
});

test('formatKickoffDateIST returns date only', () => {
  const input = '2026-06-22T00:30:00Z';
  const out = formatKickoffDateIST(input);
  expect(out).toMatch(/Jun\s?22/);
});

test('formatKickoffTimeIST returns time only with IST', () => {
  const input = '2026-06-22T00:30:00Z';
  const out = formatKickoffTimeIST(input);
  expect(out).toContain('IST');
  expect(out).toMatch(/6:\d{2}\s?AM\s?IST|06:\d{2}\s?AM\s?IST/);
});
