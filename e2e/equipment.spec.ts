import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 1200 } });

test.describe('Equipment Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/equipment');
  });

  test('can add a new truck', async ({ page }) => {
    // Click "Add Trucks"
    await page.getByRole('button', { name: /add trucks/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /add new asset/i })).toBeVisible();

    // Fill form
    await modal.getByPlaceholder('TRK-001').fill('TRK-TEST-999');
    
    // Selects
    // 1st is Type, 2nd is Ownership, 3rd is Status
    await modal.locator('select').nth(0).selectOption('Truck');
    await modal.locator('select').nth(1).selectOption('owned');
    await modal.locator('select').nth(2).selectOption('active');

    await modal.getByPlaceholder('Freightliner').fill('Tesla');
    await modal.getByPlaceholder('Cascadia').fill('Semi');
    await modal.getByPlaceholder('2024').fill('2025');
    // Using nth match for placeholders if needed, but these seem unique enough locally
    await modal.getByPlaceholder('125000').fill('0');
    await modal.getByPlaceholder('1200').fill('0');

    // Submit
    await modal.getByRole('button', { name: 'Add Asset' }).click();

    // Verify toast
    await expect(page.getByText(/asset added successfully/i)).toBeVisible();

    // Verify it appears in list
    await expect(page.getByText('TRK-TEST-999')).toBeVisible();
    await expect(page.getByText('Tesla Semi')).toBeVisible();
  });

});
