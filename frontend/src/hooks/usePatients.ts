import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { patientsService } from '@/services/patientsApi';
import type { CreatePatientInput, PatientCtx, PatientHistory } from '@/services/patientsApi';
import type { Patient } from '@/types/domain';

/** The signed-in practitioner's context. Mock uses it to emulate server-side scoping. */
function usePractitionerCtx(): PatientCtx {
  const { user } = useAuth();
  return { practitionerId: user?.userId ?? '' };
}

export function usePatients() {
  const ctx = usePractitionerCtx();
  return useQuery<Patient[]>({
    queryKey: ['patients', ctx.practitionerId],
    queryFn: () => patientsService.list(ctx),
    enabled: !!ctx.practitionerId,
  });
}

export function usePatient(patientId: string | undefined) {
  const ctx = usePractitionerCtx();
  return useQuery<Patient | null>({
    queryKey: ['patient', ctx.practitionerId, patientId],
    queryFn: () => patientsService.get(patientId as string, ctx),
    enabled: !!ctx.practitionerId && !!patientId,
  });
}

export function usePatientHistory(patientId: string | undefined) {
  const ctx = usePractitionerCtx();
  return useQuery<PatientHistory | null>({
    queryKey: ['patient-history', ctx.practitionerId, patientId],
    queryFn: () => patientsService.history(patientId as string, ctx),
    enabled: !!ctx.practitionerId && !!patientId,
  });
}

export function useCreatePatient() {
  const ctx = usePractitionerCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatientInput) => patientsService.create(input, ctx),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients', ctx.practitionerId] }),
  });
}
