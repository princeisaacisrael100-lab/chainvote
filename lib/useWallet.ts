"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID } from "@/lib/contract";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not found. Please install it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainId: string = await window.ethereum.request({
        method: "eth_chainId",
      });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch {
          setError("Please switch to Sepolia in MetaMask.");
          setLoading(false);
          return;
        }
      }
      setAddress(accounts[0]);
    } catch {
      setError("Connection rejected.");
    } finally {
      setLoading(false);
    }
  }, []);

  const getProvider = useCallback(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
  }, []);

  const getSigner = useCallback(() => {
    return getProvider()?.getSigner() ?? null;
  }, [getProvider]);

  const short = address
    ? address.slice(0, 6) + "..." + address.slice(-4)
    : null;

  return { address, short, loading, error, connect, getProvider, getSigner };
}
