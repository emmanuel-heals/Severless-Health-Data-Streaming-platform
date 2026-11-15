import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { ConfigFields } from '@/components/forms/ConfigFields';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useToast } from '@/components/feedback/ToastProvider';
import { patientRegistrationFields } from '@/config/fieldSchemas';
import { buildSchema, emptyValues } from '@/lib/formSchema';
import type { ConfigFormValues } from '@/lib/formSchema';
import { useCreatePatient } from '@/hooks/usePatients';
import { patientName } from '@/lib/format';
import type { Patient } from '@/types/domain';
import type { ApiError } from '@/services/apiClient';

/**
 * Register a patient (UC-007, FR-021..024). Fields are config-driven (OI-01).
 * Ownership is assigned server-side from the practitioner's token — never sent by the client
 * (FR-024, BR-07). On success the system-generated patient ID is shown with next actions.
 */
export function RegisterPatient() {
  const schema = useMemo(() => buildSchema(patientRegistrationFields), []);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConfigFormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues(patientRegistrationFields) });

  const createPatient = useCreatePatient();
  const toast = useToast();
  const [created, setCreated] = useState<Patient | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: ConfigFormValues) {
    setFormError(null);
    // Drop empty optional fields so we don't persist blank strings.
    const fields = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
    try {
      const patient = await createPatient.mutateAsync({ fields });
      setCreated(patient);
      toast.success(`Patient registered — ${patientName(patient)}.`);
    } catch (e) {
      setFormError((e as ApiError).message ?? 'Could not register the patient.');
    }
  }

  if (created) {
    return (
      <>
        <PageHeader title="Patient registered" subtitle="The patient has been added to your practice" />
        <Card>
          <EmptyState
            icon="check"
            title={patientName(created)}
            description={`Patient ID ${created.patientId}. You can now record health measurements or view the medical record.`}
            action={
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <LinkButton to={`/practitioner/data-entry?patient=${encodeURIComponent(created.patientId)}`}>
                  Enter measurements
                </LinkButton>
                <LinkButton to={`/practitioner/patients/${encodeURIComponent(created.patientId)}`} variant="secondary">
                  View record
                </LinkButton>
                <Button
                  variant="ghost"
                  onClick={() => {
                    reset(emptyValues(patientRegistrationFields));
                    setCreated(null);
                  }}
                >
                  Register another
                </Button>
              </div>
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Register New Patient" subtitle="Add a new patient to your practice" />
      <Card style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

          <ConfigFields fields={patientRegistrationFields} register={register} errors={errors} idPrefix="patient" />

          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', marginTop: 0 }}>
            You are automatically recorded as this patient's practitioner.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <LinkButton to="/practitioner/patients" variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering…' : 'Register patient'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
