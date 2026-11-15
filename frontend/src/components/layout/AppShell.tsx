import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { ROLE_LABEL, ROLE_NAV } from '@/config/roles';
import { Brand } from '@/components/Brand';
import { Icon } from '@/components/Icon';
import styles from './AppShell.module.css';

/** Authenticated layout: role-specific side nav + top bar. Used by all dashboards. */
export function AppShell() {
  const { user, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  if (!user) return null;
  const nav = ROLE_NAV[user.role];
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <aside className={`${styles.sidenav} ${navOpen ? styles.open : ''}`} aria-label="Primary">
        <div className={styles.brandBox}>
          <Brand variant="light" />
        </div>
        <nav className={styles.nav}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setNavOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className={styles.navItem} onClick={() => void signOut()}>
          <Icon name="logout" />
          <span>Logout</span>
        </button>
      </aside>

      {navOpen && <div className={styles.backdrop} onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Toggle navigation"
            onClick={() => setNavOpen((v) => !v)}
          >
            <Icon name="menu" size={22} />
          </button>
          <div className={styles.spacer} />
          {/* Signed-in user's name + role + logout (FR-065) */}
          <div className={styles.userBox}>
            <span className={styles.avatar} aria-hidden="true">
              {initials}
            </span>
            <span className={styles.userMeta}>
              <strong>{user.name}</strong>
              <small>{ROLE_LABEL[user.role]}</small>
            </span>
          </div>
        </header>

        <main id="main" className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
