import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import { Navigation } from './Navigation';

// Mock @clerk/clerk-react
vi.mock('@clerk/clerk-react', () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>,
}));

// Mock react-router-dom Link
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children, className }: any) => (
      <a href={to} className={className} data-testid={`link-${to}`}>
        {children}
      </a>
    ),
  };
});

describe('Navigation', () => {
  it('should render the logo and brand name', () => {
    render(<Navigation />);
    
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Alarmfase 3')).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    render(<Navigation />);
    
    // Check for desktop navigation links (not mobile)
    const gigLink = screen.getAllByText('Gigs')[0]; // First one should be desktop
    const membersLink = screen.getAllByText('Members')[0];
    const settingsLink = screen.getAllByText('Settings')[0];
    
    expect(gigLink).toBeInTheDocument();
    expect(membersLink).toBeInTheDocument();
    expect(settingsLink).toBeInTheDocument();
  });

  it('should have correct link destinations', () => {
    render(<Navigation />);
    
    expect(screen.getAllByTestId('link-/gigs')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByTestId('link-/members')).toHaveLength(2);
    expect(screen.getAllByTestId('link-/settings')).toHaveLength(2);
    expect(screen.getByTestId('link-/')).toBeInTheDocument(); // Home link (only one)
  });

  it('should render mobile menu button', () => {
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle mobile menu when button is clicked', () => {
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Initially, mobile menu should be hidden
    const mobileNavContainer = screen.getByRole('navigation').querySelector('.sm\\:hidden.pb-3');
    expect(mobileNavContainer).toHaveClass('hidden');
    
    // Click to open mobile menu
    fireEvent.click(menuButton);
    expect(mobileNavContainer).toHaveClass('block');
    
    // Click to close mobile menu
    fireEvent.click(menuButton);
    expect(mobileNavContainer).toHaveClass('hidden');
  });

  it('should show menu icon when mobile menu is closed', () => {
    render(<Navigation />);
    
    // Check for Menu icon (lucide-menu class)
    const menuIcon = screen.getByRole('navigation').querySelector('.lucide-menu');
    expect(menuIcon).toBeInTheDocument();
  });

  it('should show X icon when mobile menu is open', () => {
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    // Check for X icon (lucide-x class)
    const closeIcon = screen.getByRole('navigation').querySelector('.lucide-x');
    expect(closeIcon).toBeInTheDocument();
  });

  it('should render UserButton in both desktop and mobile views', () => {
    render(<Navigation />);
    
    const userButtons = screen.getAllByTestId('user-button');
    expect(userButtons).toHaveLength(2); // One for desktop, one for mobile
  });

  it('should apply correct CSS classes for desktop navigation', () => {
    render(<Navigation />);
    
    const desktopGigLink = screen.getAllByTestId('link-/gigs')[0];
    expect(desktopGigLink).toHaveClass(
      'text-gray-700',
      'hover:text-gray-900',
      'px-3',
      'py-2',
      'text-sm',
      'font-medium'
    );
  });

  it('should apply correct CSS classes for mobile navigation', () => {
    render(<Navigation />);
    
    const mobileGigLink = screen.getAllByTestId('link-/gigs')[1]; // Second one is mobile
    expect(mobileGigLink).toHaveClass(
      'block',
      'px-3',
      'py-2',
      'text-base',
      'font-medium',
      'text-gray-700',
      'hover:bg-gray-100'
    );
  });

  it('should have accessible button with screen reader text', () => {
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    const srOnlyText = menuButton.querySelector('.sr-only');
    expect(srOnlyText).toHaveTextContent('Open main menu');
  });

  it('should have proper navigation structure', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-white', 'shadow');
    
    const container = nav.querySelector('.max-w-7xl');
    expect(container).toBeInTheDocument();
    
    const flexContainer = nav.querySelector('.flex.justify-between.h-16');
    expect(flexContainer).toBeInTheDocument();
  });

  it('should handle logo image correctly', () => {
    render(<Navigation />);
    
    const logo = screen.getByAltText('Logo');
    expect(logo).toHaveAttribute('src', '/logo.png');
    expect(logo).toHaveClass('h-8', 'w-auto');
  });

  it('should hide brand text on small screens', () => {
    render(<Navigation />);
    
    const brandText = screen.getByText('Alarmfase 3');
    expect(brandText).toHaveClass('hidden', 'sm:block');
  });
});