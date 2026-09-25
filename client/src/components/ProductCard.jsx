import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Heart, ShoppingBag, Star } from 'lucide-react';
import { sample } from '../main';
import { useStore } from '../context/StoreContext';

function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const [addedAnim, setAddedAnim] = useState(false);
  const wish = isWishlisted(product.id);

  const finalPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product.id, 1);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  return (
    <div className="product-card group" id={`product-card-${product.id}`}>
      <div className="product-card-img-wrap">
        <Link to={'/product/' + product.id} style={{ display: 'contents' }}>
          <img
            src={sample(product)}
            alt={product.name}
            loading="lazy"
            className="product-img-main"
          />
        </Link>
        {product.discount > 0 && (
          <span className="product-discount-tag">-{product.discount}% OFF</span>
        )}
        {isOutOfStock ? (
          <span className="product-stock-tag out-of-stock">Sold Out</span>
        ) : isLowStock ? (
          <span className="product-stock-tag low-stock">Only {product.stock} Left</span>
        ) : null}

        <button
          className={`product-wishlist-btn ${wish ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          title={wish ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={wish ? 'Remove from wishlist' : 'Save to wishlist'}
          id={`wishlist-btn-${product.id}`}
        >
          <Heart size={16} fill={wish ? 'currentColor' : 'none'} />
        </button>
      </div>

      <span className="product-category-label">{product.category || 'Curated Accessory'}</span>
      <h3 className="product-card-title">
        <Link to={'/product/' + product.id} title={product.name}>
          {product.name}
        </Link>
      </h3>

      <div className="product-rating-row">
        <span className="stars-gold">
          <Star size={13} fill="currentColor" /> {Number(product.rating || 4.8).toFixed(1)}
        </span>
        <span className="rating-count">({Math.floor(Number(product.id) * 7 + 14)} reviews)</span>
      </div>

      <div className="product-price-row">
        <span className="current-price">₹{Math.round(finalPrice)}</span>
        {product.discount > 0 && (
          <span className="original-price">₹{product.price}</span>
        )}
      </div>

      <button
        className={`product-add-cart-btn ${addedAnim ? 'added' : ''} ${isOutOfStock ? 'disabled' : ''}`}
        onClick={handleQuickAdd}
        disabled={isOutOfStock}
        id={`add-cart-btn-${product.id}`}
      >
        {isOutOfStock ? (
          'Out of Stock'
        ) : addedAnim ? (
          <>
            <Check size={15} /> Added to Bag!
          </>
        ) : (
          <>
            <ShoppingBag size={15} /> Add to Bag
          </>
        )}
      </button>
    </div>
  );
}

export default ProductCard;
