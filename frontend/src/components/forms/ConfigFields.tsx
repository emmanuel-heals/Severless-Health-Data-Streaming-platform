/*
 * Renders a config-driven FieldDef[] as labelled inputs wired to react-hook-form.
 * Used wherever the SRS leaves a field list "To Be Confirmed" (OI-01/OI-02/OI-17), so adding a
 * confirmed field is a one-line config change rather than a form edit.
 */
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { FieldDef } from '@/config/fieldSchemas';
import { Field, SelectInput, TextInput } from './FormField';

// Values are a flat string map; the specific shape is supplied by the parent form.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyValues = Record<string, any>;

export function ConfigFields({
  fields,
  register,
  errors,
  idPrefix,
}: {
  fields: FieldDef[];
  register: UseFormRegister<AnyValues>;
  errors: FieldErrors<AnyValues>;
  idPrefix: string;
}) {
  return (
    <>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.name}`;
        const err = errors[f.name]?.message as string | undefined;
        return (
          <Field key={f.name} label={f.label} htmlFor={id} required={f.required} error={err}>
            {f.type === 'select' ? (
              <SelectInput id={id} invalid={!!err} defaultValue="" {...register(f.name)}>
                <option value="" disabled>
                  Select…
                </option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectInput>
            ) : (
              <TextInput
                id={id}
                type={f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                invalid={!!err}
                placeholder={f.placeholder}
                {...register(f.name)}
              />
            )}
          </Field>
        );
      })}
    </>
  );
}
