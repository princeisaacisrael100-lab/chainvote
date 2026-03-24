"use client";

import styles from "./Header.module.css";
import ThemeToggle from "./ThemeToggle";

/**
 * Header Component
 * ----------------
 * Top navigation bar containing the branding, theme toggle, 
 * and wallet status/connectivity actions.
 */
interface Props {
  address: string | null;
  short: string | null;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Header({ 
  address, 
  short, 
  loading, 
  onConnect, 
  onDisconnect 
}: Props) {
  
  const handleLogoClick = () => {
    // Convenient way for users to "reset" the application state
    window.location.reload();
  };

  return (
    <header className={styles.header}>
      <div 
        className={styles.logo} 
        onClick={handleLogoClick} 
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
      >
        Chain<span>Vote</span>
      </div>

      <div className={styles.actions}>
        <ThemeToggle />

        <div className={styles.walletContainer}>
          <button
            className={`${styles.walletBtn} ${address ? styles.connected : ""}`}
            onClick={onConnect}
            disabled={loading}
          >
            {loading 
              ? "CONNECTING..." 
              : address 
                ? `● ${short}` 
                : "▶ CONNECT WALLET"
            }
          </button>

          {address && (
            <button
              className={styles.logoutBtn}
              onClick={onDisconnect}
              title="Disconnect Wallet Session"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
