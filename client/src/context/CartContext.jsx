import { createContext, useState, useEffect, useContext } from "react";
import API from "../api";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchCart = async () => {
    if (!user) return;
    try {
      const { data } = await API.get("/cart");
      setCart(data?.items || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Don't toast for 401 as it's expected when not logged in or token expires
      if (error.response?.status !== 401) {
        toast.error("Failed to load cart");
      }
    }
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
    if (user) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

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
