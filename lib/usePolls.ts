"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, Poll } from "@/lib/contract";

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const [question, options, votes, active] = await contract.getPoll(i);
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
          });
        }
        setPolls(loaded);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.slice(0, 100));
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

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

  return { polls, loading, error, loadPolls, createPoll, castVote };
}
