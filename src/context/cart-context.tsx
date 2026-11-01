import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { getMenuPriceCents, type MenuItem } from "@/lib/menu";

interface CartLine {
  item: MenuItem;
  quantity: number;
}

interface CartValue {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((item: MenuItem) => {
    setLines((current) => {
      const line = current.find((entry) => entry.item.id === item.id);
      return line
        ? current.map((entry) =>
            entry.item.id === item.id
              ? { ...entry, item, quantity: entry.quantity + 1 }
              : entry,
          )
        : [...current, { item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setLines((current) =>
      current
        .map((line) =>
          line.item.id === itemId
            ? { ...line, quantity: line.quantity - 1 }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);
  const value = useMemo(
    () => ({
      lines,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      subtotalCents: lines.reduce(
        (total, line) => total + getMenuPriceCents(line.item) * line.quantity,
        0,
      ),
      addItem,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, lines, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used within a CartProvider.");
  return cart;
}
