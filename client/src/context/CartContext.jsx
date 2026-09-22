import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Initialize cart from localStorage if it exists
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item) => {
        setCart(prevCart => {
            const existing = prevCart.find(i => i.menu_item_id === item.id);
            if (existing) {
                // If item is already in cart, just increment quantity
                return prevCart.map(i => 
                    i.menu_item_id === item.id 
                        ? { ...i, quantity: i.quantity + 1 } 
                        : i
                );
            }
            // Otherwise, add new item to cart
            return [...prevCart, { 
                menu_item_id: item.id, 
                name: item.name, 
                price: Number(item.price), 
                quantity: 1 
            }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prevCart => prevCart.filter(i => i.menu_item_id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
    };

    // Derived state for the total price and total number of items
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};
