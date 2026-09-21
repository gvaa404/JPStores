import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { sample } from '../main';
import { useStore } from '../context/StoreContext';

function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wish = isWishlisted(product.id);

  const finalPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  return (
    <div className="product-card">
      <div className="product-card-img-wrap">
        <Link to={'/product/' + product.id} style={{ display: 'contents' }}>
          <img src={sample(product)} alt={product.name} loading="lazy" />
        </Link>
        {product.discount > 0 && (
          <span className="product-discount-tag">-{product.discount}% OFF</span>
        )}
        <button
          className={`product-wishlist-btn ${wish ? 'active' : ''}`}
          onClick={() => toggleWishlist(product.id)}
          title={wish ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={16} fill={wish ? 'currentColor' : 'none'} />
        </button>
      </div>

      <span className="product-category-label">{product.category || 'Collection'}</span>
      <h3 className="product-card-title">
        <Link to={'/product/' + product.id}>{product.name}</Link>
      </h3>

      <div className="product-rating-row">
        <span className="stars-gold">
          <Star size={13} fill="currentColor" /> {Number(product.rating || 4.8).toFixed(1)}
        </span>
        <span className="rating-count">({Math.floor(Number(product.id) * 7 + 12)} reviews)</span>
      </div>

      <div className="product-price-row">
        <span className="current-price">₹{Math.round(finalPrice)}</span>
        {product.discount > 0 && (
          <span className="original-price">₹{product.price}</span>
        )}
      </div>

      <button className="product-add-cart-btn" onClick={() => addToCart(product.id, 1)}>
        <ShoppingBag size={15} /> Add to Cart
      </button>
    </div>
  );
}

export default ProductCard;
