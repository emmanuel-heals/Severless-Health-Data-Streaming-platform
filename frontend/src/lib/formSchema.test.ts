import { describe, it, expect } from 'vitest';
import { buildSchema, emptyValues } from './formSchema';
import type { FieldDef } from '@/config/fieldSchemas';
import { patientRegistrationFields } from '@/config/fieldSchemas';

describe('buildSchema', () => {
  it('rejects a blank required field and accepts a filled one', () => {
    const schema = buildSchema([{ name: 'firstName', label: 'First name', type: 'text', required: true }]);
    expect(schema.safeParse({ firstName: '' }).success).toBe(false);
    expect(schema.safeParse({ firstName: 'Grace' }).success).toBe(true);
  });

  it('allows an optional field to be empty', () => {
    const schema = buildSchema([{ name: 'phone', label: 'Phone', type: 'text', required: false }]);
    expect(schema.safeParse({ phone: '' }).success).toBe(true);
  });

  it('validates email format', () => {
    const schema = buildSchema([{ name: 'email', label: 'Email', type: 'email', required: true }]);
    expect(schema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(schema.safeParse({ email: 'a@b.org' }).success).toBe(true);
  });

  it('enforces numeric min/max', () => {
    const fields: FieldDef[] = [{ name: 'age', label: 'Age', type: 'number', required: true, min: 0, max: 120 }];
    const schema = buildSchema(fields);
    expect(schema.safeParse({ age: 'abc' }).success).toBe(false);
    expect(schema.safeParse({ age: '200' }).success).toBe(false);
    expect(schema.safeParse({ age: '42' }).success).toBe(true);
  });

  it('validates the real patient registration config (required names, optional contact)', () => {
    const schema = buildSchema(patientRegistrationFields);
    const base = emptyValues(patientRegistrationFields);
    expect(schema.safeParse(base).success).toBe(false); // required names missing
    expect(
      schema.safeParse({ ...base, firstName: 'Grace', lastName: 'Adeyemi', dateOfBirth: '1984-03-12', sex: 'female' }).success,
    ).toBe(true);
  });
});
