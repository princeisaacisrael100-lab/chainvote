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
  const [options, setOptions] = useState(["", ""]);
  const [isCreating, setIsCreating] = useState(false);

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const updateOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  /**
   * Main form submission handler
   */
  const handlePollDeployment = async (e: FormEvent) => {
    e.preventDefault();
    if (!connected || isCreating) return;

    // Sanitize question and filter non-empty options
    const cleanQuestion = questionText.trim();
    const parsedOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    // Basic client-side validation logic (requires at least 2 non-empty options)
    if (!cleanQuestion || parsedOptions.length < 2) {
      return; 
    }

    try {
      setIsCreating(true);
      await onSubmit(cleanQuestion, parsedOptions);
      
      // Reset form on success
      setQuestionText("");
      setOptions(["", ""]);
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

        <div className={styles.optionsSection}>
          <label className={styles.label}>POLL OPTIONS</label>
          {options.map((opt, idx) => (
            <div key={idx} className={styles.optionInputRow}>
              <input
                className={styles.input}
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                disabled={!connected || isCreating}
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeOption(idx)}
                  disabled={!connected || isCreating}
                  title="Remove Option"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className={styles.addBtn}
            onClick={addOption}
            disabled={!connected || isCreating || options.length >= 8}
          >
            + Add Another Option
          </button>
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
