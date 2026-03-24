"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID } from "@/lib/contract";

/**
 * useWallet Hook
 * -------------
 * Manages the Ethereum wallet connection using MetaMask (or any EIP-1193 provider).
 * Includes auto-reconnect, account change listeners, and manual disconnect logic.
 */
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cleans and shortens the address for display (e.g., 0x1234...5678)
   */
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  /**
   * Attempts to reconnect if the user has previously authorized the app
   */
  const reconnect = useCallback(async () => {
    // Only run in the browser
    if (typeof window === "undefined" || !window.ethereum) return;
    
    // Respect explicit user logout logic
    const wasLoggedOut = localStorage.getItem("chainvote-user-logout") === "true";
    if (wasLoggedOut) return;

    try {
      const provider = window.ethereum as any;
      const accounts = await provider.request({ method: "eth_accounts" });
      
      if (accounts.length > 0) {
        const chainId = await provider.request({ method: "eth_chainId" });
        if (chainId === SEPOLIA_CHAIN_ID) {
          setAddress(accounts[0]);
        }
      }
    } catch (err) {
      console.warn("Wallet auto-reconnect failed:", err);
    }
  }, []);

  /**
   * Connects the wallet and ensures the user is on the Sepolia network
   */
  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("Please install MetaMask to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    localStorage.removeItem("chainvote-user-logout"); // Reset logout flag

    const provider = window.ethereum as any;

    try {
      // 1. Request accounts
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      
      // 2. Check network
      const chainId = await provider.request({ method: "eth_chainId" });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          setError("Network error: Please manually switch to Sepolia Testnet.");
          setLoading(false);
          return;
        }
      }
      
      setAddress(accounts[0]);
    } catch (err: any) {
      setError(err.code === 4001 ? "Login rejected." : "Connection failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manually disconnects the UI and prevents future auto-reconnects
   */
  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.setItem("chainvote-user-logout", "true");
  }, []);

  /**
   * Get Ethers-compatible provider for on-chain interactions
   */
  const getProvider = useCallback(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new ethers.providers.Web3Provider(window.ethereum as any);
  }, []);

  const getSigner = useCallback(() => {
    const provider = getProvider();
    return provider ? provider.getSigner() : null;
  }, [getProvider]);

  /**
   * Set up listeners for account and network changes
   */
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    reconnect();

    const provider = window.ethereum as any;

    const onAccountsChanged = (accounts: string[]) => {
      setAddress(accounts.length > 0 ? accounts[0] : null);
    };

    const onChainChanged = () => {
      // Reload on network change to ensure consistent state
      window.location.reload();
    };

    provider.on("accountsChanged", onAccountsChanged);
    provider.on("chainChanged", onChainChanged);

    return () => {
      provider.removeListener("accountsChanged", onAccountsChanged);
      provider.removeListener("chainChanged", onChainChanged);
    };
  }, [reconnect]);

  return { 
    address, 
    short: shortAddress, 
    loading, 
    error, 
    connect, 
    disconnect, 
    getProvider, 
    getSigner 
  };
}
