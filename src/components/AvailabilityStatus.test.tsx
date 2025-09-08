import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import { AvailabilityStatus } from './AvailabilityStatus';

describe('AvailabilityStatus', () => {
  it('should render available status with check icon', () => {
    const { container } = render(<AvailabilityStatus status="available" />);
    
    const checkIcon = container.querySelector('.lucide-check');
    expect(checkIcon).toBeInTheDocument();
    expect(checkIcon).toHaveClass('text-green-500');
  });

  it('should render unavailable status with X icon', () => {
    const { container } = render(<AvailabilityStatus status="unavailable" />);
    
    const xIcon = container.querySelector('.lucide-x');
    expect(xIcon).toBeInTheDocument();
    expect(xIcon).toHaveClass('text-red-500');
  });

  it('should render maybe status with help circle icon', () => {
    const { container } = render(<AvailabilityStatus status="maybe" />);
    
    const helpIcon = container.querySelector('.lucide-help-circle');
    expect(helpIcon).toBeInTheDocument();
    expect(helpIcon).toHaveClass('text-yellow-500');
  });

  it('should render default gray circle for undefined status', () => {
    const { container } = render(<AvailabilityStatus />);
    
    const defaultElement = container.querySelector('.bg-gray-200');
    expect(defaultElement).toBeInTheDocument();
    expect(defaultElement).toHaveClass('rounded-full');
  });

  it('should apply small size classes when size is sm', () => {
    const { container } = render(<AvailabilityStatus status="available" size="sm" />);
    
    const icon = container.querySelector('.lucide-check');
    expect(icon).toHaveClass('w-4', 'h-4');
  });

  it('should apply medium size classes by default', () => {
    const { container } = render(<AvailabilityStatus status="available" />);
    
    const icon = container.querySelector('.lucide-check');
    expect(icon).toHaveClass('w-5', 'h-5');
  });

  it('should apply medium size classes when size is md', () => {
    const { container } = render(<AvailabilityStatus status="available" size="md" />);
    
    const icon = container.querySelector('.lucide-check');
    expect(icon).toHaveClass('w-5', 'h-5');
  });

  it('should apply correct size to default gray circle', () => {
    const { container } = render(<AvailabilityStatus size="sm" />);
    
    const defaultElement = container.querySelector('.bg-gray-200');
    expect(defaultElement).toHaveClass('w-4', 'h-4');
  });
});