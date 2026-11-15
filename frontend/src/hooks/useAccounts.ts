import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsService } from '@/services/accountsApi';
import type { CreateAccountInput } from '@/services/accountsApi';
import type { UserAccount } from '@/types/domain';

const ACCOUNTS_KEY = ['accounts'] as const;

export function useAccounts() {
  return useQuery<UserAccount[]>({
    queryKey: ACCOUNTS_KEY,
    queryFn: () => accountsService.list(),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useDeactivateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => accountsService.deactivate(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}
