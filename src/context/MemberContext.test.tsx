import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MemberProvider, useMembers } from './MemberContext';

// Test component that uses MemberContext
const TestComponent = () => {
  const { members } = useMembers();

  return (
    <div>
      <div data-testid="members-count">{members.length}</div>
      
      <div data-testid="members-list">
        {members.map(member => (
          <div key={member.id} data-testid={`member-${member.id}`}>
            {member.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom render for these specific tests
const renderWithMemberProvider = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <MemberProvider>{ui}</MemberProvider>
    </BrowserRouter>
  );
};

describe('MemberContext', () => {
  it('should provide empty members array initially', () => {
    renderWithMemberProvider(<TestComponent />);
    
    expect(screen.getByTestId('members-count')).toHaveTextContent('0');
  });

  it('should render members list container', () => {
    renderWithMemberProvider(<TestComponent />);
    
    expect(screen.getByTestId('members-list')).toBeInTheDocument();
  });

  it('should provide context interface', () => {
    const TestContextInterface = () => {
      const context = useMembers();
      
      return (
        <div data-testid="context-available">
          {typeof context === 'object' && context.members ? 'Available' : 'Not Available'}
        </div>
      );
    };

    renderWithMemberProvider(<TestContextInterface />);
    
    expect(screen.getByTestId('context-available')).toHaveTextContent('Available');
  });

  it('should handle useMembers hook outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // This should work since MemberContext doesn't check for provider context
    // (it provides a default value in createContext)
    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();
    
    consoleErrorSpy.mockRestore();
  });

  it('should provide consistent context value', () => {
    const TestConsistency = () => {
      const context1 = useMembers();
      const context2 = useMembers();
      
      return (
        <div data-testid="consistency-check">
          {context1 === context2 ? 'Same Reference' : 'Different References'}
        </div>
      );
    };

    renderWithMemberProvider(<TestConsistency />);
    
    // The context should provide the same reference
    expect(screen.getByTestId('consistency-check')).toHaveTextContent('Same Reference');
  });
});