import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VisaRecord, UserProfile, ApplicationStatus } from '../backend';

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

// Application Status Queries
export function useCheckApplicationStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ applicationId, applicantEmail }: { applicationId: string; applicantEmail: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getApplicationStatus(applicationId, applicantEmail);
    },
  });
}

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
