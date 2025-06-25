
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

export const useAuth = () => {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();

  return {
    user: isSignedIn ? {
      id: user?.id,
      email: user?.emailAddresses[0]?.emailAddress,
      user_metadata: {
        first_name: user?.firstName,
        last_name: user?.lastName,
      }
    } : null,
    session: isSignedIn ? { user } : null,
    loading: !isLoaded,
    signOut: async () => {
      // Clerk handles sign out through their components
    }
  };
};
