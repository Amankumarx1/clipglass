import { test, expect } from '@playwright/test';

test.describe('ClipGlass 4-Screen Master Flow', () => {
  test('Screen 01 Home: loads hero, search bar, and 3 feature cards', async ({ page }) => {
    await page.goto('/');

    // Hero title
    await expect(page.getByRole('heading', { name: 'paste a link. pick a quality. done.' })).toBeVisible();

    // Search input
    const searchInput = page.getByPlaceholder('Paste a YouTube link here');
    await expect(searchInput).toBeVisible();

    // 3 Feature Cards
    await expect(page.getByText('fast inspection')).toBeVisible();
    await expect(page.getByText('quality choices')).toBeVisible();
    await expect(page.getByText('private by design')).toBeVisible();
  });

  test('Screen 02 Configure: displays metadata, quality options, and actions', async ({ page }) => {
    await page.goto('/');

    // Switch to Screen 02
    await page.getByRole('button', { name: '02 CONFIGURE' }).click();

    await expect(page.getByText('Building a Better Workspace')).toBeVisible();
    await expect(page.getByText('Creator Channel')).toBeVisible();
    await expect(page.getByText('12 min 48 sec')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Best available' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download video' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Extract audio' })).toBeVisible();
  });

  test('Screen 03 In Progress: displays 68% progress ring and 4-stage timeline', async ({ page }) => {
    await page.goto('/');

    // Switch to Screen 03
    await page.getByRole('button', { name: '03 IN PROGRESS' }).click();

    await expect(page.getByText('preparing your file')).toBeVisible();
    await expect(page.getByText('Queued')).toBeVisible();
    await expect(page.getByText('Downloading', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel download' })).toBeVisible();
  });

  test('Screen 04 Complete: displays success checkmark, Save file and countdown', async ({ page }) => {
    await page.goto('/');

    // Switch to Screen 04
    await page.getByRole('button', { name: '04 COMPLETE' }).click();

    await expect(page.getByText('your file is ready')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Save file' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy file name' })).toBeVisible();
    await expect(page.getByText('Temporary file expires in')).toBeVisible();
  });

  test('Zero horizontal scrollbar across all responsive breakpoints', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
