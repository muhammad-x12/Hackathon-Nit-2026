import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSubdomain } from '../utils/subdomain';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (!savedCart) return [];
            const parsed = JSON.parse(savedCart);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Failed to parse cart", e);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (e) {
            console.error("Failed to save cart", e);
        }
    }, [cart]);

    const variantDelta = (product, options = {}) => {
        const adj = product?.variant_price_adjustments;
        if (!adj || typeof adj !== 'object') return 0;

        const norm = (v) => String(v || '').trim().toLowerCase();
        const lookup = (map, key) => {
            if (!map || typeof map !== 'object') return 0;
            if (Object.prototype.hasOwnProperty.call(map, key)) return Number(map[key] || 0);
            const k = norm(key);
            for (const [label, val] of Object.entries(map)) {
                if (norm(label) === k) return Number(val || 0);
            }
            return 0;
        };

        const size = options?.size;
        const color = options?.color;
        return (lookup(adj.size, size) || 0) + (lookup(adj.color, color) || 0);
    };

    const addToCart = (product, quantity = 1, options = {}) => {
        const isSubdomain = !!getSubdomain();
        const minQty = isSubdomain ? 1 : (product.min_quantity || 1);
        const maxQty = product.max_quantity || Infinity;

        const hasSizeRequired = !!product.size && product.size.trim().length > 0;
        const hasColorRequired = !!product.color && product.color.includes(',');
        
        if ((hasSizeRequired && !options.size) || (hasColorRequired && !options.color)) {
             console.warn("Attempted to add product without required options", product.id);
             // Since we can't easily show a toast from here without more dependencies, 
             // we rely on the UI to prevent this, but we return early as a hard guard.
             return;
        }

        // Create a unique key for items with options (e.g., size, color)
        const cartItemId = `${product.id}${options.size ? `-${options.size}` : ''}${options.color ? `-${options.color}` : ''}`;

        setCart(prevCart => {
            const existingItem = prevCart.find(item => (item.cartItemId || item.id) === cartItemId);
            if (existingItem) {
                const newQty = Math.min(existingItem.quantity + quantity, maxQty);
                return prevCart.map(item =>
                    (item.cartItemId || item.id) === cartItemId
                        ? { ...item, quantity: newQty }
                        : item
                );
            }
            const initialQty = Math.max(quantity, minQty);
            const base = product.pricing?.final_price || product.base_price || product.price || 0;
            const itemPrice = Number(base || 0) + Number(variantDelta(product, options) || 0);
            return [...prevCart, { ...product, cartItemId, options, price: itemPrice, quantity: initialQty }];
        });
    };

    const removeFromCart = (cartItemId) => {
        setCart(prevCart => prevCart.filter(item => (item.cartItemId || item.id) !== cartItemId));
    };

    const updateQuantity = (cartItemId, quantity) => {
        const isSubdomain = !!getSubdomain();
        setCart(prevCart =>
            prevCart.map(item => {
                if ((item.cartItemId || item.id) === cartItemId) {
                    const minQty = isSubdomain ? 1 : (item.min_quantity || 1);
                    const maxQty = item.max_quantity || Infinity;
                    const constrainedQty = Math.max(minQty, Math.min(quantity, maxQty));
                    return { ...item, quantity: constrainedQty };
                }
                return item;
            })
        );
    };

    const clearCart = () => setCart([]);

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            const itemPrice = item.price || item.pricing?.final_price || item.base_price || 0;
            return total + (itemPrice * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
