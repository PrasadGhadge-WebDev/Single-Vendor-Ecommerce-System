import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaTrash, FaShoppingCart, FaSearch, FaArrowRight } from "react-icons/fa";
import { useWishlist } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { getImageUrl } from "../api";
import "./Shop.css"; // Reuse shop styles for consistency

const FALLBACK_IMAGE = "https://placehold.co/420x320/f1f5f9/64748b?text=No+Image";

const Wishlist = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  const toCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <div className="shop-hero-glow shop-hero-glow-left" />
        <div className="shop-hero-glow shop-hero-glow-right" />

        <div className="container position-relative">
          <div className="shop-hero-copy">
            <p className="text-primary font-black uppercase tracking-widest text-[11px] mb-2">Personal Collection</p>
            <h1 className="text-primary-text font-black text-3xl md:text-5xl mb-2 leading-tight">
              My Wishlist
            </h1>
            <p className="text-muted-text max-w-lg mb-0">
              Your handpicked selection of premium electronics. Save them now, own them later.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-5">
        {wishlist.length === 0 ? (
          <div className="shop-empty-state p-5 text-center border-theme bg-surface-1 rounded-[40px] shadow-sm animate-fade-in-up">
            <div className="w-20 h-20 bg-surface-2 rounded-full d-flex align-items-center justify-content-center mx-auto mb-4">
              <FaHeart size={30} className="text-muted-text opacity-30" />
            </div>
            <h2 className="font-black mb-3">Your wishlist is empty</h2>
            <p className="text-muted-text max-w-md mx-auto mb-4">
              Explore our universe and handpick the items you love. They'll wait for you right here.
            </p>
            <Link to="/shop" className="btn btn-primary px-4 py-2 rounded-pill font-black uppercase tracking-widest text-xs">
              Explore Products <FaArrowRight className="ms-2" />
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {wishlist.map((product) => (
              <div className="col-md-6 col-lg-4 col-xl-3" key={product._id}>
                <div className="shop-grid-product-card border-theme h-100 d-flex flex-column rounded-[32px] overflow-hidden bg-surface-1 transition-all hover:shadow-xl group">
                  <div className="position-relative overflow-hidden">
                    <Link to={`/product/${product._id}`}>
                      <img
                        src={product.image ? getImageUrl(product.image) : FALLBACK_IMAGE}
                        alt={product.name}
                        className="w-100 transition-transform duration-700 group-hover:scale-110"
                        style={{ aspectRatio: "1/1", objectFit: "cover" }}
                      />
                    </Link>
                    <button
                      type="button"
                      className="position-absolute top-3 right-3 w-8 h-8 rounded-full border-none shadow-lg d-flex align-items-center justify-content-center bg-white text-danger transition-all hover:scale-110"
                      onClick={() => toggleWishlist(product)}
                      title="Remove from wishlist"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>

                  <div className="p-4 flex-grow-1 d-flex flex-column">
                    <div className="text-primary font-bold text-[10px] uppercase tracking-widest mb-2">
                      {product.category || "General"}
                    </div>
                    <Link to={`/product/${product._id}`} className="text-decoration-none text-primary-text hover:text-primary transition-colors mb-2">
                      <h5 className="font-black text-lg line-clamp-1">{product.name}</h5>
                    </Link>

                    <div className="mt-auto">
                      <div className="font-black text-xl text-primary mb-3">{toCurrency(product.price)}</div>
                      <button
                        className="btn btn-cart-action w-100 py-2 rounded-pill font-black uppercase tracking-widest text-[11px] d-flex align-items-center justify-content-center gap-2"
                        onClick={() => addToCart(product)}
                      >
                        <FaShoppingCart size={12} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Wishlist;
