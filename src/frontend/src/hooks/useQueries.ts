import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VisaRecord, ApplicationStatus, UserProfile } from '../backend';
import { getApplicationStatusResult } from '../utils/getApplicationStatusResult';
import { getAnonymousActor } from '../utils/anonymousActor';

// ====== User Profile Queries ======
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ====== Visa Record Queries ======
export function useGetVisaRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<VisaRecord[]>({
    queryKey: ['visaRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVisaRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateVisaRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: VisaRecord) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createVisaRecord(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visaRecords'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
    },
  });
}

export function useUpdateVisaRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, record }: { id: string; record: VisaRecord }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateVisaRecord(id, record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visaRecords'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
    },
  });
}

export function useDeleteVisaRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVisaRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visaRecords'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
    },
  });
}

export function useGetUpcomingReminders() {
  const { actor, isFetching } = useActor();

  return useQuery<VisaRecord[]>({
    queryKey: ['upcomingReminders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

// ====== Application Status Queries ======
export function useGetAllApplicationStatuses() {
  const { actor, isFetching } = useActor();

  return useQuery<ApplicationStatus[]>({
    queryKey: ['applicationStatuses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllApplicationStatuses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrUpdateApplicationStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: ApplicationStatus) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrUpdateApplicationStatus(status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicationStatuses'] });
    },
  });
}

export function useDeleteApplicationStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, applicantEmail }: { applicationId: string; applicantEmail: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteApplicationStatus(applicationId, applicantEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicationStatuses'] });
    },
  });
}

/**
 * Query hook for checking application status (supports both authenticated and anonymous users).
 * Uses anonymous actor fallback to allow public status checks without authentication.
 */
export function useCheckApplicationStatus(applicationId: string, applicantEmail: string, enabled: boolean = false) {
  const { actor: authenticatedActor, isFetching: actorFetching } = useActor();

  return useQuery<ApplicationStatus | null>({
    queryKey: ['checkApplicationStatus', applicationId, applicantEmail],
    queryFn: async () => {
      const timestamp = new Date().toISOString();
      console.log(`🔍 [useCheckApplicationStatus] ${timestamp} Query function called:`, {
        applicationId,
        applicantEmail,
        hasAuthenticatedActor: !!authenticatedActor,
        actorFetching,
      });

      // Try authenticated actor first, fall back to anonymous
      let actor = authenticatedActor;
      if (!actor) {
        console.log(`🔍 [useCheckApplicationStatus] ${timestamp} No authenticated actor, using anonymous actor`);
        actor = await getAnonymousActor();
      }

      if (!actor) {
        console.error(`❌ [useCheckApplicationStatus] ${timestamp} No actor available (authenticated or anonymous)`);
        throw new Error('Unable to connect to backend');
      }

      console.log(`🔍 [useCheckApplicationStatus] ${timestamp} Calling backend getApplicationStatus...`);
      const rawResult = await actor.getApplicationStatus(applicationId, applicantEmail);
      
      console.log(`🔍 [useCheckApplicationStatus] ${timestamp} Raw backend response:`, {
        hasResult: !!rawResult,
        resultType: rawResult ? typeof rawResult : 'null',
        applicationId: rawResult?.applicationId,
        status: rawResult?.status,
        hasAttachment: !!rawResult?.attachment,
        attachmentBytesLength: rawResult?.attachment?.bytes?.length || 0,
        attachmentBytesType: rawResult?.attachment?.bytes ? (rawResult.attachment.bytes instanceof Uint8Array ? 'Uint8Array' : Array.isArray(rawResult.attachment.bytes) ? 'Array' : typeof rawResult.attachment.bytes) : 'undefined',
      });

      if (rawResult?.attachment?.bytes) {
        const bytes = rawResult.attachment.bytes instanceof Uint8Array ? rawResult.attachment.bytes : new Uint8Array(rawResult.attachment.bytes);
        console.log(`🔍 [useCheckApplicationStatus] ${timestamp} Attachment bytes analysis:`, {
          firstTenBytes: Array.from(bytes.slice(0, 10)),
          lastTenBytes: Array.from(bytes.slice(-10)),
          headerString: String.fromCharCode(...Array.from(bytes.slice(0, 5))),
        });
      }

      const normalizedResult = getApplicationStatusResult(rawResult);
      
      console.log(`🔍 [useCheckApplicationStatus] ${timestamp} Normalized result:`, {
        hasResult: !!normalizedResult,
        applicationId: normalizedResult?.applicationId,
        status: normalizedResult?.status,
        hasAttachment: !!normalizedResult?.attachment,
        attachmentBytesLength: normalizedResult?.attachment?.bytes?.length || 0,
        attachmentBytesType: normalizedResult?.attachment?.bytes ? (normalizedResult.attachment.bytes instanceof Uint8Array ? 'Uint8Array' : 'other') : 'undefined',
      });

      return normalizedResult;
    },
    enabled: enabled && !actorFetching,
    retry: false,
    staleTime: 0,
  });
}
