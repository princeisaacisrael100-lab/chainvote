"use client";
import styles from "./Header.module.css";

interface Props {
  address: string | null;
  short: string | null;
  loading: boolean;
  onConnect: () => void;
}

export default function Header({ address, short, loading, onConnect }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        Chain<span>Vote</span>
      </div>
      <button
        className={`${styles.walletBtn} ${address ? styles.connected : ""}`}
        onClick={onConnect}
        disabled={loading}
      >
        {loading ? "CONNECTING..." : address ? `● ${short}` : "▶ CONNECT WALLET"}
      </button>
    </header>
  );
}
