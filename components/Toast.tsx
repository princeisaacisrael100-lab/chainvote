"use client";

import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

/**
 * Toast Component
 * ---------------
 * Global notification system that displays brief success/error messages.
 */
interface Props {
  message: string | null;
  error?: boolean;
  onClear: () => void;
  displayDuration?: number;
}

export default function Toast({ 
  message, 
  error, 
  onClear, 
  displayDuration = 3500 
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Triggers the showing/hiding logic whenever a new message arrives
   */
  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for removal animation to complete before parent state cleanup
        setTimeout(onClear, 400); 
      }, displayDuration);

      return () => clearTimeout(timer);
    }
  }, [message, onClear, displayDuration]);

  if (!message) return null;

  return (
    <div 
      className={`${styles.toast} ${isVisible ? styles.visible : styles.hidden} ${error ? styles.error : ""}`}
    >
      <div className={styles.icon}>{error ? "⚠" : "⚡"}</div>
      <div className={styles.message}>{message}</div>
      <button 
        className={styles.close} 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClear, 400);
        }}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
}
