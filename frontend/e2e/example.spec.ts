import { test, expect } from '@playwright/test';

test('has title and renders app', async ({ page }) => {
  await page.goto('/');

  // Validamos que por lo menos levante la página correctamente
  await expect(page).toHaveTitle(/HackChain|App/i);
});