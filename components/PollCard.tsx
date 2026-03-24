"use client";

import { Poll, CONTRACT_ADDRESS } from "@/lib/contract";
import styles from "./PollCard.module.css";

/**
 * PollCard Component
 * ------------------
 * Displays an individual poll item with its options, results, and interaction buttons.
 * Supports creator-only permanent deletion and "voted" state indication.
 */
interface Props {
  poll: Poll;
  index: number;
  onVote: (pollId: number) => void;
  onDelete: (pollId: number) => void;
  isCreator: boolean;
}

export default function PollCard({
  poll,
  index,
  onVote,
  onDelete,
  isCreator,
}: Props) {

  // Calculate total across all options for percentage mapping
  const totalVotesAcrossAllOptions = poll.votes.reduce((acc, current) => acc + current, 0);
  const leadingVoteCount = Math.max(...poll.votes);

  /**
   * Helper to determine high-contrast label formatting for poll ID
   */
  const formattedId = String(poll.id).padStart(3, "0");

  return (
    <article className={styles.card} style={{ animationDelay: `${index * 0.1}s` }}>
      {isCreator && (
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(poll.id)}
          title="Permanently Delete Poll (On-Chain)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      )}

      <div className={styles.pollId}>
        POLL #{formattedId} · {poll.active ? "ACTIVE" : "CLOSED"}
      </div>

      <h2 className={styles.question}>{poll.question}</h2>

      <div className={styles.optionsList}>
        {poll.options.map((optionLabel, idx) => {
          const voteCountForOption = poll.votes[idx];
          const percentageValue = totalVotesAcrossAllOptions
            ? Math.round((voteCountForOption / totalVotesAcrossAllOptions) * 100)
            : 0;

          // Highlights the leading option visually
          const isCurrentlyLeading = voteCountForOption === leadingVoteCount && totalVotesAcrossAllOptions > 0;

          return (
            <div key={idx} className={styles.optionRow}>
              <div className={styles.optionHeader}>
                <span className={styles.optionLabel}>{optionLabel}</span>
                <span className={styles.optionPct}>
                  {percentageValue}%{" "}
                  <span className={styles.voteCount}>({voteCountForOption})</span>
                </span>
              </div>

              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isCurrentlyLeading ? styles.leading : ""}`}
                  style={{ width: `${percentageValue}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.actionArea}>
        {poll.voted ? (
          <div className={styles.votedTag}>✓ VOTED</div>
        ) : poll.active ? (
          <button className={styles.voteBtn} onClick={() => onVote(poll.id)}>
            CAST VOTE
          </button>
        ) : (
          <div className={styles.closedTag}>CLOSED</div>
        )}
      </div>

      <footer className={styles.meta}>
        <span className={styles.chip}>🗳 {totalVotesAcrossAllOptions} votes cast</span>
        <span className={styles.chip}>📊 {poll.options.length} options available</span>
        <a
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className={styles.ethLink}
        >
          ↗ view on etherscan
        </a>
      </footer>
    </article>
  );
}
