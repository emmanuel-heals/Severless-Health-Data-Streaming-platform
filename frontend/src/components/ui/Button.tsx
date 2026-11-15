import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './ui.module.css';

type Variant = 'primary' | 'secondary' | 'highlight' | 'danger' | 'ghost';

interface BaseProps {
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  block,
  children,
  className,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${block ? styles.block : ''} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variant = 'primary',
  block,
  children,
}: BaseProps & { to: string }) {
  return (
    <Link to={to} className={`${styles.btn} ${styles[variant]} ${block ? styles.block : ''}`}>
      {children}
    </Link>
  );
}
