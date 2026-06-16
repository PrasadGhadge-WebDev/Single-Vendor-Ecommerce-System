import { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import API from "../api";
import { AuthContext } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("shop_wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("shop_wishlist", JSON.stringify(wishlist));
    // Sync to backend if logged in
    if (user && user.token) {
      const wishlistIds = wishlist.map(item => typeof item === "object" ? item._id : item).filter(Boolean);
      API.put("/users/me", { wishlist: wishlistIds }).catch(err => console.error("Failed to sync wishlist", err));
    }
  }, [wishlist, user]);

  useEffect(() => {
    // If user logs in, fetch their profile to get their wishlist
    if (user && user.token) {
      API.get("/users/me").then(({ data }) => {
        if (data.wishlist && Array.isArray(data.wishlist)) {
          // Merge or just overwrite local wishlist with backend data?
          // Since it stores IDs, we can just fetch the wishlist products or merge.
          // Wait, the backend currently stores IDs in `wishlist` array.
          // If we just sync IDs, we might lose product objects.
          // The current `shop_wishlist` stores product objects.
        }
      }).catch(err => console.error("Failed to fetch user profile", err));
    }
  }, [user]);

  const toggleWishlist = (product) => {
    const productId = typeof product === "object" ? product?._id : product;
    const exists = wishlist.find((item) => (typeof item === "object" ? item._id : item) === productId);
    
    if (exists) {
      toast.info("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }

    setWishlist((prev) => {
      const alreadyExists = prev.find((item) => (typeof item === "object" ? item._id : item) === productId);
      if (alreadyExists) {
        return prev.filter((item) => (typeof item === "object" ? item._id : item) !== productId);
      } else {
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
