import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock providers for testing
const MockAuthProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

const MockGigProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

const MockBandProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

const MockMemberProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

// Custom render function with all providers
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BrowserRouter>
      <MockAuthProvider>
        <MockMemberProvider>
          <MockGigProvider>
            <MockBandProvider>
              {children}
            </MockBandProvider>
          </MockGigProvider>
        </MockMemberProvider>
      </MockAuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };