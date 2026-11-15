import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { submissionsService } from '@/services/submissionsApi';
import type { SubmitInput } from '@/services/submissionsApi';
import type { Submission } from '@/types/domain';

export function useSubmitHealthData() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: SubmitInput; idempotencyKey: string }) =>
      submissionsService.submit(input, idempotencyKey),
    onSuccess: (sub) => {
      // Refresh the affected patient's history and the practitioner's list once accepted.
      qc.invalidateQueries({ queryKey: ['patient-history', user?.userId, sub.patientId] });
      qc.invalidateQueries({ queryKey: ['patients', user?.userId] });
    },
  });
}

/**
 * Poll a submission's processing status (received -> processed | failed). Polling stops
 * automatically once the submission leaves the "received" state.
 */
export function useSubmissionStatus(submissionId: string | null) {
  return useQuery<Submission | null>({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionsService.get(submissionId as string),
    enabled: !!submissionId,
    refetchInterval: (query) => (query.state.data?.status === 'received' ? 1500 : false),
  });
}
