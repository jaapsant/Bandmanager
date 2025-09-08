import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form on initial visit', async ({ page }) => {
    // Should show login form
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors
    await expect(page.locator('text="Email is required"')).toBeVisible();
    await expect(page.locator('text="Password is required"')).toBeVisible();
  });

  test('should show invalid email error', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.locator('button[type="submit"]').click();
    
    // Should show invalid email error
    await expect(page.locator('text="Please enter a valid email"')).toBeVisible();
  });

  test('should toggle between login and signup forms', async ({ page }) => {
    // Should start with login form
    await expect(page.locator('text="Sign In"')).toBeVisible();
    
    // Click to show signup form
    await page.locator('text="Don\'t have an account?"').click();
    await expect(page.locator('text="Sign Up"')).toBeVisible();
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
    
    // Click to go back to login
    await page.locator('text="Already have an account?"').click();
    await expect(page.locator('text="Sign In"')).toBeVisible();
  });

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button[aria-label="Toggle password visibility"]');
    
    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should handle signup form validation', async ({ page }) => {
    // Go to signup form
    await page.locator('text="Don\'t have an account?"').click();
    
    // Try to submit with short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[type="password"]', '123');
    await page.locator('button[type="submit"]').click();
    
    // Should show password strength error
    await expect(page.locator('text="Password must be at least 6 characters"')).toBeVisible();
  });

  test('should show loading state during authentication', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'validpassword123');
    
    // Submit form and check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show loading indicator
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('text="Signing in..."')).toBeVisible();
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Fill in credentials that will fail
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    // Should show error message
    await expect(page.locator('text="Invalid credentials"')).toBeVisible();
    
    // Form should be re-enabled
    await expect(page.locator('button[type="submit"]')).not.toBeDisabled();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Mock successful authentication by setting localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token');
    });
    
    // Navigate to protected route
    await page.goto('/dashboard');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text="Dashboard"')).toBeVisible();
  });

  test('should show email verification notice for unverified users', async ({ page }) => {
    // Mock unverified user state
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false
      }));
    });
    
    await page.reload();
    
    // Should show verification notice
    await expect(page.locator('text="Please verify your email"')).toBeVisible();
    await expect(page.locator('button:has-text("Resend Verification")')).toBeVisible();
  });

  test('should allow resending verification email', async ({ page }) => {
    // Mock unverified user state
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'test-uid', 
        email: 'test@example.com',
        emailVerified: false
      }));
    });
    
    await page.reload();
    
    // Click resend verification
    await page.locator('button:has-text("Resend Verification")').click();
    
    // Should show success message
    await expect(page.locator('text="Verification email sent"')).toBeVisible();
  });

  test('should handle logout correctly', async ({ page }) => {
    // Mock authenticated user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com', 
        emailVerified: true
      }));
    });
    
    await page.goto('/dashboard');
    
    // Click logout
    await page.locator('button:has-text("Sign Out")').click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // Local storage should be cleared
    const user = await page.evaluate(() => localStorage.getItem('user'));
    expect(user).toBeNull();
  });

  test('should protect routes that require authentication', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text="Please sign in to continue"')).toBeVisible();
  });

  test('should remember login state on page refresh', async ({ page }) => {
    // Mock authenticated user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: true
      }));
    });
    
    await page.goto('/dashboard');
    await expect(page.locator('text="Dashboard"')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('text="Dashboard"')).toBeVisible();
  });

  test('should show user profile information', async ({ page }) => {
    // Mock authenticated user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true
      }));
    });
    
    await page.goto('/profile');
    
    // Should show user information
    await expect(page.locator('text="test@example.com"')).toBeVisible();
    await expect(page.locator('text="Test User"')).toBeVisible();
    await expect(page.locator('text="Verified"')).toBeVisible();
  });
});