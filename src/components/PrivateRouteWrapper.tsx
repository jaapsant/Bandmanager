import React from 'react';
import { PrivateRoute } from './PrivateRoute';
import { AuthProvider } from '../context/AuthContext';
import { GigProvider } from '../context/GigContext';
import { BandProvider } from '../context/BandContext';
import { MemberProvider } from '../context/MemberContext';
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
                        <MemberProvider>
                            <EmailVerificationBanner /> {/* Conditionally render based on verification status */}
                            {element}
                        </MemberProvider>
                    </BandProvider>
                </GigProvider>
            </AuthProvider>
        </PrivateRoute>
    );
};