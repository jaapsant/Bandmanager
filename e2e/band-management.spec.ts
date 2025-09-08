import { test, expect } from '@playwright/test';

test.describe('Band Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated band manager
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
    
    await page.goto('/band');
  });

  test('should display band members page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Band Members")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Member")')).toBeVisible();
  });

  test('should show add member modal', async ({ page }) => {
    await page.locator('button:has-text("Add Member")').click();
    
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text="Add Band Member"')).toBeVisible();
    await expect(page.locator('input[placeholder*="Name"]')).toBeVisible();
    await expect(page.locator('select[name="instrument"]')).toBeVisible();
  });

  test('should add a new band member', async ({ page }) => {
    // Open add member modal
    await page.locator('button:has-text("Add Member")').click();
    
    // Fill in member details
    await page.fill('input[placeholder*="Name"]', 'John Doe');
    await page.selectOption('select[name="instrument"]', 'Guitar');
    
    // Submit form
    await page.locator('button:has-text("Add Member")').last().click();
    
    // Should show success message
    await expect(page.locator('text="Member added successfully"')).toBeVisible();
    
    // Member should appear in the list
    await expect(page.locator('text="John Doe"')).toBeVisible();
    await expect(page.locator('text="Guitar"')).toBeVisible();
  });

  test('should validate member form', async ({ page }) => {
    await page.locator('button:has-text("Add Member")').click();
    
    // Try to submit empty form
    await page.locator('button:has-text("Add Member")').last().click();
    
    // Should show validation errors
    await expect(page.locator('text="Name is required"')).toBeVisible();
    await expect(page.locator('text="Please select an instrument"')).toBeVisible();
  });

  test('should edit band member information', async ({ page }) => {
    // Assume there's already a member (mock data or added in previous test)
    await page.evaluate(() => {
      // Mock existing member data
      window.mockBandMembers = [
        { id: 'member1', name: 'Jane Smith', instrument: 'Bass' }
      ];
    });
    
    await page.reload();
    
    // Click edit button for first member
    await page.locator('[data-testid="edit-member-member1"]').click();
    
    // Edit modal should open
    await expect(page.locator('text="Edit Band Member"')).toBeVisible();
    
    // Update member information
    await page.fill('input[value="Jane Smith"]', 'Jane Doe');
    await page.selectOption('select[name="instrument"]', 'Drums');
    
    // Save changes
    await page.locator('button:has-text("Save Changes")').click();
    
    // Should show success message
    await expect(page.locator('text="Member updated successfully"')).toBeVisible();
    
    // Updated information should be visible
    await expect(page.locator('text="Jane Doe"')).toBeVisible();
    await expect(page.locator('text="Drums"')).toBeVisible();
  });

  test('should remove band member with confirmation', async ({ page }) => {
    // Mock existing member
    await page.evaluate(() => {
      window.mockBandMembers = [
        { id: 'member1', name: 'John Doe', instrument: 'Guitar' }
      ];
    });
    
    await page.reload();
    
    // Click remove button
    await page.locator('[data-testid="remove-member-member1"]').click();
    
    // Confirmation dialog should appear
    await expect(page.locator('text="Are you sure?"')).toBeVisible();
    await expect(page.locator('text="This action cannot be undone"')).toBeVisible();
    
    // Confirm removal
    await page.locator('button:has-text("Remove")').click();
    
    // Member should be removed
    await expect(page.locator('text="Member removed successfully"')).toBeVisible();
    await expect(page.locator('text="John Doe"')).not.toBeVisible();
  });

  test('should cancel member removal', async ({ page }) => {
    // Mock existing member
    await page.evaluate(() => {
      window.mockBandMembers = [
        { id: 'member1', name: 'John Doe', instrument: 'Guitar' }
      ];
    });
    
    await page.reload();
    
    // Click remove button
    await page.locator('[data-testid="remove-member-member1"]').click();
    
    // Cancel removal
    await page.locator('button:has-text("Cancel")').click();
    
    // Member should still be visible
    await expect(page.locator('text="John Doe"')).toBeVisible();
  });

  test('should manage instruments', async ({ page }) => {
    // Navigate to instruments section
    await page.locator('text="Instruments"').click();
    
    // Should show instruments management
    await expect(page.locator('h2:has-text("Instruments")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Instrument")')).toBeVisible();
  });

  test('should add new instrument', async ({ page }) => {
    await page.locator('text="Instruments"').click();
    await page.locator('button:has-text("Add Instrument")').click();
    
    // Fill in instrument name
    await page.fill('input[placeholder*="instrument"]', 'Saxophone');
    
    // Submit
    await page.locator('button:has-text("Add")').click();
    
    // Should show success and new instrument
    await expect(page.locator('text="Instrument added successfully"')).toBeVisible();
    await expect(page.locator('text="Saxophone"')).toBeVisible();
  });

  test('should prevent removing instrument in use', async ({ page }) => {
    // Mock instrument in use
    await page.evaluate(() => {
      window.mockInstruments = ['Guitar', 'Bass'];
      window.mockBandMembers = [
        { id: 'member1', name: 'John Doe', instrument: 'Guitar' }
      ];
    });
    
    await page.reload();
    await page.locator('text="Instruments"').click();
    
    // Try to remove instrument in use
    await page.locator('[data-testid="remove-instrument-Guitar"]').click();
    
    // Should show error message
    await expect(page.locator('text="Cannot remove instrument that is in use"')).toBeVisible();
  });

  test('should show member availability overview', async ({ page }) => {
    // Mock members and gigs
    await page.evaluate(() => {
      window.mockBandMembers = [
        { id: 'member1', name: 'John Doe', instrument: 'Guitar' },
        { id: 'member2', name: 'Jane Smith', instrument: 'Bass' }
      ];
      window.mockGigs = [
        {
          id: 'gig1',
          name: 'Concert A',
          date: '2025-12-25',
          memberAvailability: {
            'member1': { status: 'available' },
            'member2': { status: 'unavailable' }
          }
        }
      ];
    });
    
    await page.reload();
    
    // Should show availability overview
    await expect(page.locator('text="Availability Overview"')).toBeVisible();
    await expect(page.locator('[data-testid="availability-member1"]')).toHaveClass(/available/);
    await expect(page.locator('[data-testid="availability-member2"]')).toHaveClass(/unavailable/);
  });

  test('should filter members by instrument', async ({ page }) => {
    // Mock multiple members with different instruments
    await page.evaluate(() => {
      window.mockBandMembers = [
        { id: 'member1', name: 'John Doe', instrument: 'Guitar' },
        { id: 'member2', name: 'Jane Smith', instrument: 'Bass' },
        { id: 'member3', name: 'Bob Wilson', instrument: 'Drums' }
      ];
    });
    
    await page.reload();
    
    // Filter by instrument
    await page.selectOption('select[name="instrumentFilter"]', 'Guitar');
    
    // Should only show guitar players
    await expect(page.locator('text="John Doe"')).toBeVisible();
    await expect(page.locator('text="Jane Smith"')).not.toBeVisible();
    await expect(page.locator('text="Bob Wilson"')).not.toBeVisible();
  });

  test('should search members by name', async ({ page }) => {
    // Mock multiple members
    await page.evaluate(() => {
      window.mockBandMembers = [
        { id: 'member1', name: 'John Doe', instrument: 'Guitar' },
        { id: 'member2', name: 'Jane Smith', instrument: 'Bass' }
      ];
    });
    
    await page.reload();
    
    // Search for specific member
    await page.fill('input[placeholder*="Search"]', 'Jane');
    
    // Should only show matching member
    await expect(page.locator('text="Jane Smith"')).toBeVisible();
    await expect(page.locator('text="John Doe"')).not.toBeVisible();
  });

  test('should handle permission restrictions for regular members', async ({ page }) => {
    // Mock regular band member (not manager)
    await page.evaluate(() => {
      localStorage.setItem('roles', JSON.stringify({
        admin: false,
        bandManager: false,
        bandMember: true
      }));
    });
    
    await page.reload();
    
    // Should not show management buttons
    await expect(page.locator('button:has-text("Add Member")')).not.toBeVisible();
    await expect(page.locator('[data-testid^="remove-member"]')).not.toBeVisible();
    
    // Should show read-only view
    await expect(page.locator('text="View Only"')).toBeVisible();
  });

  test('should update member profile information', async ({ page }) => {
    // Navigate to own profile
    await page.goto('/profile');
    
    // Update display name
    await page.locator('button:has-text("Edit Profile")').click();
    await page.fill('input[name="displayName"]', 'Updated Name');
    await page.locator('button:has-text("Save")').click();
    
    // Should show success message
    await expect(page.locator('text="Profile updated successfully"')).toBeVisible();
    await expect(page.locator('text="Updated Name"')).toBeVisible();
  });

  test('should handle member sync with authentication data', async ({ page }) => {
    // Mock user with updated display name
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'manager-uid',
        email: 'manager@example.com',
        displayName: 'New Display Name',
        emailVerified: true
      }));
    });
    
    await page.reload();
    
    // Should show updated name in member list
    await expect(page.locator('text="New Display Name"')).toBeVisible();
  });
});