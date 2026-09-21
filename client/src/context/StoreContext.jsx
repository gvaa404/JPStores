import React, { useEffect, useState, useContext, createContext, useMemo } from 'react';
import {
  toastSuccess, toastError, alertSuccess, alertError, alertWarning, alertInfo, confirmDialog
} from '../utils/alert';
import api from '../services/api';

const StoreContext = createContext();

export function useStore() {
  return useContext(StoreContext);
}

function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jp_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState([]);

  const loadUser = async () => {
    if (localStorage.getItem('jp_token')) {
      try {
        const r = await api.get('/me');
        setUser(r.data);
      } catch {
        localStorage.removeItem('jp_token');
        setUser(null);
      }
    }
  };

  const refreshCatalog = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch (e) {
      console.error('Catalog load error:', e);
    }
  };

  const loadWishlist = async () => {
    if (!localStorage.getItem('jp_token')) {
      setWishlist([]);
      return;
    }
    try {
      const r = await api.get('/wishlist');
      setWishlist(r.data.map(p => p.id));
    } catch (e) {
      console.error('Wishlist load error:', e);
    }
  };

  useEffect(() => {
    loadUser();
    refreshCatalog();
  }, []);

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  // Cart operations
  const addToCart = (productId, quantity = 1) => {
    const p = products.find(item => item.id === productId);
    const pName = p ? p.name : 'Item';
    setCart(prev => {
      const next = [...prev];
      const idx = next.findIndex(i => i.product_id === productId);
      if (idx > -1) {
        next[idx].quantity += quantity;
      } else {
        next.push({ product_id: productId, quantity });
      }
      localStorage.setItem('jp_cart', JSON.stringify(next));
      return next;
    });
    toastSuccess(`Added "${pName}" to bag! ✨`);
  };

  const updateCartQty = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const next = prev.map(i => i.product_id === productId ? { ...i, quantity } : i);
      localStorage.setItem('jp_cart', JSON.stringify(next));
      return next;
    });
  };

  const removeFromCart = productId => {
    setCart(prev => {
      const next = prev.filter(i => i.product_id !== productId);
      localStorage.setItem('jp_cart', JSON.stringify(next));
      return next;
    });
    toastSuccess('Removed from shopping bag');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('jp_cart');
  };

  // Wishlist operations
  const toggleWishlist = async productId => {
    if (!localStorage.getItem('jp_token')) {
      return alertInfo('Sign In Required', 'Please sign in to save items to your wishlist.');
    }
    try {
      const res = await api.post('/wishlist/' + productId);
      if (res.data.added) {
        setWishlist(prev => [...prev, productId]);
        toastSuccess('Saved to your wishlist ♡');
      } else {
        setWishlist(prev => prev.filter(id => id !== productId));
        toastSuccess('Removed from wishlist');
      }
    } catch (e) {
      toastError(e.response?.data?.error || 'Wishlist error');
    }
  };

  const isWishlisted = productId => wishlist.includes(productId);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + (i.quantity || 1), 0), [cart]);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('jp_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async data => {
    const r = await api.post('/auth/register', data);
    localStorage.setItem('jp_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('jp_token');
    setUser(null);
    setWishlist([]);
    toastSuccess('Signed out successfully');
  };

  return (
    <StoreContext.Provider
      value={{
        user, setUser, login, register, logout, loadUser,
        products, categories, refreshCatalog,
        cart, cartCount, addToCart, updateCartQty, removeFromCart, clearCart,
        wishlist, toggleWishlist, isWishlisted
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export { StoreProvider };