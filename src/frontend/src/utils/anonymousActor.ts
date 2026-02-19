import { Actor, HttpAgent } from '@dfinity/agent';
import type { backendInterface } from '../backend';

let anonymousActorInstance: backendInterface | null = null;

/**
 * Creates or returns a cached anonymous actor for read-only operations.
 * This allows unauthenticated users to call query methods like getApplicationStatus.
 * 
 * Note: This uses dynamic import to load the config module which contains
 * the idlFactory and canisterId from the generated declarations.
 */
export async function getAnonymousActor(): Promise<backendInterface> {
  if (anonymousActorInstance) {
    return anonymousActorInstance;
  }

  try {
    // Dynamically import the config module to get createActorWithConfig
    // This avoids direct imports from declarations which may not exist at compile time
    const configModule = await import('../config');
    const createActorWithConfig = configModule.createActorWithConfig;

    // Create an anonymous actor (no identity provided)
    anonymousActorInstance = await createActorWithConfig();

    console.log('[AnonymousActor] Created anonymous actor successfully');
    return anonymousActorInstance;
  } catch (error) {
    console.error('[AnonymousActor] Failed to create anonymous actor:', error);
    throw new Error('Unable to initialize connection to the service. Please refresh the page and try again.');
  }
}

/**
 * Clears the cached anonymous actor instance.
 * Useful for testing or forcing recreation.
 */
export function clearAnonymousActor(): void {
  anonymousActorInstance = null;
}
