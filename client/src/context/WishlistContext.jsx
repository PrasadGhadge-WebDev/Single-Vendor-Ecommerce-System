import { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("shop_wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("shop_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (product) => {
    const productId = typeof product === "object" ? product?._id : product;
    setWishlist((prev) => {
      const exists = prev.find((item) => (typeof item === "object" ? item._id : item) === productId);
      if (exists) {
        toast.info("Removed from wishlist");
        return prev.filter((item) => (typeof item === "object" ? item._id : item) !== productId);
      } else {
        toast.success("Added to wishlist");
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => (typeof item === "object" ? item._id : item) === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
