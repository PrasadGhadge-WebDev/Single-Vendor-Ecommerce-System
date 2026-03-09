import { createContext, useState, useEffect } from "react";
import API from "../api";
import { toast } from "react-toastify";

export const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const fetchCart = async () => {
    const { data } = await API.get("/cart");
    setCart(data?.items || []);
  };

  const addToCart = async (product) => {
    try {
      const productId = typeof product === "object" ? product?._id : product;
      await API.post("/cart/add", {
        productId,
        quantity: 1,
      });

      await fetchCart();
      const productName = typeof product === "object" ? product?.name : "";
      toast.success(productName ? `${productName} added to cart` : "Item added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add item to cart");
    }
  };

  const updateQuantity = async (productId, quantity) => {
    const safeQty = Math.max(1, Number(quantity) || 1);

    await API.put("/cart/update", {
      productId,
      quantity: safeQty,
    });

    fetchCart();
  };

  const removeItem = async (productId) => {
    await API.delete(`/cart/remove/${productId}`);
    fetchCart();
  };

  const clearCart = async () => {
    const items = [...cart];
    await Promise.all(items.map((item) => API.delete(`/cart/remove/${item.productId._id}`)));
    setCart([]);
  };

  const buyTotalOrder = async () => {
    const { data } = await API.post("/orders/from-cart", {});
    setCart([]);
    return data;
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        fetchCart,
        buyTotalOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
