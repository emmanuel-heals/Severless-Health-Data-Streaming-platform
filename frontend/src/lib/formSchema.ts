/*
 * Build a Zod schema from a config-driven FieldDef[] (OI-01/OI-02/OI-17).
 * Client-side validation is for usability only — the backend re-validates everything
 * (FR-013, FR-022, FR-032). Keeping this generic means adding a confirmed TBC field is a
 * config change, not a form rewrite.
 */
import { z } from 'zod';
import type { FieldDef } from '@/config/fieldSchemas';

export type ConfigFormValues = Record<string, string>;

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  // All config fields are captured as strings from inputs; coercion happens at the service edge.
  let s = z.string().trim();

  if (f.type === 'email') {
    s = f.required
      ? s.min(1, `${f.label} is required.`).email('Enter a valid email address.')
      : s;
    if (!f.required) return z.string().trim().email('Enter a valid email address.').or(z.literal(''));
    return s;
  }

  if (f.type === 'number') {
    const base = z
      .string()
      .trim()
      .refine((v) => v === '' || !Number.isNaN(Number(v)), { message: 'Enter a number.' })
      .refine((v) => v === '' || f.min == null || Number(v) >= f.min, { message: `Must be ${f.min} or more.` })
      .refine((v) => v === '' || f.max == null || Number(v) <= f.max, { message: `Must be ${f.max} or less.` });
    return f.required ? base.refine((v) => v !== '', { message: `${f.label} is required.` }) : base;
  }

  if (f.required) s = s.min(1, `${f.label} is required.`);
  if (f.minLength != null) s = s.min(f.minLength, `${f.label} must be at least ${f.minLength} characters.`);
  if (f.maxLength != null) s = s.max(f.maxLength, `${f.label} is too long.`);
  return f.required ? s : s.optional().or(z.literal(''));
}

export function buildSchema(fields: FieldDef[]): z.ZodType<ConfigFormValues> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) shape[f.name] = fieldSchema(f);
  return z.object(shape) as unknown as z.ZodType<ConfigFormValues>;
}

export function emptyValues(fields: FieldDef[]): ConfigFormValues {
  return Object.fromEntries(fields.map((f) => [f.name, '']));
}
