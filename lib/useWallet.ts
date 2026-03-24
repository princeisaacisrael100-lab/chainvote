"use client";
import { useState, useCallback, useEffect } from "react";
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

  const reconnect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    
    // Don't auto-reconnect if user explicitly logged out
    const loggedOut = localStorage.getItem("chainvote-user-logout");
    if (loggedOut === "true") return;

    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        const chainId: string = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (chainId === SEPOLIA_CHAIN_ID) {
          setAddress(accounts[0]);
        }
      }
    } catch (e) {
      console.error("Reconnect failed", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    reconnect();

    const handleAccounts = (accounts: string[]) => {
      setAddress(accounts.length > 0 ? accounts[0] : null);
    };

    const handleChain = () => {
      window.location.reload();
    };

    const ethereum = window.ethereum as any;
    if (ethereum && ethereum.on) {
      ethereum.on("accountsChanged", handleAccounts);
      ethereum.on("chainChanged", handleChain);
    }

    return () => {
      if (ethereum && ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccounts);
        ethereum.removeListener("chainChanged", handleChain);
      }
    };
  }, [reconnect]);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.setItem("chainvote-user-logout", "true");
  }, []);

  const connectWithReset = useCallback(async () => {
    localStorage.removeItem("chainvote-user-logout");
    await connect();
  }, [connect]);

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

  return { address, short, loading, error, connect: connectWithReset, disconnect, getProvider, getSigner };
}
