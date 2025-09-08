import { Page } from '@playwright/test';

export interface TestUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

export interface TestRoles {
  admin: boolean;
  bandManager: boolean;
  bandMember: boolean;
}

/**
 * Mock an authenticated user with specific roles
 */
export async function loginAs(page: Page, user: TestUser, roles: TestRoles = {
  admin: false,
  bandManager: false,
  bandMember: true
}) {
  await page.evaluate(({ user, roles }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('roles', JSON.stringify(roles));
  }, { user, roles });
}

/**
 * Mock a band manager user
 */
export async function loginAsBandManager(page: Page) {
  const user: TestUser = {
    uid: 'manager-uid',
    email: 'manager@example.com',
    displayName: 'Band Manager',
    emailVerified: true
  };
  
  const roles: TestRoles = {
    admin: false,
    bandManager: true,
    bandMember: true
  };
  
  await loginAs(page, user, roles);
}

/**
 * Mock a regular band member user
 */
export async function loginAsBandMember(page: Page) {
  const user: TestUser = {
    uid: 'member-uid',
    email: 'member@example.com',
    displayName: 'Band Member',
    emailVerified: true
  };
  
  const roles: TestRoles = {
    admin: false,
    bandManager: false,
    bandMember: true
  };
  
  await loginAs(page, user, roles);
}

/**
 * Mock an admin user
 */
export async function loginAsAdmin(page: Page) {
  const user: TestUser = {
    uid: 'admin-uid',
    email: 'admin@example.com',
    displayName: 'Admin User',
    emailVerified: true
  };
  
  const roles: TestRoles = {
    admin: true,
    bandManager: true,
    bandMember: true
  };
  
  await loginAs(page, user, roles);
}

/**
 * Mock an unverified user
 */
export async function loginAsUnverifiedUser(page: Page) {
  const user: TestUser = {
    uid: 'unverified-uid',
    email: 'unverified@example.com',
    displayName: 'Unverified User',
    emailVerified: false
  };
  
  const roles: TestRoles = {
    admin: false,
    bandManager: false,
    bandMember: true
  };
  
  await loginAs(page, user, roles);
}

/**
 * Clear authentication state
 */
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    localStorage.removeItem('auth-token');
  });
}

/**
 * Wait for authentication state to be loaded
 */
export async function waitForAuthLoad(page: Page) {
  // Wait for the loading state to finish
  await page.waitForSelector('[data-testid="loading"]', { state: 'detached' });
}

/**
 * Assert user is authenticated
 */
export async function expectAuthenticated(page: Page, userEmail?: string) {
  if (userEmail) {
    await page.waitForSelector(`text="${userEmail}"`, { timeout: 5000 });
  } else {
    // Check for any sign of authenticated state (e.g., logout button, user menu)
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 5000 });
  }
}

/**
 * Assert user is not authenticated
 */
export async function expectUnauthenticated(page: Page) {
  // Should see login form or be redirected to login
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
}