import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, TextInput } from '@/components/forms/FormField';
import { Button } from '@/components/ui/Button';
import { useCreateAccount } from '@/hooks/useAccounts';
import type { CreatableRole } from '@/services/accountsApi';
import type { ApiError } from '@/services/apiClient';
import { useToast } from '@/components/feedback/ToastProvider';

const schema = z.object({
  name: z.string().trim().min(1, 'Full name is required.').max(120, 'Name is too long.'),
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
});

type FormValues = z.infer<typeof schema>;

const ROLE_LABEL: Record<CreatableRole, string> = {
  practitioner: 'Health Practitioner',
  analyst: 'Health Analyst',
};

/**
 * Create a Practitioner or Analyst (FR-011/012/013/014). The role is fixed by the
 * caller (which "Create…" button was pressed) — sys_admin is never creatable (FR-019).
 * Client validation is for usability; the server re-validates (FR-013, AC-06).
 */
export function CreateAccountForm({ role, onDone, onCancel }: { role: CreatableRole; onDone: () => void; onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '' } });
  const createAccount = useCreateAccount();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const account = await createAccount.mutateAsync({ ...values, role });
      toast.success(`${ROLE_LABEL[role]} account created. An invitation was sent to ${account.email}.`);
      onDone();
    } catch (e) {
      const err = e as ApiError;
      // Map server field errors back into the form (e.g. duplicate email — AC-06).
      if (err.fieldErrors) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          if (field === 'name' || field === 'email') setError(field, { message });
        }
      } else {
        setFormError(err.message ?? 'Could not create the account.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p style={{ color: 'var(--color-muted)', marginTop: 0 }}>
        Creating a <strong>{ROLE_LABEL[role]}</strong> account. The user receives an email invitation
        and must set a password at first sign-in.
      </p>

      {formError && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {formError}
        </div>
      )}

      <Field label="Full name" htmlFor="acc-name" required error={errors.name?.message}>
        <TextInput id="acc-name" data-autofocus invalid={!!errors.name} placeholder="e.g. Dr. Sarah Johnson" {...register('name')} />
      </Field>

      <Field label="Email" htmlFor="acc-email" required error={errors.email?.message}>
        <TextInput id="acc-email" type="email" invalid={!!errors.email} placeholder="name@organization.org" {...register('email')} />
      </Field>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : `Create ${ROLE_LABEL[role]}`}
        </Button>
      </div>
    </form>
  );
}
