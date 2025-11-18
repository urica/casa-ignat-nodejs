const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Casa Ignat/);
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should navigate to services page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Servicii');
    await expect(page).toHaveURL(/.*servicii/);
  });

  test('should have working contact link', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Contact');
    await expect(page).toHaveURL(/.*contact/);
  });
});

test.describe('Contact Form', () => {
  test('should submit contact form successfully', async ({ page }) => {
    await page.goto('/contact');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message');

    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/contact');

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }
  });
});
