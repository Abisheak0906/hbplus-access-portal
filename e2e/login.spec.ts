import { expect, test } from '@playwright/test';

test('login screen explains the authorized account and sign-in action', async ({
  page,
}) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Welcome to HB+')).toBeVisible();
  await expect(page.getByText('Continue with Google')).toBeVisible();
  await expect(
    page.getByText('Authorized accounts only · @hbplus.fit')
  ).toBeVisible();
});
