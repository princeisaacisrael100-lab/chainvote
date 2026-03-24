/**
 * ChainVote - On-Chain Polling Dashboard
 * -------------------------------------
 * A premium dApp for creating and participating in decentralized polls.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/lib/useWallet";
import { usePolls } from "@/lib/usePolls";
import { Poll, CONTRACT_ADDRESS } from "@/lib/contract";

// Components
import Header from "@/components/Header";
import PollCard from "@/components/PollCard";
import VoteModal from "@/components/VoteModal";
import CreatePoll from "@/components/CreatePoll";
import Toast from "@/components/Toast";

// Layout Styles
import styles from "./page.module.css";

export default function HomePage() {
  const wallet = useWallet();
  const { polls, loading, error, loadPolls, createPoll, castVote, deletePoll } = usePolls();

  // Selected poll for voting
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [currentToast, setCurrentToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [networkBlock, setNetworkBlock] = useState<string>("— —");

  /**
   * Shows a temporary toast message to the user
   */
  const showToast = (msg: string, isError = false) => {
    setCurrentToast({ msg, error: isError });
  };
  
  const clearToast = useCallback(() => setCurrentToast(null), []);

  /**
   * Wallet connection handler
   */
  const handleConnect = async () => {
    await wallet.connect();
    if (wallet.error) {
      showToast(wallet.error, true);
    } else {
      showToast("Wallet connected successfully!");
    }
  };

  /**
   * Graceful wallet logout
   */
  const handleLogout = () => {
    wallet.disconnect();
    showToast("Session disconnected.");
  };

  /**
   * Fetches latest Sepolia block number for the UI
   */
  const updateBlockInfo = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      const hex: string = await (window as any).ethereum.request({ method: "eth_blockNumber" });
      const num = parseInt(hex, 16);
      setNetworkBlock((num / 1000).toFixed(1) + "K");
    } catch (e) {
      console.warn("Failed to update network block.");
    }
  }, []);

  /**
   * Periodic block update on mount
   */
  useEffect(() => {
    updateBlockInfo();
    const timer = setInterval(updateBlockInfo, 12000); // 12-second block update interval
    return () => clearInterval(timer);
  }, [updateBlockInfo]);

  /**
   * Automatically load polls whenever a wallet is connected or app triggers
   */
  useEffect(() => {
    const provider = wallet.getProvider();
    if (provider) {
      loadPolls(provider, wallet.address);
    }
  }, [wallet.address, loadPolls, wallet.getProvider]);

  /**
   * Triggers the voting modal for a specific poll
   */
  const openVoteModal = (pollId: number) => {
    if (!wallet.address) {
      showToast("Connect your wallet first.", true);
      return;
    }
    const targetPoll = polls.find((p) => p.id === pollId);
    if (targetPoll) setActivePoll(targetPoll);
  };

  /**
   * Process a vote transaction from the modal
   */
  const submitVoteTransaction = async (optionIndex: number): Promise<string> => {
    const signer = wallet.getSigner();
    if (!signer || !activePoll) throw new Error("No signer found.");
    
    const txHash = await castVote(signer, activePoll.id, optionIndex);
    showToast("✓ Your vote is on-chain!");

    // Refresh data in background
    const provider = wallet.getProvider();
    if (provider) await loadPolls(provider, wallet.address);
    
    return txHash;
  };

  /**
   * Process a poll creation transaction
   */
  const submitCreateTransaction = async (question: string, options: string[]) => {
    const signer = wallet.getSigner();
    if (!signer) {
      showToast("Connect your wallet first.", true);
      return;
    }

    try {
      showToast("Blockchain transaction submitted...");
      await createPoll(signer, question, options);
      showToast("✓ Poll created successfully!");
      
      const provider = wallet.getProvider();
      if (provider) await loadPolls(provider, wallet.address);
    } catch (e: any) {
      showToast(e.message || "Transaction failed.", true);
    }
  };

  // UI Derived Data
  const totalVotesAcrossPolls = polls.reduce((sum, p) => sum + p.votes.reduce((a, b) => a + b, 0), 0);
  const userTotalVotes = polls.filter((p) => p.voted).length;

  return (
    <>
      <div className={styles.blob2} />

      <Header
        address={wallet.address}
        short={wallet.short}
        loading={wallet.loading}
        onConnect={handleConnect}
        onDisconnect={handleLogout}
      />

      <div className={styles.hero}>
        <div className={styles.heroTag}>// Decentralized Governance · Sepolia Network</div>
        <h1 className={styles.heroTitle}>ON-CHAIN<br />VOTING</h1>
        <p className={styles.heroSub}>
          Cast your voice onto the blockchain — secure, immutable, and live results for every participant.
        </p>
      </div>

      <div className={styles.networkBar}>
        <div className={styles.badge}><span className={styles.dot} /> SEPOLIA TESTNET</div>
        <div className={styles.badge}>BLOCK {networkBlock}</div>
        <div className={styles.badge}>{wallet.address ? wallet.short : "GUEST MODE"}</div>
        <button
          className={styles.contractBadge}
          onClick={() => {
            navigator.clipboard.writeText(CONTRACT_ADDRESS);
            showToast("Contract address copied!");
          }}
        >
          📄 {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-4)}
        </button>
      </div>

      <main className={styles.main}>
        <section>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              // Active Polls
              {!loading && wallet.address && (
                <button 
                  className={styles.refreshBtn} 
                  onClick={() => {
                    const p = wallet.getProvider();
                    if (p) loadPolls(p, wallet.address);
                  }}
                  title="Refresh Polls"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </button>
              )}
            </div>

            {loading ? (
              <div className={styles.pollsList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonCard}>
                    <div className={styles.skel} style={{ width: "60px", height: "10px" }} />
                    <div className={styles.skel} style={{ width: "90%", height: "18px", marginTop: "10px" }} />
                    <div className={styles.skel} style={{ width: "100%", height: "6px", marginTop: "20px" }} />
                    <div className={styles.skel} style={{ width: "100%", height: "6px", marginTop: "10px" }} />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>⚠️</div>
                <p>{error}. Ensure you are on the Sepolia Testnet.</p>
              </div>
            ) : polls.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>{wallet.address ? "🗳" : "🔌"}</div>
                <p>
                  {wallet.address 
                    ? "Be the first one to create a poll on this contract!" 
                    : "Connect your Ethereum wallet to see and participate in active polls."}
                </p>
              </div>
            ) : (
              <div className={styles.pollsList}>
                {polls.map((poll, idx) => (
                  <PollCard 
                    key={poll.id} 
                    poll={poll} 
                    index={idx} 
                    onVote={openVoteModal} 
                    onDelete={deletePoll}
                    isCreator={!!wallet.address && poll.creator.toLowerCase() === wallet.address.toLowerCase()}
                  />
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
                  {wallet.address ? (totalVotesAcrossPolls >= 1000 ? (totalVotesAcrossPolls / 1000).toFixed(1) + "K" : totalVotesAcrossPolls) : "—"}
                </div>
                <div className={styles.statLabel}>Total Votes</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{wallet.address ? userTotalVotes : "—"}</div>
                <div className={styles.statLabel}>My Votes</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{networkBlock}</div>
                <div className={styles.statLabel}>Block</div>
              </div>
            </div>
          </div>

          <CreatePoll onSubmit={submitCreateTransaction} connected={!!wallet.address} />

          <div className={styles.panel}>
            <div className={styles.panelTitle}>// Development info</div>
            <div className={styles.etherscanBox}>
              NETWORK: Sepolia Testnet<br />
              CONTRACT ADDRESS:<br />
              <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">
                {CONTRACT_ADDRESS}
              </a><br />
              <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noreferrer">
                → Source Code on Etherscan ↗
              </a>
            </div>
          </div>
        </aside>
      </main>

      {activePoll && (
        <VoteModal
          poll={activePoll}
          onClose={() => setActivePoll(null)}
          onSubmit={submitVoteTransaction}
        />
      )}

      <Toast 
        message={currentToast?.msg ?? null} 
        error={currentToast?.error} 
        onClear={clearToast} 
      />
    </>
  );
}
