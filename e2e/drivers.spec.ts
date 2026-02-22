import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 1200 } });

test.describe('Drivers Management', () => {

  const mockDriver = {
    id: 'driver-123',
    name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    driver_code: 'JD123',
    employee_id: 'EMP-123',
    status: 'Active',
    risk_score: 85,
    terminal: 'New York',
    email: 'john.doe@example.com',
    phone: '555-0123',
    license_number: 'DL123456',
    license_state: 'NY',
    image: 'https://via.placeholder.com/150'
  };

  test.beforeEach(async ({ page }) => {
    // Mock API
    await page.route('**/rest/v1/drivers*', async route => {
      const request = route.request();
      if (request.method() === 'GET') {
        const url = new URL(request.url());
        // Simple filter check (optional)
        
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockDriver]),
            headers: {
                'content-range': '0-0/1'
            }
        });
      } else if (request.method() === 'POST') {
        const data = request.postDataJSON();
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'new-driver-id', ...data }])
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/drivers');
  });

  test('displays driver list', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('EMP-123')).toBeVisible();
    await expect(page.getByText('New York')).toBeVisible();
  });

  test('can add a new driver', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Driver' }).first().click();
    
    // Wait for modal to appear
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /add new driver/i })).toBeVisible();

    // Fill the form
    await modal.getByPlaceholder('John').fill('Alice');
    await modal.getByPlaceholder('Doe').fill('Wonderland');
    await modal.getByPlaceholder('123 Main St, City, State').fill('123 Rabbit Hole');
    await modal.getByPlaceholder('XXX-XX-XXXX').fill('123-45-6789');
    await modal.getByPlaceholder('(555) 123-4567').fill('555-555-5555');
    await modal.getByPlaceholder('DRV-001').fill('AW001');
    
    // Terminal Select
    await modal.locator('select').selectOption('Detroit');

    await modal.getByPlaceholder('Manager Name').fill('Mad Hatter');
    
    await modal.getByPlaceholder('DL-12345678').fill('DL-999999');
    await modal.getByPlaceholder('TX').fill('CA');
    
    // Set dates
    // Note: Playwright date input filling format depends on browser locale, but YYYY-MM-DD usually works
    await page.locator('input[type="date"]').nth(0).fill('2024-01-01'); // License Expiration
    await page.locator('input[type="date"]').nth(1).fill('2023-01-01'); // Medical Issue
    await page.locator('input[type="date"]').nth(2).fill('2024-01-01'); // Medical Exp
    await page.locator('input[type="date"]').nth(3).fill('2023-01-01'); // Hire Date

    const submitBtn = modal.getByRole('button', { name: 'Add Driver' });
    await submitBtn.click();

    // Verify success message
    // If successful, the modal should close and we might see a toast.
    // Since we mocked the POST response to success, the app should treat it as success.
    // toast.success('Driver added successfully') might be called.
    await expect(page.getByText(/success/i)).toBeVisible();
  });

});
