import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for and dismiss toast notifications
 */
export async function waitForToast(page: Page, message?: string) {
  if (message) {
    await expect(page.locator(`text="${message}"`)).toBeVisible();
  } else {
    await expect(page.locator('[data-testid="toast"]')).toBeVisible();
  }
  
  // Wait for toast to disappear
  await page.waitForTimeout(3000);
}

/**
 * Fill form fields with error handling
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
    // Small delay between fields to allow for real-time validation
    await page.waitForTimeout(100);
  }
}

/**
 * Wait for modal to open
 */
export async function waitForModal(page: Page, title?: string) {
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  
  if (title) {
    await expect(page.locator(`text="${title}"`)).toBeVisible();
  }
}

/**
 * Wait for modal to close
 */
export async function waitForModalClose(page: Page) {
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Click and wait for navigation
 */
export async function clickAndNavigate(page: Page, selector: string, expectedUrl?: string) {
  await page.locator(selector).click();
  
  if (expectedUrl) {
    await expect(page).toHaveURL(new RegExp(expectedUrl));
  }
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
}

/**
 * Select option with error handling
 */
export async function selectOption(page: Page, selector: string, value: string) {
  await page.selectOption(selector, value);
  await page.waitForTimeout(100);
}

/**
 * Check checkbox with verification
 */
export async function checkCheckbox(page: Page, selector: string, checked: boolean = true) {
  const checkbox = page.locator(selector);
  
  if (checked) {
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  } else {
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  }
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading indicators to disappear
  await page.waitForSelector('[data-testid="loading"]', { state: 'detached' });
  await page.waitForSelector('text="Loading..."', { state: 'detached' });
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `e2e/screenshots/${name}-${timestamp}.png` });
}

/**
 * Assert page contains text
 */
export async function expectTextVisible(page: Page, text: string, timeout: number = 5000) {
  await expect(page.locator(`text="${text}"`)).toBeVisible({ timeout });
}

/**
 * Assert page does not contain text
 */
export async function expectTextNotVisible(page: Page, text: string, timeout: number = 5000) {
  await expect(page.locator(`text="${text}"`)).not.toBeVisible({ timeout });
}

/**
 * Wait for network requests to complete
 */
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Hover over element
 */
export async function hoverElement(page: Page, selector: string) {
  await page.locator(selector).hover();
  await page.waitForTimeout(500);
}

/**
 * Double click element
 */
export async function doubleClickElement(page: Page, selector: string) {
  await page.locator(selector).dblclick();
  await page.waitForTimeout(200);
}

/**
 * Right click element
 */
export async function rightClickElement(page: Page, selector: string) {
  await page.locator(selector).click({ button: 'right' });
  await page.waitForTimeout(200);
}

/**
 * Press keyboard shortcut
 */
export async function pressShortcut(page: Page, shortcut: string) {
  await page.keyboard.press(shortcut);
  await page.waitForTimeout(200);
}

/**
 * Drag and drop
 */
export async function dragAndDrop(page: Page, sourceSelector: string, targetSelector: string) {
  await page.locator(sourceSelector).dragTo(page.locator(targetSelector));
  await page.waitForTimeout(500);
}

/**
 * Retry action with timeout
 */
export async function retryAction(action: () => Promise<void>, maxAttempts: number = 3) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      await action();
      return;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Wait for element to be stable (not moving)
 */
export async function waitForElementStable(page: Page, selector: string) {
  const element = page.locator(selector);
  let previousPosition = await element.boundingBox();
  
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(100);
    const currentPosition = await element.boundingBox();
    
    if (
      previousPosition &&
      currentPosition &&
      previousPosition.x === currentPosition.x &&
      previousPosition.y === currentPosition.y
    ) {
      return;
    }
    
    previousPosition = currentPosition;
  }
}