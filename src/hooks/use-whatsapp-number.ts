import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db, firebaseConfigError } from "@/lib/firebase";

const fallbackNumber = "27764751683";

export function useWhatsAppNumber() {
  const [number, setNumber] = useState(fallbackNumber);
  const [error, setError] = useState(firebaseConfigError);

  useEffect(() => {
    if (firebaseConfigError) return;
    return onSnapshot(
      doc(db, "config", "whatsapp"),
      (snapshot) => {
        const configuredNumber = snapshot.data()?.number;
        if (typeof configuredNumber === "string" && configuredNumber.trim()) {
          setNumber(configuredNumber);
        } else {
          setNumber(fallbackNumber);
        }
        setError("");
      },
      (cause) => setError(cause.message),
    );
  }, []);

  return { number, error };
}
