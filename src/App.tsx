import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GigList } from './pages/GigList';
import { GigDetails } from './pages/GigDetails';
import { NewGig } from './pages/NewGig';
import { BandMembers } from './pages/BandMembers';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { UserRoles } from './pages/UserRoles';
import { AuthProvider } from './context/AuthContext';
import { GigProvider } from './context/GigContext';
import { BandProvider } from './context/BandContext';
import { PrivateRouteWrapper } from './components/PrivateRouteWrapper';
import { Header } from './components/Header';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { YearOverview } from './pages/YearOverview';
import './i18n';

const AuthenticatedApp = ({ children }: { children: React.ReactNode }) => (
  <GigProvider>
    <BandProvider>
      <Header />
      <EmailVerificationBanner />
      {children}
    </BandProvider>
  </GigProvider>
);

const PrivateRouteWrapperWithApp = ({
  element,
  requireVerification,
}: {
  element: JSX.Element;
  requireVerification?: boolean;
}) => (
  <PrivateRouteWrapper element={<AuthenticatedApp>{element}</AuthenticatedApp>} requireVerification={requireVerification} />
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/"
            element={<PrivateRouteWrapperWithApp element={<Navigate to="/gigs" replace />} />}
          />
          <Route
            path="/gigs"
            element={<PrivateRouteWrapperWithApp element={<GigList />} />}
          />
          <Route
            path="/gigs/new"
            element={<PrivateRouteWrapperWithApp element={<NewGig />} requireVerification={true} />}
          />
          <Route
            path="/gig/:id"
            element={<PrivateRouteWrapperWithApp element={<GigDetails />} />}
          />
          <Route
            path="/band-members"
            element={<PrivateRouteWrapperWithApp element={<BandMembers />} />}
          />
          <Route
            path="/profile"
            element={<PrivateRouteWrapperWithApp element={<Profile />} />}
          />
          <Route
            path="/user-roles"
            element={<PrivateRouteWrapperWithApp element={<UserRoles />} />}
          />
          <Route
            path="/year-overview/:year"
            element={<PrivateRouteWrapperWithApp element={<YearOverview />} />}
          />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;