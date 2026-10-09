import { useEffect, useState } from "react";

// Like useState, but the value is saved to the browser's localStorage
// and loaded back when the page is reopened.
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? (JSON.parse(saved) as T) : initialValue;
    } catch {
      return initialValue; // storage blocked or data corrupted
    }
  });

  // Runs after every render where `value` changed.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked; ignore for now
    }
  }, [key, value]);

  return [value, setValue] as const;
}