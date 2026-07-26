/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item);
      return (parsed === null || parsed === undefined) ? initialValue : parsed;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Keep track of the key currently in state to prevent writing stale state to a new key
  const keyInStateRef = useRef(key);

  // If the key changes (e.g. user signs in), sync the state with the value from local storage for the new key
  if (keyInStateRef.current !== key) {
    keyInStateRef.current = key;
    try {
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValue;
      const val = (parsed === null || parsed === undefined) ? initialValue : parsed;
      setStoredValue(val);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}" on key change:`, error);
      setStoredValue(initialValue);
    }
  }

  // Return a wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Keep the localStorage in sync with storedValue changes
  useEffect(() => {
    try {
      // Only write if the key matches the one currently in state to prevent race conditions
      if (keyInStateRef.current === key) {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}" in useEffect:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
