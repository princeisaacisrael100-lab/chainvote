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
  const [hiddenPollIds, setHiddenPollIds] = useState<number[]>([]);

  /**
   * Initializes state by loading previously hidden poll IDs from local storage
   */
  useEffect(() => {
    try {
      const hidden = localStorage.getItem("chainvote-hidden-polls");
      if (hidden) setHiddenPollIds(JSON.parse(hidden));
    } catch (err) {
      console.warn("Failed to load user-hidden polls from storage.");
    }
  }, []);

  /**
   * Internal helper to generate a Contract instance for Read/Write
   */
  const getContract = useCallback(
    (signerOrProvider: ethers.Signer | ethers.providers.Provider) =>
      new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider),
    []
  );

  /**
   * Loads all polls from the blockchain and filters them based on hidden IDs
   */
  const loadPolls = useCallback(
    async (
      provider: ethers.providers.Web3Provider,
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

        const loadedPolls: Poll[] = [];

        // Parallel fetching is generally better, but for simplicity we fetch sequentially 
        // as the local dev provider may be limiting on parallel requests for small counts.
        for (let i = 0; i < pollCountTotal; i++) {
          const [question, options, votesRaw, active, creator] = await contract.getPoll(i);
          
          const hasUserVoted = walletAddress
            ? await contract.hasVoted(i, walletAddress)
            : false;

          loadedPolls.push({
            id: i,
            question,
            options: [...options],
            votes: (votesRaw as ethers.BigNumber[]).map((v) => v.toNumber()),
            active,
            voted: hasUserVoted,
            creator,
          });
        }
        
        // Final pass to remove creator-hidden polls
        const visiblePolls = loadedPolls.filter(p => !hiddenPollIds.includes(p.id));
        setPolls(visiblePolls);
      } catch (err: any) {
        setError(err instanceof Error ? err.message.slice(0, 80) : "Failed to load poll data.");
      } finally {
        setLoading(false);
      }
    },
    [getContract, hiddenPollIds]
  );

  /**
   * Adds a poll ID to the hidden list in localStorage (UI-only delete)
   */
  const deletePoll = useCallback((pollId: number) => {
    setHiddenPollIds(prev => {
      const nextList = [...prev, pollId];
      localStorage.setItem("chainvote-hidden-polls", JSON.stringify(nextList));
      return nextList;
    });

    // Optimistically update the polls state list instantly
    setPolls(prev => prev.filter(p => p.id !== pollId));
  }, []);

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
