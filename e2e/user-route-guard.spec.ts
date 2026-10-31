import { expect, test } from '@playwright/test';

test('anonymous visits to the root and user dashboard end at login', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByText('Continue with Google')).toBeVisible();

  await page.goto('/user/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByText('Welcome to HB+')).toBeVisible();
});
