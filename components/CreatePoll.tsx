"use client";
import { useState } from "react";
import styles from "./CreatePoll.module.css";

interface Props {
  onSubmit: (question: string, options: string[]) => Promise<void>;
  connected: boolean;
}

export default function CreatePoll({ onSubmit, connected }: Props) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);

  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!connected) return;
    const filtered = options.filter((o) => o.trim());
    if (!question.trim() || filtered.length < 2) return;
    setLoading(true);
    try {
      await onSubmit(question.trim(), filtered);
      setQuestion("");
      setOptions(["", ""]);
    } finally {
      setLoading(false);
    }
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className={styles.panel}>
      <div className={styles.title}>// Create Poll</div>

      <div className={styles.field}>
        <label className={styles.label}>Question</label>
        <textarea
          className={styles.textarea}
          placeholder="What should we decide?"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Options</label>
        <div className={styles.optionsList}>
          {options.map((opt, i) => (
            <div key={i} className={styles.optionRow}>
              <input
                type="text"
                className={styles.input}
                placeholder={`Option ${letters[i]}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              {options.length > 2 && (
                <button className={styles.removeBtn} onClick={() => removeOption(i)}>✕</button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <button className={styles.addBtn} onClick={addOption}>+ ADD OPTION</button>
        )}
      </div>

      <button
        className={styles.deployBtn}
        onClick={handleSubmit}
        disabled={loading || !connected}
      >
        {loading ? "DEPLOYING..." : "DEPLOY POLL"}
      </button>

      <p className={styles.hint}>
        {connected
          ? "⚠ Each poll costs a small gas fee on Sepolia."
          : "⚠ Connect wallet first."}
      </p>
    </div>
  );
}
