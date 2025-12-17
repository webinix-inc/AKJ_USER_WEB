// Utility for handling enrollment status synchronization

let syncInterval = null;
let isAuthenticated = false;

// Start periodic enrollment sync
export const startEnrollmentSync = (reloadProfile, intervalMs = 60000) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  console.log('🔄 Starting enrollment sync every', intervalMs / 1000, 'seconds');
  
  syncInterval = setInterval(() => {
    if (isAuthenticated && document.visibilityState === 'visible') {
      console.log('🔄 Periodic enrollment sync...');
      reloadProfile();
      
      // Emit global profile update event
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { reason: 'periodic_sync', timestamp: Date.now() } 
        }));
      }
    }
  }, intervalMs);
};

// Stop periodic enrollment sync
export const stopEnrollmentSync = () => {
  if (syncInterval) {
    console.log('🛑 Stopping enrollment sync');
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

// Update authentication status
export const setAuthenticationStatus = (authenticated) => {
  isAuthenticated = authenticated;
  
  if (!authenticated) {
    stopEnrollmentSync();
  }
};

// Manual enrollment sync trigger
export const triggerEnrollmentSync = (reloadProfile, reason = 'manual') => {
  console.log('🔄 Manual enrollment sync triggered:', reason);
  reloadProfile();
  
  // Emit global profile update event
  if (window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('profileUpdated', { 
      detail: { reason, timestamp: Date.now() } 
    }));
  }
};

// Handle page visibility changes
export const setupVisibilitySync = (reloadProfile) => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isAuthenticated) {
      console.log('🔄 Page became visible, syncing enrollment...');
      triggerEnrollmentSync(reloadProfile, 'visibility_change');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};
