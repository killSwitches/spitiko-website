import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import type { MenuItem } from "@/lib/menu";
import { db, firebaseConfigError } from "@/lib/firebase";

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(!firebaseConfigError);
  const [error, setError] = useState(firebaseConfigError);

  useEffect(() => {
    if (firebaseConfigError) return;

    return onSnapshot(
      query(collection(db, "menuItems"), where("available", "==", true)),
      (snapshot) => {
        const publishedItems = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as MenuItem)
          .filter((item) =>
            typeof item.name === "string" &&
            typeof item.category === "string" &&
            Number.isInteger(item.priceCents) &&
            item.priceCents >= 0,
          )
          .sort((left, right) => left.name.localeCompare(right.name));
        setItems(publishedItems);
        setError("");
        setLoading(false);
      },
      (cause) => {
        setError(cause.message);
        setLoading(false);
      },
    );
  }, []);

  return { items, loading, error };
}
