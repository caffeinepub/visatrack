import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VisaRecord, ApplicationStatus, UserProfile } from '../backend';
import { getApplicationStatusResult } from '../utils/getApplicationStatusResult';
import { normalizeApplicationKey } from '../utils/applicationStatusNormalization';

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

export function useCheckApplicationStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ applicationId, applicantEmail }: { applicationId: string; applicantEmail: string }) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] useCheckApplicationStatus: Starting mutation`);
      console.log(`[${timestamp}] Raw input:`, { applicationId, applicantEmail });

      if (!actor) {
        console.error(`[${timestamp}] Actor not available`);
        throw new Error('Actor not available');
      }

      const normalized = normalizeApplicationKey(applicationId, applicantEmail);
      console.log(`[${timestamp}] Normalized input:`, normalized);

      console.log(`[${timestamp}] Calling backend getApplicationStatus...`);
      const rawResult = await actor.getApplicationStatus(normalized.applicationId, normalized.applicantEmail);
      console.log(`[${timestamp}] Raw backend response:`, rawResult);

      if (rawResult && rawResult.attachment) {
        console.log(`[${timestamp}] Attachment present in raw response`);
        console.log(`[${timestamp}] Attachment bytes type:`, typeof rawResult.attachment.bytes);
        console.log(`[${timestamp}] Attachment bytes constructor:`, rawResult.attachment.bytes?.constructor?.name);
        console.log(`[${timestamp}] Attachment bytes length:`, rawResult.attachment.bytes?.length);
        if (rawResult.attachment.bytes && rawResult.attachment.bytes.length > 0) {
          const bytes = rawResult.attachment.bytes instanceof Uint8Array 
            ? rawResult.attachment.bytes 
            : new Uint8Array(rawResult.attachment.bytes);
          console.log(`[${timestamp}] First 10 bytes:`, Array.from(bytes.slice(0, 10)));
        }
      }

      const result = getApplicationStatusResult(rawResult);
      console.log(`[${timestamp}] Normalized result:`, result);

      if (result && result.attachment) {
        console.log(`[${timestamp}] Attachment present in normalized result`);
        console.log(`[${timestamp}] Normalized attachment bytes type:`, typeof result.attachment.bytes);
        console.log(`[${timestamp}] Normalized attachment bytes constructor:`, result.attachment.bytes?.constructor?.name);
        console.log(`[${timestamp}] Normalized attachment bytes length:`, result.attachment.bytes?.length);
      }

      return result;
    },
  });
}

export function useCreateOrUpdateApplicationStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: ApplicationStatus) => {
      if (!actor) throw new Error('Actor not available');
      const normalized = normalizeApplicationKey(status.applicationId, status.applicantEmail);
      const normalizedStatus = {
        ...status,
        applicationId: normalized.applicationId,
        applicantEmail: normalized.applicantEmail,
      };
      return actor.createOrUpdateApplicationStatus(normalizedStatus);
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
      const normalized = normalizeApplicationKey(applicationId, applicantEmail);
      return actor.deleteApplicationStatus(normalized.applicationId, normalized.applicantEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicationStatuses'] });
    },
  });
}
