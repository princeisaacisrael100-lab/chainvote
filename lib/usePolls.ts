"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, Poll } from "@/lib/contract";

/**
 * usePolls Hook
 * ------------
 * Handles all contract-level poll interactions and the "soft-delete" UI logic.
 * Fetches polls, creates new ones, and manages hidden IDs in localStorage.
 */
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Internal helper to generate a Contract instance for Read/Write
   */
  const getContract = useCallback(
    (signerOrProvider: ethers.Signer | ethers.providers.Provider) =>
      new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider),
    []
  );

  /**
   * Loads all polls from the blockchain using the original contract's methods
   */
  const loadPolls = useCallback(
    async (
      provider: ethers.providers.Web3Provider | ethers.providers.Provider,
      walletAddress: string | null
    ) => {
      setLoading(true);
      setError(null);

      try {
        const contract = getContract(provider);
        const pollCountRaw = await contract.getPollCount();
        const pollCountTotal = pollCountRaw.toNumber();

        if (pollCountTotal === 0) {
          setPolls([]);
          return;
        }

        // Parallel fetching is more efficient for modern RPCs
        const pollPromises = [];
        for (let i = 0; i < pollCountTotal; i++) {
          pollPromises.push(
            (async () => {
              try {
                // The old contract returns [question, options, votes, active, creator] in getPoll
                const [question, options, votesRaw, active, creator] = await contract.getPoll(i);
                
                const hasUserVoted = walletAddress
                  ? await contract.hasVoted(i, walletAddress)
                  : false;

                return {
                  id: i,
                  question,
                  options: [...options],
                  votes: (votesRaw as ethers.BigNumber[]).map((v) => v.toNumber()),
                  active,
                  voted: hasUserVoted,
                  creator,
                } as Poll;
              } catch (e) {
                console.warn(`Failed to fetch poll ${i}:`, e);
                return null;
              }
            })()
          );
        }

        const resolvedPolls = (await Promise.all(pollPromises))
          .filter((p) => p !== null && p.active) as Poll[];
        setPolls(resolvedPolls);
      } catch (err: any) {
        console.error("Poll load error:", err);
        setError(err instanceof Error ? err.message.slice(0, 80) : "Failed to load poll data.");
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  /**
   * Closes a poll via the smart contract
   */
  const deletePoll = useCallback(
    async (signer: ethers.Signer, pollId: number): Promise<void> => {
      try {
        const contract = getContract(signer);
        // Note: Using closePoll as permanent deletion substitute on the old contract
        const tx = await contract.closePoll(pollId);
        await tx.wait(); // Wait for mining
        
        // Refresh local list
        const provider = signer.provider || (window as any).ethereum; // best effort fallback
        if (provider) await loadPolls(provider, null);
      } catch (err: any) {
        const msg = err.message || "Failed to close/delete poll on-chain.";
        throw new Error(msg.slice(0, 100));
      }
    },
    [getContract, loadPolls]
  );

  /**
   * Deploys a new poll to the blockchain
   */
  const createPoll = useCallback(
    async (
      signer: ethers.Signer,
      question: string,
      options: string[]
    ): Promise<boolean> => {
      try {
        const contract = getContract(signer);
        const tx = await contract.createPoll(question, options);
        await tx.wait(); // Confirm transaction
        return true;
      } catch (err: any) {
        // Human-friendly error parsing
        const msg = err.message || "An unexpected error occurred during poll creation.";
        throw new Error(msg.slice(0, 100));
      }
    },
    [getContract]
  );

  /**
   * Casts a vote for a specific option on-chain
   */
  const castVote = useCallback(
    async (
      signer: ethers.Signer,
      pollId: number,
      optionIndex: number
    ): Promise<string> => {
      const contract = getContract(signer);
      const tx = await contract.vote(pollId, optionIndex);
      await tx.wait();
      return tx.hash;
    },
    [getContract]
  );

  return { 
    polls, 
    loading, 
    error, 
    loadPolls, 
    createPoll, 
    castVote, 
    deletePoll 
  };
}
