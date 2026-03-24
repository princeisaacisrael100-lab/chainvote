"use client";

import { useState, FormEvent } from "react";
import styles from "./CreatePoll.module.css";

/**
 * CreatePoll Component
 * --------------------
 * Dashboard panel for deploying new on-chain polls. 
 * Includes basic validation and multi-line option parsing.
 */
interface Props {
  onSubmit: (question: string, options: string[]) => Promise<void>;
  connected: boolean;
}

export default function CreatePoll({ onSubmit, connected }: Props) {
  // Controller state for form fields
  const [questionText, setQuestionText] = useState("");
  const [optionsRawText, setOptionsRawText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Main form submission handler
   */
  const handlePollDeployment = async (e: FormEvent) => {
    e.preventDefault();
    if (!connected || isCreating) return;

    // Sanitize question and parse multiline options
    const cleanQuestion = questionText.trim();
    const parsedOptions = optionsRawText
      .split("\n")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    // Basic client-side validation logic
    if (!cleanQuestion || parsedOptions.length < 2) {
      return; // Could show validation toast here if needed
    }

    try {
      setIsCreating(true);
      await onSubmit(cleanQuestion, parsedOptions);
      
      // Reset form on success
      setQuestionText("");
      setOptionsRawText("");
    } catch (err) {
      console.warn("Poll creation transaction failed.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>// Create New Poll</div>
      
      <form onSubmit={handlePollDeployment} className={styles.formBody}>
        <div className={styles.field}>
          <label className={styles.label}>POLL QUESTION</label>
          <input
            className={styles.input}
            placeholder="e.g., Which protocol is best?"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            disabled={!connected || isCreating}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>POLL OPTIONS (ONE PER LINE)</label>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Option A\nOption B"
            value={optionsRawText}
            onChange={(e) => setOptionsRawText(e.target.value)}
            disabled={!connected || isCreating}
            required
          />
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!connected || isCreating}
        >
          {isCreating ? "WAITING FOR BLOCKCHAIN..." : "DEPLOY POLL"}
        </button>

        {!connected && (
          <p className={styles.hint}>▶ Connect your wallet to enable creation.</p>
        )}
      </form>
    </div>
  );
}
