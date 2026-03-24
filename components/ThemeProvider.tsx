"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * Theme Type Definition
 */
type Theme = "dark" | "light";

/**
 * Theme Context Interface
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider Component
 * -----------------------
 * Root-level wrapper that manages the color scheme of the application.
 * Persists user preference via localStorage and listens for system changes.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>("dark");

  /**
   * Initializes the starting theme based on saved preferences or system defaults
   */
  useEffect(() => {
    // 1. Check persistent user storage
    const savedTheme = localStorage.getItem("chainvote-theme") as Theme | null;
    
    // 2. Or check their OS/System Preference
    const userPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme = savedTheme || (userPrefersDark ? "dark" : "light");
    
    setCurrentTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  /**
   * Transitions between Dark and Light mode
   */
  const toggleTheme = () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    setCurrentTheme(nextTheme);
    localStorage.setItem("chainvote-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook: Safely access the current theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be consumed within a ThemeProvider.");
  }
  return context;
};
