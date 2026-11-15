import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './form.module.css';

interface FieldWrapProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

/** Labelled field with inline validation message (UI-04 / NFR-USA-02). */
export function Field({ label, htmlFor, required, error, children, hint }: FieldWrapProps) {
  const errId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
        {required && (
          <span className={styles.req} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {children}
      {error && (
        <span id={errId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ invalid, className, ...rest }, ref) {
    return <input ref={ref} className={`${styles.input} ${invalid ? styles.inputError : ''} ${className ?? ''}`} aria-invalid={invalid || undefined} {...rest} />;
  },
);

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function SelectInput({ invalid, className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={`${styles.input} ${invalid ? styles.inputError : ''} ${className ?? ''}`} aria-invalid={invalid || undefined} {...rest}>
        {children}
      </select>
    );
  },
);
