import { expect, test } from '@playwright/test';

test('anonymous visits to admin routes are redirected to login', async ({
  page,
}) => {
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByText('Continue with Google')).toBeVisible();

  await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByText('Authorized accounts only · @hbplus.fit')).toBeVisible();
});
