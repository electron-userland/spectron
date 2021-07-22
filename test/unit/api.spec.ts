import { createApi } from '@goosewobbler/spectron/lib/api';

it('should pass', () => {
  expect(typeof createApi === 'function');
});
