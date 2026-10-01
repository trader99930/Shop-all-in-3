import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, Shop, Offer } from '../types/index.ts';
import { useAuth } from './AuthContext.tsx';

interface ConflictState {
  isOpen: boolean;
  pendingProduct?: Product;
  pendingVariant?: ProductVariant;
  pendingShop?: Shop;
  pendingQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  cartShop: Shop | null;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, shop: Shop, variant?: ProductVariant, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  conflict: ConflictState;
  resolveConflict: (switchShop: boolean) => Promise<void>;
  refreshCart: () => Promise<void>;
  appliedCoupon: Offer | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  discountAmount: number;
  deliveryFee: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartShop, setCartShop] = useState<Shop | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [conflict, setConflict] = useState<ConflictState>({ isOpen: false });

  const refreshCart = async () => {
    if (!currentUser) {
      setItems([]);
      setCartShop(null);
      return;
    }
    try {
      const res = await fetch('/api/cart', { headers: getAuthHeaders() }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setCartShop(data.shop || null);
      }
    } catch {
      // Graceful fallback for offline / dev server restart
    }
  };

  useEffect(() => {
    refreshCart();
  }, [currentUser?.id]);

  const addToCart = async (
    product: Product,
    shop: Shop,
    variant?: ProductVariant,
    quantity: number = 1
  ) => {
    if (cartShop && cartShop.id !== shop.id && items.length > 0) {
      setConflict({
        isOpen: true,
        pendingProduct: product,
        pendingVariant: variant,
        pendingShop: shop,
        pendingQuantity: quantity,
      });
      return;
    }

    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          shopId: shop.id,
          productId: product.id,
          variantId: variant?.id || null,
          quantity,
        }),
      });

      if (res.ok) {
        await refreshCart();
        setIsCartOpen(true);
      } else {
        const err = await res.json();
        if (err.error === 'CART_DIFFERENT_SHOP') {
          setConflict({
            isOpen: true,
            pendingProduct: product,
            pendingVariant: variant,
            pendingShop: shop,
            pendingQuantity: quantity,
          });
        }
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const resolveConflict = async (switchShop: boolean) => {
    if (switchShop && conflict.pendingProduct && conflict.pendingShop) {
      try {
        await fetch('/api/cart/items', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            shopId: conflict.pendingShop.id,
            productId: conflict.pendingProduct.id,
            variantId: conflict.pendingVariant?.id || null,
            quantity: conflict.pendingQuantity || 1,
            forceSwitchShop: true,
          }),
        });
        await refreshCart();
        setIsCartOpen(true);
      } catch (err) {
        console.error('Error switching shop cart:', err);
      }
    }
    setConflict({ isOpen: false });
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const removeFromCart = async (itemId: number) => {
    await updateQuantity(itemId, 0);
  };

  const clearCart = async () => {
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setItems([]);
      setCartShop(null);
      setAppliedCoupon(null);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  // Delivery fee calculation
  let deliveryFee = 0;
  if (cartShop && items.length > 0) {
    const freeThreshold = Number(cartShop.freeDeliveryThreshold || 500);
    if (subtotal < freeThreshold) {
      deliveryFee = Number(cartShop.deliveryFee || 30);
    }
  }

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal >= Number(appliedCoupon.minOrderValue || 0)) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * Number(appliedCoupon.discountValue)) / 100);
    } else {
      discountAmount = Number(appliedCoupon.discountValue);
    }
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!cartShop) return { success: false, message: 'Cart is empty' };
    try {
      const res = await fetch(`/api/shops/${cartShop.id}/offers`);
      const offersList: Offer[] = await res.json();
      const matched = offersList.find(
        (o) => o.code.toUpperCase() === code.trim().toUpperCase() && o.isActive
      );

      if (!matched) {
        return { success: false, message: 'Invalid or expired coupon code' };
      }

      if (subtotal < Number(matched.minOrderValue || 0)) {
        return {
          success: false,
          message: `Minimum order value for this coupon is ₹${matched.minOrderValue}`,
        };
      }

      setAppliedCoupon(matched);
      return { success: true, message: `Coupon ${matched.code} applied successfully!` };
    } catch {
      return { success: false, message: 'Failed to validate coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartShop,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        conflict,
        resolveConflict,
        refreshCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discountAmount,
        deliveryFee,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
