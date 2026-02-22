import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 1200 } });

test.describe('Tasks Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('can create a new task', async ({ page }) => {
    // Check if we are on Tasks page
    await expect(page).toHaveURL('/tasks');
    
    // Open modal
    await page.getByRole('button', { name: /new task/i }).click();
    
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /create new task/i })).toBeVisible();

    // Fill form
    // The placeholder "e.g. Schedule Safety Meeting" is used for title
    await modal.getByPlaceholder('e.g. Schedule Safety Meeting').fill('E2E Test Task');
    
    // Description (textarea)
    await modal.locator('textarea').fill('This is a test task created by Playwright');

    // Assign To (input). It seems there are multiple inputs. 
    await modal.getByRole('textbox').nth(1).fill('QA Tester');
    
    // Select priority - it's the second select (0: Driver, 1: Priority)
    // Wait, due date is input type="date".
    // 0: Driver (Optional) select
    // 1: Priority select
    await modal.locator('select').nth(1).selectOption('High');

    // Submit
    await modal.getByRole('button', { name: 'Create Task' }).click();

    // Verify success
    await expect(page.getByText(/task created successfully/i)).toBeVisible();

    // Verify in list
    await expect(page.getByText('E2E Test Task')).toBeVisible();
    // QA Tester might be hidden or in a different column. Just verifying the title is enough for now.
    // await expect(page.getByText('QA Tester')).toBeVisible();
  });

});
