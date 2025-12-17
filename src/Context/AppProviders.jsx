import React from 'react';
import { UserProvider } from './UserContext';
import { CourseProvider } from './CourseContext';
import { LiveClassProvider } from './LiveClassContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { PaymentProvider } from './PaymentContext';
import { CouponProvider } from './CouponContext';
import { LoadingProvider } from './LoadingContext';
import ErrorBoundary from '../Components/ErrorBoundary/ErrorBoundary';

// Optimized provider composition to reduce nesting and improve performance
const AppProviders = ({ children }) => {
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <UserProvider>
          <CourseProvider>
            <LiveClassProvider>
              <SubscriptionProvider>
                <PaymentProvider>
                  <CouponProvider>
                    {children}
                  </CouponProvider>
                </PaymentProvider>
              </SubscriptionProvider>
            </LiveClassProvider>
          </CourseProvider>
        </UserProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
};

export default AppProviders;
