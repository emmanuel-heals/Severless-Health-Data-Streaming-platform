import { useMemo, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { Field, SelectInput, TextInput } from '@/components/forms/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/feedback/ToastProvider';
import { usePatients } from '@/hooks/usePatients';
import { useSubmitHealthData, useSubmissionStatus } from '@/hooks/useSubmissions';
import { measurementTypeByKey, measurementTypes } from '@/config/fieldSchemas';
import { env } from '@/config/env';
import { newIdempotencyKey, patientName } from '@/lib/format';
import type { Measurement } from '@/types/domain';
import type { ApiError } from '@/services/apiClient';
import styles from './dataentry.module.css';

interface MeasureRow {
  metric: string; // measurement type key — named "metric" to avoid clashing with RHF FieldError.type
  value: string;
}
interface FormValues {
  patientId: string;
  measurements: MeasureRow[];
}

/**
 * Health data entry + submission (UC-008/009/012, FR-030..038).
 * - Own patients only (the list is already scoped to the practitioner).
 * - Config-driven measurement rows (OI-02); optional document upload (OI-15, feature-flagged).
 * - A single idempotency key per attempt means a retried submit never duplicates (FR-038).
 * - "Received" is shown on acceptance into the stream; "Processed" only after the record lands.
 */
export function HealthDataEntry() {
  const [params] = useSearchParams();
  const presetPatient = params.get('patient') ?? '';
  const { data: patients, isLoading } = usePatients();
  const toast = useToast();

  const submit = useSubmitHealthData();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { data: submission } = useSubmissionStatus(submissionId);

  // One idempotency key per attempt; reused on retry, regenerated for a fresh submission.
  const idempotencyKey = useRef<string>(newIdempotencyKey());

  const [docs, setDocs] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { patientId: presetPatient, measurements: [{ metric: '', value: '' }] },
  });
  const watchedMeasurements = watch('measurements');
  const { fields, append, remove } = useFieldArray({ control, name: 'measurements' });

  const patientOptions = useMemo(() => patients ?? [], [patients]);

  function validate(values: FormValues): Measurement[] | null {
    clearErrors();
    setFormError(null);
    let ok = true;
    if (!values.patientId) {
      setError('patientId', { message: 'Select a patient.' });
      ok = false;
    }
    const measurements: Measurement[] = [];
    values.measurements.forEach((row, i) => {
      const hasType = !!row.metric;
      const hasValue = row.value.trim() !== '';
      if (!hasType && !hasValue) return; // blank row ignored
      if (hasType && !hasValue) {
        setError(`measurements.${i}.value`, { message: 'Enter a value.' });
        ok = false;
        return;
      }
      if (!hasType && hasValue) {
        setError(`measurements.${i}.metric`, { message: 'Choose a type.' });
        ok = false;
        return;
      }
      const num = Number(row.value);
      const def = measurementTypeByKey[row.metric];
      if (Number.isNaN(num)) {
        setError(`measurements.${i}.value`, { message: 'Enter a number.' });
        ok = false;
        return;
      }
      if (def?.min != null && num < def.min) {
        setError(`measurements.${i}.value`, { message: `Must be ${def.min} or more.` });
        ok = false;
        return;
      }
      if (def?.max != null && num > def.max) {
        setError(`measurements.${i}.value`, { message: `Must be ${def.max} or less.` });
        ok = false;
        return;
      }
      measurements.push({ type: row.metric, value: num, unit: def?.unit, measuredAt: new Date().toISOString() });
    });
    if (measurements.length === 0 && ok) {
      setFormError('Add at least one measurement before submitting.');
      ok = false;
    }
    return ok ? measurements : null;
  }

  async function onSubmit(values: FormValues) {
    const measurements = validate(values);
    if (!measurements) return;
    try {
      const sub = await submit.mutateAsync({
        input: {
          patientId: values.patientId,
          measurements,
          documentNames: env.features.documentUpload && docs.length ? docs.map((d) => d.name) : undefined,
        },
        idempotencyKey: idempotencyKey.current,
      });
      setSubmissionId(sub.submissionId);
      toast.success('Submission received and queued for processing.');
    } catch (e) {
      // Keep the same idempotency key so the user can safely retry (FR-038).
      setFormError((e as ApiError).message ?? 'Submission failed. Please try again.');
    }
  }

  function startAnother() {
    idempotencyKey.current = newIdempotencyKey(); // fresh attempt => fresh key
    setSubmissionId(null);
    setDocs([]);
    reset({ patientId: presetPatient, measurements: [{ metric: '', value: '' }] });
  }

  if (isLoading) return <FullPageLoader label="Loading…" />;

  if (patientOptions.length === 0) {
    return (
      <>
        <PageHeader title="Enter Health Measurements" subtitle="Record new health data for a patient" />
        <Card>
          <EmptyState
            title="No patients to record for"
            description="Register a patient first, then come back to enter their measurements."
            action={<LinkButton to="/practitioner/patients/register">Register patient</LinkButton>}
          />
        </Card>
      </>
    );
  }

  // Submission in progress / complete view.
  if (submissionId) {
    const status = submission?.status ?? 'received';
    const processed = status === 'processed';
    const failed = status === 'failed';
    return (
      <>
        <PageHeader title="Submission status" subtitle={`Reference ${submissionId}`} />
        <Card>
          <div className={styles.statusPanel}>
            <span className={styles.statusIcon} aria-hidden="true">
              <Icon name={processed ? 'check' : failed ? 'shield' : 'clock'} size={24} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                <strong style={{ fontSize: 'var(--text-lg)' }}>
                  {processed ? 'Processed' : failed ? 'Processing failed' : 'Received'}
                </strong>
                <StatusBadge status={status} />
              </div>
              <p style={{ color: 'var(--color-muted)', margin: 0 }}>
                {processed
                  ? 'The measurements have been processed into the patient’s record.'
                  : failed
                    ? 'The submission could not be processed. You can submit again.'
                    : 'Accepted into the processing stream. This updates automatically.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
            <LinkButton to={`/practitioner/patients/${encodeURIComponent(submission?.patientId ?? '')}`} variant="secondary">
              View patient record
            </LinkButton>
            <Button onClick={startAnother}>Submit more data</Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Enter Health Measurements" subtitle="Record new health data for a patient" />
      <Card style={{ maxWidth: 720 }}>
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

          <Field label="Patient" htmlFor="de-patient" required error={errors.patientId?.message}>
            <SelectInput id="de-patient" invalid={!!errors.patientId} defaultValue={presetPatient} {...register('patientId')}>
              <option value="" disabled>
                Select a patient…
              </option>
              {patientOptions.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {patientName(p)} · {p.patientId}
                </option>
              ))}
            </SelectInput>
          </Field>

          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 var(--space-3)' }}>
            <legend style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
              Measurements
            </legend>

            {fields.map((field, i) => {
              const typeErr = errors.measurements?.[i]?.metric?.message;
              const valErr = (errors.measurements?.[i]?.value as { message?: string } | undefined)?.message;
              return (
                <div key={field.id} className={styles.measureRow}>
                  <Field label="Type" htmlFor={`de-type-${i}`} error={typeErr}>
                    <SelectInput id={`de-type-${i}`} invalid={!!typeErr} defaultValue="" {...register(`measurements.${i}.metric`)}>
                      <option value="">Select…</option>
                      {measurementTypes.map((m) => (
                        <option key={m.type} value={m.type}>
                          {m.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Value" htmlFor={`de-value-${i}`} error={valErr}>
                    <TextInput id={`de-value-${i}`} type="number" step="any" inputMode="decimal" invalid={!!valErr} {...register(`measurements.${i}.value`)} />
                  </Field>
                  <span className={styles.unit}>{measurementTypeByKey[watchedMeasurements?.[i]?.metric]?.unit ?? ''}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    aria-label={`Remove measurement ${i + 1}`}
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              );
            })}

            <Button type="button" variant="ghost" onClick={() => append({ metric: '', value: '' })}>
              <Icon name="plus" size={16} /> Add measurement
            </Button>
          </fieldset>

          {env.features.documentUpload && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <label style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', marginBottom: 'var(--space-2)' }}>
                Supporting documents <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <div className={styles.dropzone}>
                <Icon name="upload" size={22} />
                <div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setDocs(Array.from(e.target.files ?? []))}
                    aria-label="Attach documents"
                  />
                </div>
              </div>
              {docs.length > 0 && (
                <ul className={styles.fileList}>
                  {docs.map((d, i) => (
                    <li key={`${d.name}-${i}`}>
                      <span>
                        <Icon name="file" size={14} /> {d.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
            <LinkButton to="/practitioner" variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit" disabled={isSubmitting || submit.isPending}>
              {isSubmitting || submit.isPending ? 'Submitting…' : 'Submit measurements'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
