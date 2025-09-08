import { test, expect } from '@playwright/test';

test.describe('Gig Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user with proper roles
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'user-uid',
        email: 'user@example.com',
        displayName: 'Test User',
        emailVerified: true
      }));
      localStorage.setItem('roles', JSON.stringify({
        admin: false,
        bandManager: true,
        bandMember: true
      }));
    });
    
    await page.goto('/gigs');
  });

  test('should display gigs page with calendar view', async ({ page }) => {
    await expect(page.locator('h1:has-text("Gigs")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Gig")')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
  });

  test('should switch between calendar views', async ({ page }) => {
    // Should default to month view
    await expect(page.locator('button:has-text("Month")').first()).toHaveClass(/active/);
    
    // Switch to week view
    await page.locator('button:has-text("Week")').click();
    await expect(page.locator('button:has-text("Week")')).toHaveClass(/active/);
    
    // Switch to day view
    await page.locator('button:has-text("Day")').click();
    await expect(page.locator('button:has-text("Day")')).toHaveClass(/active/);
  });

  test('should open add gig modal', async ({ page }) => {
    await page.locator('button:has-text("Add Gig")').click();
    
    // Modal should be visible with form fields
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text="Add New Gig"')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('input[name="location"]')).toBeVisible();
  });

  test('should create a new gig successfully', async ({ page }) => {
    await page.locator('button:has-text("Add Gig")').click();
    
    // Fill in gig details
    await page.fill('input[name="name"]', 'New Year Concert');
    await page.fill('input[name="date"]', '2025-12-31');
    await page.fill('input[name="location"]', 'City Hall');
    await page.fill('textarea[name="description"]', 'End of year celebration concert');
    await page.fill('input[name="pay"]', '1000');
    
    // Set time details
    await page.uncheck('input[name="isWholeDay"]');
    await page.fill('input[name="startTime"]', '20:00');
    await page.fill('input[name="endTime"]', '23:00');
    
    // Submit form
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should show success message and close modal
    await expect(page.locator('text="Gig created successfully"')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Gig should appear in calendar
    await expect(page.locator('text="New Year Concert"')).toBeVisible();
  });

  test('should validate gig form inputs', async ({ page }) => {
    await page.locator('button:has-text("Add Gig")').click();
    
    // Try to submit empty form
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should show validation errors
    await expect(page.locator('text="Name is required"')).toBeVisible();
    await expect(page.locator('text="Date is required"')).toBeVisible();
  });

  test('should prevent creating gig in the past', async ({ page }) => {
    await page.locator('button:has-text("Add Gig")').click();
    
    // Fill with past date
    await page.fill('input[name="name"]', 'Past Gig');
    await page.fill('input[name="date"]', '2020-01-01');
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should show validation error
    await expect(page.locator('text="Cannot create gig in the past"')).toBeVisible();
  });

  test('should validate time range for timed gigs', async ({ page }) => {
    await page.locator('button:has-text("Add Gig")').click();
    
    // Fill basic details
    await page.fill('input[name="name"]', 'Test Gig');
    await page.fill('input[name="date"]', '2025-12-31');
    
    // Set invalid time range (end before start)
    await page.uncheck('input[name="isWholeDay"]');
    await page.fill('input[name="startTime"]', '22:00');
    await page.fill('input[name="endTime"]', '20:00');
    
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should show time validation error
    await expect(page.locator('text="End time must be after start time"')).toBeVisible();
  });

  test('should edit existing gig', async ({ page }) => {
    // Mock existing gig
    await page.evaluate(() => {
      window.mockGigs = [
        {
          id: 'gig1',
          name: 'Original Gig',
          date: '2025-12-25',
          location: 'Original Location',
          status: 'pending'
        }
      ];
    });
    
    await page.reload();
    
    // Click on gig to edit
    await page.locator('[data-testid="gig-gig1"]').click();
    await page.locator('button:has-text("Edit")').click();
    
    // Edit gig details
    await page.fill('input[name="name"]', 'Updated Gig Name');
    await page.fill('input[name="location"]', 'New Location');
    
    // Save changes
    await page.locator('button:has-text("Save Changes")').click();
    
    // Should show success message
    await expect(page.locator('text="Gig updated successfully"')).toBeVisible();
    await expect(page.locator('text="Updated Gig Name"')).toBeVisible();
  });

  test('should manage member availability for gigs', async ({ page }) => {
    // Mock gig and members
    await page.evaluate(() => {
      window.mockGigs = [
        { id: 'gig1', name: 'Test Gig', date: '2025-12-25', status: 'pending' }
      ];
      window.mockBandMembers = [
        { id: 'member1', name: 'John Doe', instrument: 'Guitar' },
        { id: 'member2', name: 'Jane Smith', instrument: 'Bass' }
      ];
    });
    
    await page.reload();
    
    // Open gig details
    await page.locator('[data-testid="gig-gig1"]').click();
    
    // Should show member availability section
    await expect(page.locator('text="Member Availability"')).toBeVisible();
    await expect(page.locator('text="John Doe"')).toBeVisible();
    await expect(page.locator('text="Jane Smith"')).toBeVisible();
    
    // Set availability for member
    await page.locator('[data-testid="availability-member1-available"]').click();
    await expect(page.locator('text="Availability updated"')).toBeVisible();
  });

  test('should show availability overview for gigs', async ({ page }) => {
    // Mock gig with availability data
    await page.evaluate(() => {
      window.mockGigs = [
        {
          id: 'gig1',
          name: 'Test Gig',
          date: '2025-12-25',
          memberAvailability: {
            'member1': { status: 'available', canDrive: true },
            'member2': { status: 'unavailable', canDrive: false },
            'member3': { status: 'maybe', canDrive: true }
          }
        }
      ];
    });
    
    await page.reload();
    
    // Should show availability overview
    await expect(page.locator('[data-testid="availability-overview-gig1"]')).toBeVisible();
    
    // Should show availability counts
    await expect(page.locator('text="2 Available"')).toBeVisible();
    await expect(page.locator('text="1 Unavailable"')).toBeVisible();
    await expect(page.locator('text="1 Maybe"')).toBeVisible();
  });

  test('should update gig status', async ({ page }) => {
    // Mock pending gig
    await page.evaluate(() => {
      window.mockGigs = [
        { id: 'gig1', name: 'Test Gig', date: '2025-12-25', status: 'pending' }
      ];
    });
    
    await page.reload();
    
    // Open gig details
    await page.locator('[data-testid="gig-gig1"]').click();
    
    // Change status to confirmed
    await page.selectOption('select[name="status"]', 'confirmed');
    await page.locator('button:has-text("Update Status")').click();
    
    // Should show success message and updated status
    await expect(page.locator('text="Status updated successfully"')).toBeVisible();
    await expect(page.locator('text="Confirmed"')).toBeVisible();
  });

  test('should delete gig with confirmation', async ({ page }) => {
    // Mock existing gig
    await page.evaluate(() => {
      window.mockGigs = [
        { id: 'gig1', name: 'Test Gig', date: '2025-12-25', status: 'pending' }
      ];
    });
    
    await page.reload();
    
    // Open gig details and delete
    await page.locator('[data-testid="gig-gig1"]').click();
    await page.locator('button:has-text("Delete")').click();
    
    // Should show confirmation dialog
    await expect(page.locator('text="Are you sure?"')).toBeVisible();
    await expect(page.locator('text="This will permanently delete the gig"')).toBeVisible();
    
    // Confirm deletion
    await page.locator('button:has-text("Delete Gig")').click();
    
    // Should show success message and remove gig
    await expect(page.locator('text="Gig deleted successfully"')).toBeVisible();
    await expect(page.locator('text="Test Gig"')).not.toBeVisible();
  });

  test('should export gig to calendar', async ({ page }) => {
    // Mock existing gig
    await page.evaluate(() => {
      window.mockGigs = [
        {
          id: 'gig1',
          name: 'Concert',
          date: '2025-12-25',
          startTime: '20:00',
          endTime: '23:00',
          location: 'City Hall'
        }
      ];
    });
    
    await page.reload();
    
    // Open gig details
    await page.locator('[data-testid="gig-gig1"]').click();
    
    // Should show export options
    await expect(page.locator('button:has-text("Export to Calendar")')).toBeVisible();
    
    // Click export and check dropdown
    await page.locator('button:has-text("Export to Calendar")').click();
    await expect(page.locator('text="Google Calendar"')).toBeVisible();
    await expect(page.locator('text="Outlook Calendar"')).toBeVisible();
    await expect(page.locator('text="Download ICS"')).toBeVisible();
  });

  test('should filter gigs by status', async ({ page }) => {
    // Mock gigs with different statuses
    await page.evaluate(() => {
      window.mockGigs = [
        { id: 'gig1', name: 'Pending Gig', date: '2025-12-25', status: 'pending' },
        { id: 'gig2', name: 'Confirmed Gig', date: '2025-12-26', status: 'confirmed' },
        { id: 'gig3', name: 'Completed Gig', date: '2025-12-27', status: 'completed' }
      ];
    });
    
    await page.reload();
    
    // Filter by confirmed status
    await page.selectOption('select[name="statusFilter"]', 'confirmed');
    
    // Should only show confirmed gigs
    await expect(page.locator('text="Confirmed Gig"')).toBeVisible();
    await expect(page.locator('text="Pending Gig"')).not.toBeVisible();
    await expect(page.locator('text="Completed Gig"')).not.toBeVisible();
  });

  test('should search gigs by name', async ({ page }) => {
    // Mock multiple gigs
    await page.evaluate(() => {
      window.mockGigs = [
        { id: 'gig1', name: 'Rock Concert', date: '2025-12-25', status: 'pending' },
        { id: 'gig2', name: 'Jazz Evening', date: '2025-12-26', status: 'confirmed' }
      ];
    });
    
    await page.reload();
    
    // Search for specific gig
    await page.fill('input[placeholder*="Search gigs"]', 'Jazz');
    
    // Should only show matching gig
    await expect(page.locator('text="Jazz Evening"')).toBeVisible();
    await expect(page.locator('text="Rock Concert"')).not.toBeVisible();
  });

  test('should handle automatic status updates for past gigs', async ({ page }) => {
    // Mock confirmed gig in the past
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    await page.evaluate(({ date }) => {
      window.mockGigs = [
        { id: 'gig1', name: 'Past Gig', date, status: 'confirmed' }
      ];
    }, { date: yesterdayString });
    
    await page.reload();
    
    // Should automatically update to completed
    await expect(page.locator('text="Completed"')).toBeVisible();
  });

  test('should show gig statistics', async ({ page }) => {
    // Mock gigs with various data
    await page.evaluate(() => {
      window.mockGigs = [
        { id: 'gig1', status: 'pending', pay: 500 },
        { id: 'gig2', status: 'confirmed', pay: 800 },
        { id: 'gig3', status: 'completed', pay: 600 }
      ];
    });
    
    await page.reload();
    
    // Navigate to statistics view
    await page.locator('button:has-text("Statistics")').click();
    
    // Should show gig stats
    await expect(page.locator('text="Total Gigs: 3"')).toBeVisible();
    await expect(page.locator('text="Total Revenue: €1,900"')).toBeVisible();
    await expect(page.locator('text="Completed: 1"')).toBeVisible();
  });

  test('should handle multi-date gigs', async ({ page }) => {
    await page.locator('button:has-text("Add Gig")').click();
    
    // Fill basic details
    await page.fill('input[name="name"]', 'Festival Weekend');
    await page.fill('input[name="startDate"]', '2025-07-18');
    
    // Enable multi-day
    await page.check('input[name="isMultiDay"]');
    await page.fill('input[name="endDate"]', '2025-07-20');
    
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should create multi-day gig
    await expect(page.locator('text="Gig created successfully"')).toBeVisible();
    await expect(page.locator('text="Festival Weekend"')).toBeVisible();
    await expect(page.locator('text="3 days"')).toBeVisible();
  });

  test('should require email verification for gig operations', async ({ page }) => {
    // Mock unverified user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        uid: 'user-uid',
        email: 'user@example.com',
        displayName: 'Test User',
        emailVerified: false
      }));
    });
    
    await page.reload();
    
    // Try to create gig
    await page.locator('button:has-text("Add Gig")').click();
    await page.fill('input[name="name"]', 'Test Gig');
    await page.fill('input[name="date"]', '2025-12-31');
    await page.locator('button:has-text("Create Gig")').click();
    
    // Should show verification error
    await expect(page.locator('text="Please verify your email"')).toBeVisible();
  });
});