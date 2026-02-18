import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useEffect } from 'react';

/**
 * Hook that provides actor readiness state for UI gating.
 * Wraps the immutable useActor hook to expose initialization status.
 */
export function useActorReadiness() {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing: identityInitializing } = useInternetIdentity();

  const isInitializing = isFetching || identityInitializing;
  const isReady = !!actor && !isFetching;
  const hasError = !isFetching && !actor;

  // Developer diagnostics for actor initialization
  useEffect(() => {
    if (isInitializing) {
      console.log('[ActorReadiness] Initializing actor...', {
        actorFetching: isFetching,
        identityInitializing,
        isAuthenticated: !!identity,
      });
    } else if (isReady) {
      console.log('[ActorReadiness] Actor ready', {
        isAuthenticated: !!identity,
        principalType: identity ? 'authenticated' : 'anonymous',
      });
    } else if (hasError) {
      console.error('[ActorReadiness] Actor initialization failed', {
        actorPresent: !!actor,
        isFetching,
      });
    }
  }, [isInitializing, isReady, hasError, isFetching, identityInitializing, identity, actor]);

  return {
    isInitializing,
    isReady,
    hasError,
    actor,
  };
}
