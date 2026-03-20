"use client";
import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

interface Props {
  message: string | null;
  error?: boolean;
  onClear: () => void;
}

export default function Toast({ message, error, onClear }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onClear, 300); }, 4000);
    return () => clearTimeout(t);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className={`${styles.toast} ${visible ? styles.show : ""} ${error ? styles.error : ""}`}>
      {message}
    </div>
  );
}
