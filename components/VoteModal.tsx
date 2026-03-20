"use client";
import { useState } from "react";
import { Poll } from "@/lib/contract";
import styles from "./VoteModal.module.css";

interface Props {
  poll: Poll | null;
  onClose: () => void;
  onSubmit: (optionIndex: number) => Promise<string>;
}

export default function VoteModal({ poll, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!poll) return null;

  const handleSubmit = async () => {
    if (selected === null) return;
    setLoading(true);
    setError(null);
    try {
      const hash = await onSubmit(selected);
      setTxHash(hash);
      setTimeout(() => { onClose(); }, 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.slice(0, 80) : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>✕</button>
        <h2 className={styles.title}>Cast Vote</h2>
        <p className={styles.question}>{poll.question}</p>

        <div className={styles.options}>
          {poll.options.map((opt, i) => (
            <button
              key={i}
              className={`${styles.choiceBtn} ${selected === i ? styles.selected : ""}`}
              onClick={() => setSelected(i)}
            >
              {opt}
            </button>
          ))}
        </div>

        {txHash ? (
          <div className={styles.success}>
            ✓ Vote recorded!
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className={styles.txLink}
            >
              {txHash.slice(0, 20)}...{txHash.slice(-6)}
            </a>
          </div>
        ) : (
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={selected === null || loading}
          >
            {loading ? "SIGNING..." : "SIGN & SUBMIT VOTE"}
          </button>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
