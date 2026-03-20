"use client";
import { Poll } from "@/lib/contract";
import styles from "./PollCard.module.css";
import { CONTRACT_ADDRESS } from "@/lib/contract";

interface Props {
  poll: Poll;
  onVote: (pollId: number) => void;
}

export default function PollCard({ poll, onVote }: Props) {
  const total = poll.votes.reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...poll.votes);

  return (
    <div className={styles.card}>
      <div className={styles.pollId}>
        POLL #{String(poll.id).padStart(3, "0")} · {poll.active ? "ACTIVE" : "CLOSED"}
      </div>
      <div className={styles.question}>{poll.question}</div>

      {poll.options.map((opt, i) => {
        const pct = total ? Math.round((poll.votes[i] / total) * 100) : 0;
        const leading = poll.votes[i] === maxVotes && total > 0;
        return (
          <div key={i} className={styles.optionRow}>
            <div className={styles.optionHeader}>
              <span className={styles.optionLabel}>{opt}</span>
              <span className={styles.optionPct}>
                {pct}%{" "}
                <span className={styles.voteCount}>({poll.votes[i]})</span>
              </span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${leading ? styles.leading : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}

      {poll.voted ? (
        <span className={styles.votedTag}>✓ VOTED</span>
      ) : poll.active ? (
        <button className={styles.voteBtn} onClick={() => onVote(poll.id)}>
          CAST VOTE
        </button>
      ) : (
        <span className={styles.closedTag}>CLOSED</span>
      )}

      <div className={styles.meta}>
        <span className={styles.chip}>🗳 {total} vote{total !== 1 ? "s" : ""}</span>
        <span className={styles.chip}>📊 {poll.options.length} options</span>
        <a
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className={styles.ethLink}
        >
          ↗ etherscan
        </a>
      </div>
    </div>
  );
}
