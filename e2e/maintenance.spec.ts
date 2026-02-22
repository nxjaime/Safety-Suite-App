import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 1200 } });

test.describe('Maintenance & Work Orders', () => {

  test.beforeEach(async ({ page }) => {
    // Common setup
  });

  test('Maintenance page displays templates', async ({ page }) => {
    await page.goto('/maintenance');
    await expect(page).toHaveURL('/maintenance');
    await expect(page.getByRole('heading', { name: /maintenance control/i })).toBeVisible();
    
    // Check for "New Template" button
    await expect(page.getByRole('button', { name: /new template/i })).toBeVisible();

    // Check for some table headers
    await expect(page.getByText('Active Templates')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Quarterly Service' })).toBeVisible();
  });

  test('Work Orders page displays orders', async ({ page }) => {
    await page.goto('/work-orders');
    await expect(page).toHaveURL('/work-orders');
    await expect(page.getByRole('heading', { name: /work order command/i })).toBeVisible();

    // Check for "New Work Order" button
    await expect(page.getByRole('button', { name: /new work order/i })).toBeVisible();

    // Check for table content
    await expect(page.getByRole('cell', { name: 'WO-1001' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Brake inspection' })).toBeVisible();
  });

});
