import React from 'react';
import { PrivateRoute } from './PrivateRoute';
import { AuthProvider } from '../context/AuthContext';
import { GigProvider } from '../context/GigContext';
import { BandProvider } from '../context/BandContext';
import { EmailVerificationBanner } from '../components/EmailVerificationBanner';

interface PrivateRouteWrapperProps {
    element: React.ReactElement;
    requireVerification?: boolean;
}

export const PrivateRouteWrapper: React.FC<PrivateRouteWrapperProps> = ({ element, requireVerification }) => {
    return (
        <PrivateRoute requireVerification={requireVerification}>
            <AuthProvider>
                <GigProvider>
                    <BandProvider>
                        <EmailVerificationBanner /> {/* Conditionally render based on verification status */}
                        {element}
                    </BandProvider>
                </GigProvider>
            </AuthProvider>
        </PrivateRoute>
    );
};