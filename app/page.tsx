"use client";
import { useState, useCallback } from "react";
import { useWallet } from "@/lib/useWallet";
import { usePolls } from "@/lib/usePolls";
import { Poll, CONTRACT_ADDRESS } from "@/lib/contract";
import Header from "@/components/Header";
import PollCard from "@/components/PollCard";
import VoteModal from "@/components/VoteModal";
import CreatePoll from "@/components/CreatePoll";
import Toast from "@/components/Toast";
import styles from "./page.module.css";

export default function Home() {
  const wallet = useWallet();
  const { polls, loading, error, loadPolls, createPoll, castVote } = usePolls();

  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [blockNum, setBlockNum] = useState<string>("—");

  const showToast = (msg: string, isError = false) =>
    setToast({ msg, error: isError });
  const clearToast = useCallback(() => setToast(null), []);

  const handleConnect = async () => {
    await wallet.connect();
    if (wallet.error) { showToast(wallet.error, true); return; }

    try {
      const hex: string = await (window as any).ethereum.request({
        method: "eth_blockNumber",
      });
      const num = parseInt(hex, 16);
      setBlockNum((num / 1000).toFixed(1) + "K");
    } catch {}

    setTimeout(async () => {
      const p = wallet.getProvider();
      if (p) {
        showToast("Wallet connected! Loading polls...");
        await loadPolls(p, wallet.address);
        if (error) showToast(error, true);
      }
    }, 300);
  };

  const handleVote = (pollId: number) => {
    if (!wallet.address) { showToast("Connect your wallet first.", true); return; }
    const poll = polls.find((p) => p.id === pollId);
    if (poll) setActivePoll(poll);
  };

  const handleSubmitVote = async (optionIndex: number): Promise<string> => {
    const signer = wallet.getSigner();
    if (!signer || !activePoll) throw new Error("No signer");
    const hash = await castVote(signer, activePoll.id, optionIndex);
    showToast("✓ Your vote is on the blockchain!");
    const p = wallet.getProvider();
    if (p) await loadPolls(p, wallet.address);
    return hash;
  };

  const handleCreatePoll = async (question: string, options: string[]) => {
    const signer = wallet.getSigner();
    if (!signer) { showToast("Connect your wallet first.", true); return; }
    try {
      showToast("Transaction submitted! Waiting for confirmation...");
      await createPoll(signer, question, options);
      showToast("✓ Poll created on-chain!");
      const p = wallet.getProvider();
      if (p) await loadPolls(p, wallet.address);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Transaction failed", true);
    }
  };

  const totalVotes = polls.reduce(
    (sum, p) => sum + p.votes.reduce((a, b) => a + b, 0),
    0
  );
  const myVotes = polls.filter((p) => p.voted).length;

  return (
    <>
      <div className={styles.blob2} />

      <Header
        address={wallet.address}
        short={wallet.short}
        loading={wallet.loading}
        onConnect={handleConnect}
      />

      <div className={styles.hero}>
        <div className={styles.heroTag}>// Decentralized Governance · Sepolia Testnet</div>
        <h1 className={styles.heroTitle}>ON-CHAIN<br />VOTING</h1>
        <p className={styles.heroSub}>
          Create polls, cast votes, and see live results — secured permanently on the Ethereum blockchain.
        </p>
      </div>

      <div className={styles.networkBar}>
        <div className={styles.badge}><span className={styles.dot} /> SEPOLIA TESTNET</div>
        <div className={styles.badge}>BLOCK {blockNum}</div>
        <div className={styles.badge}>{wallet.address ? wallet.short : "NOT CONNECTED"}</div>
        <button
          className={styles.contractBadge}
          onClick={() => { navigator.clipboard.writeText(CONTRACT_ADDRESS); showToast("Contract address copied!"); }}
        >
          📄 0xb9333...7F59
        </button>
      </div>

      <main className={styles.main}>
        <section>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>// Active Polls</div>
            {loading ? (
              <div className={styles.pollsList}>
                {[1, 2].map((i) => (
                  <div key={i} className={styles.skeletonCard}>
                    <div className={styles.skel} style={{ width: "60px", height: "10px" }} />
                    <div className={styles.skel} style={{ width: "90%", height: "18px", marginTop: "10px" }} />
                    <div className={styles.skel} style={{ width: "100%", height: "6px", marginTop: "20px" }} />
                    <div className={styles.skel} style={{ width: "100%", height: "6px", marginTop: "10px" }} />
                  </div>
                ))}
              </div>
            ) : polls.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>{wallet.address ? "🗳" : "🔌"}</div>
                <p>{wallet.address ? "No polls yet. Be the first to create one!" : "Connect your wallet above to load polls from the blockchain."}</p>
              </div>
            ) : (
              <div className={styles.pollsList}>
                {polls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} onVote={handleVote} />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>// Stats</div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{wallet.address ? polls.length : "—"}</div>
                <div className={styles.statLabel}>Polls</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>
                  {wallet.address ? (totalVotes >= 1000 ? (totalVotes / 1000).toFixed(1) + "K" : totalVotes) : "—"}
                </div>
                <div className={styles.statLabel}>Total Votes</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{wallet.address ? myVotes : "—"}</div>
                <div className={styles.statLabel}>My Votes</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{blockNum}</div>
                <div className={styles.statLabel}>Block</div>
              </div>
            </div>
          </div>

          <CreatePoll onSubmit={handleCreatePoll} connected={!!wallet.address} />

          <div className={styles.panel}>
            <div className={styles.panelTitle}>// Contract Info</div>
            <div className={styles.etherscanBox}>
              NETWORK: Sepolia Testnet<br />
              ADDRESS:<br />
              <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">
                {CONTRACT_ADDRESS}
              </a><br />
              <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noreferrer">
                → View on Etherscan ↗
              </a>
            </div>
          </div>
        </aside>
      </main>

      {activePoll && (
        <VoteModal
          poll={activePoll}
          onClose={() => setActivePoll(null)}
          onSubmit={handleSubmitVote}
        />
      )}

      <Toast message={toast?.msg ?? null} error={toast?.error} onClear={clearToast} />
    </>
  );
}
