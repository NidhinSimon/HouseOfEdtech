import { test, expect } from '@playwright/test';

test('landing page loads correctly with topbar and footer', async ({ page }) => {
  // Navigate to the index page
  await page.goto('/');

  // Check if the Topbar logo is visible
  await expect(page.locator('text=Applywise').first()).toBeVisible();

  // Check if the Footer contains the author name
  await expect(page.locator('footer').first()).toContainText('Built by Nidhi');
  
  // Check if the Footer contains the GitHub link
  const githubLink = page.locator('footer a', { hasText: 'GitHub Profile' }).first();
  await expect(githubLink).toBeVisible();
  await expect(githubLink).toHaveAttribute('href', 'https://github.com/nidhi');
});
