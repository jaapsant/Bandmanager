import React from 'react';
import { PrivateRoute } from './PrivateRoute';

interface PrivateRouteWrapperProps {
    element: React.ReactElement;
    requireVerification?: boolean;
}

export const PrivateRouteWrapper: React.FC<PrivateRouteWrapperProps> = ({ element, requireVerification }) => {
    return (
        <PrivateRoute requireVerification={requireVerification}>
            {element}
        </PrivateRoute>
    );
};