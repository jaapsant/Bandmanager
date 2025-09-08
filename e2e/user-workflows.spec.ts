import { test, expect } from '@playwright/test';

test.describe('Complete User Workflows', () => {
  
  test('Complete band manager workflow: signup to gig creation', async ({ page }) => {
    // 1. Navigate to app and sign up
    await page.goto('/');
    await page.locator('text="Don\'t have an account?"').click();
    
    // Fill signup form
    await page.fill('input[type="email"]', 'manager@example.com');
    await page.fill('input[placeholder*="name"]', 'Band Manager');
    await page.fill('input[type="password"]', 'securepassword123');
    await page.locator('button:has-text("Sign Up")').click();
    
    // 2. Mock successful signup and email verification
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'manager-uid',
        email: 'manager@example.com',
        displayName: 'Band Manager',
        emailVerified: true
      }));
      localStorage.setItem('roles', JSON.stringify({
        admin: false,
        bandManager: true,
        bandMember: true
      }));
    });
    
    // 3. Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text="Welcome, Band Manager"')).toBeVisible();
    
    // 4. Add band members
    await page.goto('/band');
    await page.locator('button:has-text("Add Member")').click();
    
    // Add first member
    await page.fill('input[placeholder*="Name"]', 'John Guitar');
    await page.selectOption('select[name="instrument"]', 'Guitar');
    await page.locator('button:has-text("Add Member")').last().click();
    await expect(page.locator('text="Member added successfully"')).toBeVisible();
    
    // Add second member
    await page.locator('button:has-text("Add Member")').click();
    await page.fill('input[placeholder*="Name"]', 'Jane Bass');
    await page.selectOption('select[name="instrument"]', 'Bass');
    await page.locator('button:has-text("Add Member")').last().click();
    await expect(page.locator('text="Member added successfully"')).toBeVisible();
    
    // 5. Create a gig
    await page.goto('/gigs');
    await page.locator('button:has-text("Add Gig")').click();
    
    await page.fill('input[name="name"]', 'Summer Festival');
    await page.fill('input[name="date"]', '2025-08-15');
    await page.fill('input[name="location"]', 'Central Park');
    await page.fill('input[name="pay"]', '1500');
    await page.fill('textarea[name="description"]', 'Annual summer music festival performance');
    
    // Set specific time
    await page.uncheck('input[name="isWholeDay"]');
    await page.fill('input[name="startTime"]', '19:00');
    await page.fill('input[name="endTime"]', '22:00');
    
    await page.locator('button:has-text("Create Gig")').click();
    await expect(page.locator('text="Gig created successfully"')).toBeVisible();
    
    // 6. Verify the complete workflow
    await expect(page.locator('text="Summer Festival"')).toBeVisible();
    await expect(page.locator('text="Central Park"')).toBeVisible();
    await expect(page.locator('text="€1,500"')).toBeVisible();
  });

  test('Band member availability workflow', async ({ page }) => {
    // Setup authenticated band member
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'member-uid',
        email: 'member@example.com',
        displayName: 'Band Member',
        emailVerified: true
      }));
      localStorage.setItem('roles', JSON.stringify({
        admin: false,
        bandManager: false,
        bandMember: true
      }));
      
      // Mock existing gigs
      window.mockGigs = [
        {
          id: 'gig1',
          name: 'Concert A',
          date: '2025-12-25',
          status: 'pending',
          memberAvailability: {}
        },
        {
          id: 'gig2',
          name: 'Wedding Gig',
          date: '2025-12-31',
          status: 'confirmed',
          memberAvailability: {}
        }
      ];
    });
    
    // 1. Navigate to gigs page
    await page.goto('/gigs');
    
    // 2. View first gig and set availability
    await page.locator('[data-testid="gig-gig1"]').click();
    await expect(page.locator('text="Concert A"')).toBeVisible();
    
    // Set as available
    await page.locator('[data-testid="availability-available"]').click();
    await expect(page.locator('text="Availability updated"')).toBeVisible();
    
    // Add notes about availability
    await page.fill('textarea[name="availabilityNotes"]', 'Can bring extra equipment');
    await page.check('input[name="canDrive"]');
    await page.locator('button:has-text("Save Notes")').click();
    
    // 3. View second gig and set different availability
    await page.goto('/gigs');
    await page.locator('[data-testid="gig-gig2"]').click();
    
    // Set as maybe with reason
    await page.locator('[data-testid="availability-maybe"]').click();
    await page.fill('textarea[name="availabilityNotes"]', 'Have family commitment, checking if can reschedule');
    await page.locator('button:has-text("Save Notes")').click();
    
    // 4. Check availability overview
    await page.goto('/dashboard');
    await expect(page.locator('text="Your Upcoming Gigs"')).toBeVisible();
    await expect(page.locator('[data-testid="availability-status-gig1"]')).toHaveClass(/available/);
    await expect(page.locator('[data-testid="availability-status-gig2"]')).toHaveClass(/maybe/);
  });

  test('Multi-language user experience workflow', async ({ page }) => {
    // Setup authenticated user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'user-uid',
        email: 'user@example.com',
        displayName: 'International User',
        emailVerified: true
      }));
    });
    
    // 1. Start with default language (English)
    await page.goto('/dashboard');
    await expect(page.locator('text="Dashboard"')).toBeVisible();
    
    // 2. Switch to Dutch
    await page.locator('[data-testid="language-switcher"]').click();
    await page.locator('text="Nederlands"').click();
    
    // Should see Dutch translations
    await expect(page.locator('text="Dashboard"')).not.toBeVisible();
    await expect(page.locator('text="Overzicht"')).toBeVisible();
    
    // 3. Navigate through app in Dutch
    await page.goto('/gigs');
    await expect(page.locator('text="Optredens"')).toBeVisible();
    
    await page.goto('/band');
    await expect(page.locator('text="Bandleden"')).toBeVisible();
    
    // 4. Switch back to English
    await page.locator('[data-testid="language-switcher"]').click();
    await page.locator('text="English"').click();
    
    // Should be back to English
    await expect(page.locator('text="Band Members"')).toBeVisible();
  });

  test('Mobile responsive workflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Setup authenticated user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'mobile-user',
        email: 'mobile@example.com',
        displayName: 'Mobile User',
        emailVerified: true
      }));
    });
    
    // 1. Navigate to app on mobile
    await page.goto('/dashboard');
    
    // Mobile navigation should be collapsed
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
    
    // 2. Open mobile menu
    await page.locator('[data-testid="mobile-menu-button"]').click();
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // 3. Navigate to gigs via mobile menu
    await page.locator('text="Gigs"').click();
    await expect(page).toHaveURL(/.*gigs/);
    
    // 4. Test mobile gig creation
    await page.locator('button:has-text("Add Gig")').click();
    
    // Modal should be fullscreen on mobile
    await expect(page.locator('[role="dialog"]')).toHaveClass(/mobile-fullscreen/);
    
    // Fill form on mobile
    await page.fill('input[name="name"]', 'Mobile Gig');
    await page.fill('input[name="date"]', '2025-09-15');
    await page.locator('button:has-text("Create Gig")').click();
    
    await expect(page.locator('text="Gig created successfully"')).toBeVisible();
  });

  test('Error handling and recovery workflow', async ({ page }) => {
    // Setup authenticated user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'user-uid',
        email: 'user@example.com',
        displayName: 'Test User',
        emailVerified: true
      }));
    });
    
    // 1. Test network error handling
    await page.goto('/gigs');
    
    // Simulate network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    // Try to create a gig
    await page.locator('button:has-text("Add Gig")').click();
    await page.fill('input[name="name"]', 'Test Gig');
    await page.fill('input[name="date"]', '2025-12-25');
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should show error message
    await expect(page.locator('text="Network error"')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    
    // 2. Test recovery after network restoration
    await page.unroute('**/api/**');
    
    // Retry the action
    await page.locator('button:has-text("Retry")').click();
    await expect(page.locator('text="Gig created successfully"')).toBeVisible();
    
    // 3. Test form validation error recovery
    await page.locator('button:has-text("Add Gig")').click();
    
    // Submit invalid form
    await page.fill('input[name="name"]', '');
    await page.fill('input[name="date"]', '2020-01-01'); // Past date
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should show validation errors
    await expect(page.locator('text="Name is required"')).toBeVisible();
    await expect(page.locator('text="Cannot create gig in the past"')).toBeVisible();
    
    // Fix errors
    await page.fill('input[name="name"]', 'Fixed Gig');
    await page.fill('input[name="date"]', '2025-12-31');
    await page.locator('button:has-text("Create Gig")').click();
    
    await expect(page.locator('text="Gig created successfully"')).toBeVisible();
  });

  test('Data persistence workflow', async ({ page }) => {
    // 1. Create initial data
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'persistence-user',
        email: 'persist@example.com',
        displayName: 'Persistence User',
        emailVerified: true
      }));
    });
    
    await page.goto('/gigs');
    
    // Create a gig
    await page.locator('button:has-text("Add Gig")').click();
    await page.fill('input[name="name"]', 'Persistence Test Gig');
    await page.fill('input[name="date"]', '2025-11-11');
    await page.locator('button:has-text("Create Gig")').click();
    
    await expect(page.locator('text="Gig created successfully"')).toBeVisible();
    await expect(page.locator('text="Persistence Test Gig"')).toBeVisible();
    
    // 2. Refresh page to test persistence
    await page.reload();
    
    // Data should still be there
    await expect(page.locator('text="Persistence Test Gig"')).toBeVisible();
    
    // 3. Navigate away and back
    await page.goto('/band');
    await page.goto('/gigs');
    
    // Data should still be there
    await expect(page.locator('text="Persistence Test Gig"')).toBeVisible();
    
    // 4. Test offline/online behavior
    await page.context().setOffline(true);
    
    // Should show offline indicator
    await expect(page.locator('text="Offline"')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    await expect(page.locator('text="Online"')).toBeVisible();
  });

  test('Permission-based workflow transitions', async ({ page }) => {
    // 1. Start as regular band member
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'transition-user',
        email: 'transition@example.com',
        displayName: 'Transition User',
        emailVerified: true
      }));
      localStorage.setItem('roles', JSON.stringify({
        admin: false,
        bandManager: false,
        bandMember: true
      }));
    });
    
    await page.goto('/band');
    
    // Should have limited permissions
    await expect(page.locator('button:has-text("Add Member")')).not.toBeVisible();
    await expect(page.locator('text="View Only"')).toBeVisible();
    
    // 2. Simulate promotion to band manager
    await page.evaluate(() => {
      localStorage.setItem('roles', JSON.stringify({
        admin: false,
        bandManager: true,
        bandMember: true
      }));
    });
    
    await page.reload();
    
    // Should now have manager permissions
    await expect(page.locator('button:has-text("Add Member")')).toBeVisible();
    await expect(page.locator('text="View Only"')).not.toBeVisible();
    
    // 3. Test new permissions by adding member
    await page.locator('button:has-text("Add Member")').click();
    await page.fill('input[placeholder*="Name"]', 'New Member');
    await page.selectOption('select[name="instrument"]', 'Drums');
    await page.locator('button:has-text("Add Member")').last().click();
    
    await expect(page.locator('text="Member added successfully"')).toBeVisible();
    
    // 4. Navigate to gigs with new permissions
    await page.goto('/gigs');
    await expect(page.locator('button:has-text("Add Gig")')).toBeVisible();
  });

  test('Complete onboarding workflow for new user', async ({ page }) => {
    // 1. First visit - should see welcome/onboarding
    await page.goto('/');
    
    // 2. Sign up process
    await page.locator('text="Don\'t have an account?"').click();
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[placeholder*="name"]', 'New User');
    await page.fill('input[type="password"]', 'newuserpass123');
    await page.locator('button:has-text("Sign Up")').click();
    
    // 3. Mock successful registration
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        displayName: 'New User',
        emailVerified: true
      }));
      localStorage.setItem('isNewUser', 'true');
    });
    
    // 4. Should see onboarding flow
    await page.goto('/onboarding');
    await expect(page.locator('text="Welcome to Band Manager"')).toBeVisible();
    
    // Complete onboarding steps
    // Step 1: Profile setup
    await page.fill('input[name="bandName"]', 'My Awesome Band');
    await page.selectOption('select[name="genre"]', 'rock');
    await page.locator('button:has-text("Next")').click();
    
    // Step 2: Role selection
    await page.locator('text="Band Manager"').click();
    await page.locator('button:has-text("Next")').click();
    
    // Step 3: Initial setup
    await page.check('input[name="createSampleData"]');
    await page.locator('button:has-text("Complete Setup")').click();
    
    // 5. Should redirect to dashboard with sample data
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text="Welcome to your new band management dashboard"')).toBeVisible();
    
    // Should have sample gigs and members
    await page.goto('/gigs');
    await expect(page.locator('text="Sample Concert"')).toBeVisible();
    
    await page.goto('/band');
    await expect(page.locator('text="Sample Guitarist"')).toBeVisible();
  });
});