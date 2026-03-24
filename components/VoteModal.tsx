"use client";

import { useState } from "react";
import { Poll } from "@/lib/contract";
import styles from "./VoteModal.module.css";

/**
 * VoteModal Component
 * -------------------
 * Overlay for casting a vote on a specific poll.
 * Includes a custom radio button UI and transaction state management.
 */
interface Props {
  poll: Poll;
  onClose: () => void;
  onSubmit: (optionIndex: number) => Promise<string>;
}

export default function VoteModal({ poll, onClose, onSubmit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /**
   * Action: Handles the actual vote submission to the blockchain
   */
  const handleFinalSubmit = async () => {
    if (selectedIndex === null || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(selectedIndex);
      onClose(); // Auto-close upon successful transaction confirmation
    } catch (err) {
      console.warn("Vote submission failed or was rejected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal}>
        <button 
          className={styles.close} 
          onClick={onClose}
          aria-label="Close dialog"
        >
          &times;
        </button>

        <header>
          <div className={styles.title}>SUBMIT YOUR VOTE</div>
          <div className={styles.question}>{poll.question}</div>
        </header>

        <div className={styles.choices}>
          {poll.options.map((optionText, idx) => (
            <button
              key={idx}
              className={`${styles.choiceBtn} ${selectedIndex === idx ? styles.activeChoice : ""}`}
              onClick={() => setSelectedIndex(idx)}
              disabled={isSubmitting}
            >
              <div className={styles.radio}>
                {selectedIndex === idx && <div className={styles.checked} />}
              </div>
              <span className={styles.optionLabel}>{optionText}</span>
            </button>
          ))}
        </div>

        <button
          className={styles.submitBtn}
          onClick={handleFinalSubmit}
          disabled={selectedIndex === null || isSubmitting}
        >
          {isSubmitting ? "TRANSACTION IN PROGRESS..." : "CONFIRM VOTE"}
        </button>
      </div>
    </div>
  );
}
