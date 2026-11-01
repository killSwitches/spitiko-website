import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import type { Room } from "@/lib/domain";
import { db, firebaseConfigError } from "@/lib/firebase";

export function usePublishedRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(!firebaseConfigError);
  const [error, setError] = useState(firebaseConfigError || "");

  useEffect(() => {
    if (firebaseConfigError) return;

    const roomsQuery = query(
      collection(db, "rooms"),
      where("published", "==", true),
      where("archived", "==", false),
    );

    return onSnapshot(
      roomsQuery,
      (snapshot) => {
        const activeRooms = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Room)
          .filter((room) => room.status === "active");
        setRooms(activeRooms);
        setError("");
        setLoading(false);
      },
      (cause) => {
        setError(cause.message);
        setLoading(false);
      },
    );
  }, []);

  return { rooms, loading, error };
}