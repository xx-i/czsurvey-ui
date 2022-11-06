import { useEffect, useState } from "react";

function useStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(localStorage.getItem(key) || defaultValue);

  const setStorageValue = (value) => {
    localStorage.setItem(key, value);
    if (value !== storedValue) {
      setStoredValue(value);
    }
  }

  const removeStorage = () => {
    localStorage.removeItem(key);
  }

  useEffect(() => {
    const storageValue = localStorage.getItem(key);
    if (storageValue) {
      setStoredValue(storageValue);
    }
  }, [key]);

  return [storedValue, setStorageValue, removeStorage];
}

export default useStorage;