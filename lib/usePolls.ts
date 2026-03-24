"use client";
import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, Poll } from "@/lib/contract";

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  useEffect(() => {
    const hidden = localStorage.getItem("chainvote-hidden-polls");
    if (hidden) setHiddenIds(JSON.parse(hidden));
  }, []);

  const getContract = useCallback(
    (signerOrProvider: ethers.Signer | ethers.providers.Provider) =>
      new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider),
    []
  );

  const loadPolls = useCallback(
    async (
      provider: ethers.providers.Web3Provider,
      walletAddress: string | null
    ) => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract(provider);
        const count: ethers.BigNumber = await contract.getPollCount();
        const total = count.toNumber();

        if (total === 0) {
          setPolls([]);
          setLoading(false);
          return;
        }

        const loaded: Poll[] = [];
        for (let i = 0; i < total; i++) {
          const [question, options, votes, active, creator] = await contract.getPoll(i);
          const voted = walletAddress
            ? await contract.hasVoted(i, walletAddress)
            : false;
          loaded.push({
            id: i,
            question,
            options: [...options],
            votes: (votes as ethers.BigNumber[]).map((v) => v.toNumber()),
            active,
            voted,
            creator,
          });
        }
        
        // Filter out hidden polls
        const filtered = loaded.filter(p => !hiddenIds.includes(p.id));
        setPolls(filtered);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.slice(0, 100));
      } finally {
        setLoading(false);
      }
    },
    [getContract, hiddenIds]
  );

  const deletePoll = useCallback((id: number) => {
    setHiddenIds(prev => {
      const next = [...prev, id];
      localStorage.setItem("chainvote-hidden-polls", JSON.stringify(next));
      return next;
    });
    setPolls(prev => prev.filter(p => p.id !== id));
  }, []);

  const createPoll = useCallback(
    async (
      signer: ethers.Signer,
      question: string,
      options: string[]
    ): Promise<boolean> => {
      try {
        const contract = getContract(signer);
        const tx = await contract.createPoll(question, options);
        await tx.wait();
        return true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(msg.slice(0, 80));
      }
    },
    [getContract]
  );

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

  return { polls, loading, error, loadPolls, createPoll, castVote, deletePoll };
}
