import React, { useEffect, useState, useContext, createContext, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate, useLocation, Routes, Route, Link, useParams } from 'react-router-dom';
import {
  ShoppingBag, Heart, User, LogOut, Package, Settings,
  LayoutDashboard, Users, CreditCard, Plus, Trash2, Edit, Truck, X, Eye, EyeOff,
  CheckCircle2, AlertCircle, Mail, ShieldCheck, MapPin, Navigation,
  Home as HomeIcon, Briefcase, Phone, Check, Loader2, Star, SlidersHorizontal,
  ChevronDown, ChevronUp, ChevronRight, ArrowRight, Sparkles, RefreshCw,
  HelpCircle, Send, MessageSquare, Filter, Clock, Box, Share2, PackageCheck
} from 'lucide-react';
import './styles.css';
import {
  toastSuccess, toastError, alertSuccess, alertError, alertWarning, alertInfo, confirmDialog
} from './utils/alert';
import api from './services/api';
import Footer from './components/Footer';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import { StoreProvider, useStore } from './context/StoreContext';

// Image helper — Returns product upload or curated high-res boutique image
export const sample = p => {
  if (p?.image && (p.image.startsWith('http://') || p.image.startsWith('https://') || p.image.startsWith('/uploads'))) {
    return p.image;
  }
  const name = (p?.name || '').toLowerCase();
  const cat = (p?.category || '').toLowerCase();

  if (name.includes('journal') || name.includes('planner') || name.includes('notebook') || cat.includes('stationery')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
  }
  if (name.includes('gift') || name.includes('box') || cat.includes('gift')) {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';
  }
  if (name.includes('pen') || name.includes('writing') || cat.includes('pen')) {
    return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80';
  }
  if (name.includes('sticker') || cat.includes('sticker')) {
    return 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80';
  }
  if (name.includes('jewel') || name.includes('earring') || name.includes('necklace') || name.includes('ring') || name.includes('pendant') || name.includes('pearl') || cat.includes('jewel')) {
    return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80';
  }
  if (name.includes('hair') || name.includes('pin') || name.includes('clip') || name.includes('bow') || name.includes('scrunchie') || cat.includes('hair')) {
    return 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80';
};

// ==========================================================================
// HOME PAGE (HERO, TRUST BADGES, 4 SECTIONS)
// ==========================================================================
function Home() {
  const { products } = useStore();

  const bestSellers = useMemo(() => {
    return products.filter(p => (p.rating || 0) >= 4.8).slice(0, 4);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products].sort((a, b) => b.id - a.id).slice(0, 4);
  }, [products]);

  const trendingProducts = useMemo(() => {
    return products.slice(2, 6);
  }, [products]);

  const collections = [
    {
      title: 'Handcrafted Jewellery',
      desc: 'Pendants, Pearls & Crystal Rings',
      cat: 'Jewellery',
      img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Silk & Gold Hairpins',
      desc: 'Mulberry Silk Bows & Botanical Pins',
      cat: 'Hair Accessories',
      img: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Luxury Keepsake Boxes',
      desc: 'Velvet Organisers & Trinket Cases',
      cat: 'Luxury Gift Boxes',
      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Artisanal Stationery',
      desc: 'Gilded Edge Planners & Pen Sets',
      cat: 'Stationery',
      img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <>
      <Header />

      {/* 1. HERO SECTION */}
      <section className="hero-wrapper">
        <div className="hero-banner">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <Sparkles size={14} /> JEWELLERY • ACCESSORIES • FOR A BRIGHTER YOU
            </span>
            <h1 className="hero-title">
              Elegance, Made <em>for You</em>
            </h1>
            <p className="hero-desc">
              Discover timeless accessories designed to add a little sparkle to every moment. Handcrafted with skin-friendly metals and ethereal gemstones.
            </p>
            <div className="hero-actions">
              <Link className="btn-primary btn-lg" to="/shop">
                SHOP NOW <ArrowRight size={17} />
              </Link>
              <Link className="btn-secondary btn-lg" to="/shop?category=Jewellery">
                DISCOVER COLLECTIONS
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-card">
              <img
                src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
                alt="Floral Pearl Rose Stud Earrings"
              />
              <div className="hero-float-badge">
                <div className="badge-icon">★</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Trending Collection</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Over 5,000+ Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST BADGES */}
      <section className="trust-badges-bar">
        <div className="trust-badges-grid">
          <div className="trust-item">
            <div className="trust-icon-box">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="trust-title">Premium Quality</div>
              <div className="trust-subtitle">Hypoallergenic & Handcrafted with Care</div>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="trust-title">Secure Payment</div>
              <div className="trust-subtitle">100% Encrypted Razorpay Checkout</div>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box">
              <Truck size={24} />
            </div>
            <div>
              <div className="trust-title">Fast Delivery</div>
              <div className="trust-subtitle">Express Pan-India Delivery in 2-4 Days</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 1: BEST SELLERS */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">MOST COVETED</div>
            <h2 className="section-title">Best Sellers</h2>
          </div>
          <Link className="section-view-all" to="/shop">
            View All Best Sellers <ChevronRight size={16} />
          </Link>
        </div>
        <div className="products-grid">
          {bestSellers.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 4. SECTION 2: NEW ARRIVALS */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">FRESH DROPS</div>
            <h2 className="section-title">New Arrivals</h2>
          </div>
          <Link className="section-view-all" to="/shop">
            Explore All New <ChevronRight size={16} />
          </Link>
        </div>
        <div className="products-grid">
          {newArrivals.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 5. SECTION 3: FEATURED COLLECTIONS */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">CURATED AESTHETICS</div>
            <h2 className="section-title">Featured Collections</h2>
          </div>
        </div>
        <div className="collections-grid">
          {collections.map(c => (
            <div className="collection-card" key={c.title}>
              <img className="collection-card-img" src={c.img} alt={c.title} />
              <div className="collection-card-body">
                <h3 className="collection-card-title">{c.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{c.desc}</p>
                <Link className="collection-card-link" to={`/shop?category=${encodeURIComponent(c.cat)}`}>
                  Shop Collection <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SECTION 4: TRENDING PRODUCTS */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">POPULAR THIS WEEK</div>
            <h2 className="section-title">Trending Products</h2>
          </div>
          <Link className="section-view-all" to="/shop">
            See All Trending <ChevronRight size={16} />
          </Link>
        </div>
        <div className="products-grid">
          {trendingProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

// ==========================================================================
// SHOP / CATALOG PAGE WITH REAL-TIME FILTERS
// ==========================================================================
function Shop() {
  const { products, categories } = useStore();
  const loc = useLocation();
  const nav = useNavigate();
  const searchParams = new URLSearchParams(loc.search);

  const selectedCategory = searchParams.get('category') || '';
  const searchWord = searchParams.get('search') || '';

  const [maxPrice, setMaxPrice] = useState(2500);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (searchWord) {
        const query = searchWord.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);
        const matchesCat = p.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      const finalPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
      if (finalPrice > maxPrice) return false;
      if (minRating > 0 && (p.rating || 4.5) < minRating) return false;
      if (inStockOnly && (p.stock || 0) <= 0) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.discount > 0 ? a.price * (1 - a.discount / 100) : a.price;
      const priceB = b.discount > 0 ? b.price * (1 - b.discount / 100) : b.price;

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest') return b.id - a.id;
      return 0;
    });
  }, [products, selectedCategory, searchWord, maxPrice, minRating, inStockOnly, sortBy]);

  const handleCategorySelect = cat => {
    const params = new URLSearchParams(loc.search);
    if (!cat) {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    nav('/shop?' + params.toString());
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(loc.search);
    params.delete('search');
    nav('/shop?' + params.toString());
  };

  const activeFiltersCount = (selectedCategory ? 1 : 0) + (searchWord ? 1 : 0) + (maxPrice < 2500 ? 1 : 0) + (minRating > 0 ? 1 : 0) + (inStockOnly ? 1 : 0);

  const filterSidebarContent = (
    <>
      <div className="filter-group">
        <h3 className="filter-title">
          <span>Categories</span>
          {selectedCategory && (
            <button
              style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}
              onClick={() => handleCategorySelect('')}
            >
              Clear
            </button>
          )}
        </h3>
        <div className="category-pills">
          <button
            className={`category-pill ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategorySelect('')}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c}
              className={`category-pill ${selectedCategory === c ? 'active' : ''}`}
              onClick={() => handleCategorySelect(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h3 className="filter-title">Price Range</h3>
        <div className="price-slider-wrap">
          <input
            type="range"
            min="100"
            max="3000"
            step="50"
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
          />
          <div className="price-range-labels">
            <span>₹100</span>
            <span>Max: ₹{maxPrice}</span>
          </div>
        </div>
      </div>

      <div className="filter-group">
        <h3 className="filter-title">Customer Rating</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'All Ratings', val: 0 },
            { label: '4.5★ & above', val: 4.5 },
            { label: '4.0★ & above', val: 4.0 }
          ].map(r => (
            <label key={r.val} className="filter-checkbox-item">
              <input
                type="radio"
                name="rating"
                checked={minRating === r.val}
                onChange={() => setMinRating(r.val)}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h3 className="filter-title">Availability</h3>
        <label className="filter-checkbox-item">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={e => setInStockOnly(e.target.checked)}
          />
          <span>In Stock Only</span>
        </label>
      </div>

      <button
        className="btn-secondary btn-block btn-sm"
        onClick={() => {
          setMaxPrice(3000);
          setMinRating(0);
          setInStockOnly(false);
          handleCategorySelect('');
        }}
      >
        Reset All Filters
      </button>
    </>
  );

  return (
    <>
      <Header />

      <main className="shop-layout">
        {/* Sidebar Filters Desktop */}
        <aside className="filter-sidebar">
          {filterSidebarContent}
        </aside>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="mobile-filter-backdrop" onClick={() => setMobileFilterOpen(false)}>
            <div className="mobile-filter-drawer" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px' }}>Filter Catalog</h3>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
                  onClick={() => setMobileFilterOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              {filterSidebarContent}
              <button
                className="btn-primary btn-block"
                style={{ marginTop: '20px' }}
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply & View ({filteredProducts.length}) Results
              </button>
            </div>
          </div>
        )}

        {/* Products Column */}
        <section>
          <div className="shop-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="mobile-filter-btn"
                onClick={() => setMobileFilterOpen(true)}
              >
                <Filter size={15} /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>

              <div className="shop-results-count">
                Showing <strong>{filteredProducts.length}</strong> items
                {selectedCategory && <span> in <strong>{selectedCategory}</strong></span>}
                {searchWord && <span> matching "<strong>{searchWord}</strong>"</span>}
              </div>
            </div>

            <div className="shop-sort-wrap">
              <label htmlFor="shop-sort">Sort by:</label>
              <select
                id="shop-sort"
                className="shop-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="featured">Featured Picks</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {activeFiltersCount > 0 && (
            <div className="active-filters-strip">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Active filters:</span>
              {selectedCategory && (
                <span className="active-filter-tag">
                  Category: {selectedCategory}
                  <button onClick={() => handleCategorySelect('')} title="Remove category filter">
                    <X size={13} />
                  </button>
                </span>
              )}
              {searchWord && (
                <span className="active-filter-tag">
                  Search: "{searchWord}"
                  <button onClick={handleClearSearch} title="Clear search">
                    <X size={13} />
                  </button>
                </span>
              )}
              {maxPrice < 2500 && (
                <span className="active-filter-tag">
                  Under ₹{maxPrice}
                  <button onClick={() => setMaxPrice(3000)} title="Reset price limit">
                    <X size={13} />
                  </button>
                </span>
              )}
              {minRating > 0 && (
                <span className="active-filter-tag">
                  ★ {minRating}+
                  <button onClick={() => setMinRating(0)} title="Reset rating">
                    <X size={13} />
                  </button>
                </span>
              )}
              {inStockOnly && (
                <span className="active-filter-tag">
                  In Stock Only
                  <button onClick={() => setInStockOnly(false)} title="Reset stock filter">
                    <X size={13} />
                  </button>
                </span>
              )}
              <button
                style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}
                onClick={() => {
                  setMaxPrice(3000);
                  setMinRating(0);
                  setInStockOnly(false);
                  handleCategorySelect('');
                  handleClearSearch();
                }}
              >
                Clear All
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="neu-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Sparkles size={40} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No treasures found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                We couldn't find any items matching your selected criteria. Try adjusting your filters.
              </p>
              <button
                className="btn-primary btn-sm"
                onClick={() => {
                  setMaxPrice(3000);
                  setMinRating(0);
                  setInStockOnly(false);
                  handleCategorySelect('');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

// ==========================================================================
// PRODUCT DETAILS PAGE (GALLERY, TABS, REVIEWS, ACCORDIONS)
// ==========================================================================
function ProductDetails() {
  const { id } = useParams();
  const nav = useNavigate();  // Bug 5 fix: SPA navigation for Buy Now
  const { products, addToCart, toggleWishlist, isWishlisted, user } = useStore();
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [quantity, setQuantity] = useState(1);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const found = products.find(p => String(p.id) === String(id));
    if (found) {
      setProduct(found);
      setSelectedImgIndex(0);
    } else {
      api.get('/products/' + id).then(r => {
        setProduct(r.data);
        setSelectedImgIndex(0);
      }).catch(() => {});
    }
  }, [id, products]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const main = sample(product);
    const cat = (product.category || '').toLowerCase();
    return [
      main,
      cat.includes('stationery')
        ? 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
      cat.includes('hair')
        ? 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1611591475825-78322c3666d6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
    ];
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && (p.category === product.category || (p.rating || 0) >= 4.7))
      .slice(0, 4);
  }, [products, product]);

  if (!product) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 24px' }}>
          <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <p>Unveiling product details...</p>
        </div>
        <Footer />
      </>
    );
  }

  const wish = isWishlisted(product.id);
  const finalPrice = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const savings = product.discount > 0 ? product.price - finalPrice : 0;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toastSuccess('Product link copied to clipboard! ✨');
    } else {
      toastSuccess('Link ready to share!');
    }
  };

  const handleReviewSubmit = async e => {
    e.preventDefault();
    if (!user) {
      return alertInfo('Sign In Required', 'Please sign in to submit a review for this piece.');
    }
    if (!userReview.comment.trim()) {
      return alertWarning('Missing Feedback', 'Please write a brief comment sharing your experience.');
    }
    try {
      await api.post('/reviews/' + product.id, userReview);
      setReviewSubmitted(true);
      alertSuccess('Review Submitted', 'Thank you for sharing your sparkle with us!');
    } catch (err) {
      if (err.response?.status === 401) {
        alertInfo('Sign In Required', 'Please sign in to submit your review.');
      } else {
        alertError('Review Submission', err.response?.data?.error || 'Could not submit review at this time.');
      }
    }
  };

  return (
    <>
      <Header />

      <main className="product-details-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        {/* Main Grid */}
        <div className="product-detail-grid">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="gallery-main-frame">
              <img
                src={galleryImages[selectedImgIndex] || sample(product)}
                alt={product.name}
                style={{ transition: 'all 0.3s ease' }}
              />
            </div>
            <div className="gallery-thumbs">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={`gallery-thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImgIndex(idx)}
                  title={`View image ${idx + 1}`}
                >
                  <img src={imgUrl} alt={`${product.name} angle ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Info Panel */}
          <div className="product-info-panel">
            <span className="product-info-badge">{product.category}</span>
            <h1 className="product-detail-title">{product.name}</h1>

            <div className="product-detail-rating">
              <span className="stars-gold">
                <Star size={16} fill="currentColor" /> {Number(product.rating || 4.9).toFixed(1)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>38 Verified Buyer Ratings</span>
            </div>

            <div className="product-detail-price-box">
              <span className="product-detail-price">₹{Math.round(finalPrice)}</span>
              {product.discount > 0 && (
                <>
                  <span className="product-detail-mrp">₹{product.price}</span>
                  <span className="product-detail-discount-pill">
                    Save ₹{Math.round(savings)} ({product.discount}% OFF)
                  </span>
                </>
              )}
            </div>

            <div className={`stock-indicator ${(product.stock || 20) > 5 ? 'in-stock' : 'low-stock'}`}>
              <span className="stock-pulse" />
              <span>{(product.stock || 20) > 5 ? `In Stock (${product.stock || 20} available)` : 'Hurry, only a few pieces left!'}</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              {product.description || 'Thoughtfully crafted with skin-safe luxury finishes and ethereal charm.'}
            </p>

            {/* Quantity Stepper */}
            <div className="product-quantity-row">
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Quantity:</span>
              <div className="qty-stepper">
                <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <div className="qty-display">{quantity}</div>
                <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="product-action-buttons">
              <button
                className="btn-primary"
                onClick={() => addToCart(product.id, quantity)}
              >
                <ShoppingBag size={18} /> Add to Cart
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  addToCart(product.id, quantity);
                  nav('/checkout');  // Bug 5 fix: SPA nav — no full page reload
                }}
              >
                Buy Now
              </button>
              <button
                className={`neu-icon-btn ${wish ? 'active' : ''}`}
                onClick={() => toggleWishlist(product.id)}
                title={wish ? 'Remove from wishlist' : 'Save to wishlist'}
                style={{ width: '48px', height: '48px' }}
              >
                <Heart size={20} fill={wish ? 'currentColor' : 'none'} color={wish ? 'var(--primary)' : 'currentColor'} />
              </button>
              <button
                type="button"
                className="neu-icon-btn"
                onClick={handleShare}
                title="Share product link"
                style={{ width: '48px', height: '48px' }}
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Fast Perks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Truck size={17} color="var(--primary)" /> Fast 2-4 Day Pan-India Delivery
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <RefreshCw size={17} color="var(--primary)" /> 14-Day Easy Return / Exchange
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Accordions */}
        <div className="product-tabs-header">
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Product Details & Styling
          </button>
          <button
            className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Materials & Specifications
          </button>
          <button
            className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Shipping & Pan-India Delivery
          </button>
          <button
            className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            14-Day Return Guarantee
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Customer Reviews (38)
          </button>
        </div>

        <div className="tab-content-panel">
          {activeTab === 'details' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Design & Inspiration</h3>
              <p style={{ marginBottom: '14px' }}>
                Every piece at <strong>JP Store – Pretty Picks</strong> is sculpted to deliver everyday refinement without compromising on comfort.
                Whether accessorising for work presentations, festive gatherings, or brunch outings, this piece adds an unmistakable soft luxury aura.
              </p>
              <h4 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--primary-dark)' }}>Styling Tips:</h4>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Layer with minimal dainty chains or delicate wrist cuffs for a trendy aesthetic.</li>
                <li>Complements warm pastel silks, crisp white blouses, and deep velvet tones seamlessly.</li>
                <li>Store in the provided micro-suede pouch to preserve high-lustre brilliance.</li>
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Materials & Craftsmanship</h3>
              <table style={{ width: '100%', maxWidth: '600px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Material Finish</td>
                    <td style={{ padding: '8px 0' }}>18K Rose Gold electroplate / Skin-Safe Brass Alloy</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Gemstones / Accents</td>
                    <td style={{ padding: '8px 0' }}>Hand-faceted AAAA Grade Zircon & Freshwater Cultured Pearl</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Hypoallergenic</td>
                    <td style={{ padding: '8px 0' }}>Yes (100% Nickel-free, Lead-free, Cadmium-free)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Care Instructions</td>
                    <td style={{ padding: '8px 0' }}>Wipe gently with soft cotton cloth. Avoid direct contact with perfume and chlorine.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Shipping Information</h3>
              <p style={{ marginBottom: '12px' }}>
                Orders are processed and dispatched within 24 hours from our fulfillment hub.
              </p>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Metro Cities (Delhi, Mumbai, Bengaluru, Chennai, Kolkata):</strong> 2 to 3 Business Days</li>
                <li><strong>Rest of India:</strong> 3 to 5 Business Days</li>
                <li><strong>Free Shipping:</strong> Automatically applied on all orders above ₹999.</li>
                <li>Real-time SMS & Email tracking notifications sent immediately upon dispatch.</li>
              </ul>
            </div>
          )}

          {activeTab === 'returns' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Hassle-Free 14-Day Returns & Exchange</h3>
              <p style={{ marginBottom: '12px' }}>
                We want you to adore everything you pick! If your piece does not meet your expectations, you can request an instant return or exchange within 14 days of delivery.
              </p>
              <p>Items must be unused with original tags and packaging intact. Refunds are initiated instantly to your original payment method upon doorstep pickup verification.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '20px' }}>Customer Reviews & Experiences</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className="stars-gold"><Star size={16} fill="currentColor" /> 4.9 out of 5</span>
                    <span style={{ color: 'var(--text-muted)' }}>Based on 38 verified reviews</span>
                  </div>
                </div>
              </div>

              {/* Sample Reviews */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
                <div className="neu-inset-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Pooja Sharma</span>
                    <span className="stars-gold">★★★★★</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    "The rose blush finish is even more breathtaking in person! The packaging felt like a bespoke boutique unboxing. Arrived in just 2 days in Bangalore."
                  </p>
                </div>
                <div className="neu-inset-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Ananya Roy</span>
                    <span className="stars-gold">★★★★★</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    "Extremely lightweight and hypoallergenic! Wore it all day without any irritation. Pretty Picks is now my go-to for gifting."
                  </p>
                </div>
              </div>

              {/* Write Review Form */}
              <div className="neu-card">
                <h4 style={{ fontSize: '16px', marginBottom: '14px' }}>Write a Customer Review</h4>
                <form onSubmit={handleReviewSubmit}>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <select
                      className="form-control"
                      value={userReview.rating}
                      onChange={e => setUserReview({ ...userReview, rating: Number(e.target.value) })}
                    >
                      <option value="5">★★★★★ (5 Stars - Exceptional)</option>
                      <option value="4">★★★★☆ (4 Stars - Great)</option>
                      <option value="3">★★★☆☆ (3 Stars - Average)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Thoughts & Feedback</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Share what you loved about this piece..."
                      value={userReview.comment}
                      onChange={e => setUserReview({ ...userReview, comment: e.target.value })}
                    />
                  </div>
                  <button className="btn-primary btn-sm" type="submit">Submit Review</button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* You May Also Adore */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: '56px', borderTop: '1px solid var(--border-light)', paddingTop: '40px' }}>
            <div className="section-header">
              <div>
                <div className="section-eyebrow">COMPLETE YOUR LOOK</div>
                <h2 className="section-title">You May Also Adore</h2>
              </div>
              <Link className="section-view-all" to={`/shop?category=${encodeURIComponent(product.category)}`}>
                More in {product.category} <ChevronRight size={16} />
              </Link>
            </div>
            <div className="products-grid">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

// ==========================================================================
// CART PAGE
// ==========================================================================
function Cart() {
  const { cart, products, updateCartQty, removeFromCart, clearCart, toggleWishlist, isWishlisted } = useStore();
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const cartDetails = useMemo(() => {
    return cart
      .map(item => ({
        ...item,
        product: products.find(p => p.id === item.product_id)
      }))
      .filter(item => item.product);
  }, [cart, products]);

  const subtotal = useMemo(() => {
    return cartDetails.reduce((sum, item) => {
      const p = item.product;
      const unit = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
      return sum + unit * item.quantity;
    }, 0);
  }, [cartDetails]);

  const couponSavings = (subtotal * discountPercent) / 100;
  const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 49;
  const grandTotal = Math.max(0, subtotal - couponSavings + shippingFee);

  const applyCouponCode = code => {
    const clean = (code || couponCode).trim().toUpperCase();
    if (clean === 'PRETTY10') {
      setDiscountPercent(10);
      setCouponCode('PRETTY10');
      alertSuccess('Coupon Applied! ✨', 'Enjoy 10% instant discount on your order.');
    } else {
      alertWarning('Invalid Coupon', 'Code not recognised. Try using "PRETTY10".');
    }
  };

  const handleMoveToWishlist = (productId) => {
    if (!isWishlisted(productId)) {
      toggleWishlist(productId);
    }
    removeFromCart(productId);
    toastSuccess('Moved to your wishlist! 💖');
  };

  const freeShippingThreshold = 999;
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <>
      <Header />

      <main className="cart-layout">
        {/* Items List */}
        <div className="cart-items-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
            <h2 style={{ fontSize: '24px' }}>Shopping Bag ({cart.length})</h2>
            {cart.length > 0 && (
              <button
                style={{ fontSize: '13px', color: 'var(--error)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => confirmDialog('Empty Bag?', 'Remove all items from your bag?').then(r => r.isConfirmed && clearCart())}
              >
                Clear Bag
              </button>
            )}
          </div>

          {/* Free Shipping Progress Meter */}
          {subtotal > 0 && (
            <div className="delivery-progress-box">
              <div className="delivery-progress-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Truck size={16} color="var(--primary)" />
                  {subtotal >= freeShippingThreshold ? (
                    <span style={{ color: 'var(--success)' }}>🎉 You have qualified for FREE Shipping!</span>
                  ) : (
                    <span>Add <strong>₹{Math.round(freeShippingThreshold - subtotal)}</strong> more for <strong>FREE Shipping</strong></span>
                  )}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-dark)' }}>{shippingProgress}%</span>
              </div>
              <div className="delivery-progress-track">
                <div className="delivery-progress-fill" style={{ width: `${shippingProgress}%` }} />
              </div>
            </div>
          )}

          {cartDetails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <ShoppingBag size={48} color="var(--primary-light)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Your shopping bag is empty</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Discover our curated jewellery and accessories to fill it with beauty.
              </p>
              <Link className="btn-primary btn-sm" to="/shop">
                Explore Collections
              </Link>
            </div>
          ) : (
            <div>
              {cartDetails.map(item => {
                const p = item.product;
                const unitPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
                const lineTotal = unitPrice * item.quantity;

                return (
                  <div className="cart-item-row" key={item.product_id}>
                    <img className="cart-item-img" src={sample(p)} alt={p.name} />
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">
                        <Link to={'/product/' + p.id}>{p.name}</Link>
                      </h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{p.category}</div>
                      <div className="cart-item-price">₹{Math.round(unitPrice)}</div>
                    </div>

                    <div className="qty-stepper">
                      <button className="qty-btn" onClick={() => updateCartQty(item.product_id, item.quantity - 1)}>-</button>
                      <div className="qty-display">{item.quantity}</div>
                      <button className="qty-btn" onClick={() => updateCartQty(item.product_id, item.quantity + 1)}>+</button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '95px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>₹{Math.round(lineTotal)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', alignItems: 'flex-end' }}>
                        <button
                          style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onClick={() => handleMoveToWishlist(item.product_id)}
                          title="Save to Wishlist"
                        >
                          Move to Wishlist
                        </button>
                        <button
                          style={{ fontSize: '12px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary-card">
          <h3 className="summary-title">Order Summary</h3>

          <div className="summary-row">
            <span>Bag Subtotal</span>
            <span>₹{Math.round(subtotal)}</span>
          </div>

          {discountPercent > 0 && (
            <div className="summary-row" style={{ color: 'var(--success)' }}>
              <span>Pretty Picks Discount (10%)</span>
              <span>-₹{Math.round(couponSavings)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Standard Shipping</span>
            <span>{shippingFee === 0 ? <strong style={{ color: 'var(--success)' }}>FREE</strong> : `₹${shippingFee}`}</span>
          </div>

          <div className="coupon-box">
            <input
              type="text"
              placeholder="Promo Code (PRETTY10)"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
            />
            <button className="btn-secondary btn-sm" onClick={() => applyCouponCode()}>Apply</button>
          </div>

          {/* Quick coupon chips */}
          <div className="quick-coupons-row">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Offers:</span>
            <button
              type="button"
              className={`quick-coupon-chip ${discountPercent === 10 ? 'applied' : ''}`}
              onClick={() => applyCouponCode('PRETTY10')}
            >
              {discountPercent === 10 ? '✓ PRETTY10 APPLIED' : '🏷️ PRETTY10 (10% OFF)'}
            </button>
          </div>

          <div className="summary-row total">
            <span>Total Payable</span>
            <span style={{ color: 'var(--primary-dark)' }}>₹{Math.round(grandTotal)}</span>
          </div>

          {cartDetails.length > 0 && (
            <Link className="btn-primary btn-block" style={{ marginTop: '20px' }} to="/checkout">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
          )}

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="var(--success)" /> 100% Encrypted & Safe Razorpay Checkout
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// ==========================================================================
// CHECKOUT & SPLIT ADDRESS & MANDATORY RAZORPAY TEST MODAL
// ==========================================================================
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
];

function RazorpayCheckoutModal({ isOpen, onClose, orderData, onPaymentSuccess, onPaymentFailure }) {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('success@razorpay');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      if (upiId.trim().toLowerCase() === 'success@razorpay') {
        const dummyPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 12);
        onPaymentSuccess({
          razorpay_payment_id: dummyPaymentId,
          razorpay_order_id: orderData.razorpay_order_id,
          razorpay_signature: 'sig_test_valid'
        });
      } else {
        onPaymentFailure({
          code: 'PAYMENT_FAILED',
          description: 'Payment failed with test failure UPI ID'
        });
      }
    }, 1200);
  };

  return (
    <div className="mobile-drawer-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="neu-card" style={{ maxWidth: '480px', width: '92%', padding: '28px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em' }}>TEST MODE GATEWAY</span>
            <h3 style={{ fontSize: '20px' }}>Razorpay Secure Checkout</h3>
          </div>
          <button className="neu-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="neu-inset-box" style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
            <span>Order Reference:</span>
            <strong>{orderData.razorpay_order_id || 'RZP-ORD-TEST'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--primary-dark)' }}>
            <span>Amount to Pay:</span>
            <span>₹{Math.round(orderData.amount)}</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Test Payment Instrument</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              className={`category-pill ${selectedMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('upi')}
            >
              UPI Virtual IDs
            </button>
            <button
              className={`category-pill ${selectedMethod === 'card' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('card')}
            >
              Test Cards
            </button>
          </div>

          {selectedMethod === 'upi' ? (
            <div>
              <label className="form-label" style={{ fontSize: '12.5px' }}>Select or Enter Test UPI ID:</label>
              <input
                className="form-control"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="success@razorpay"
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '11.5px', color: 'var(--success)' }}
                  onClick={() => setUpiId('success@razorpay')}
                >
                  ✓ success@razorpay (Pass)
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '11.5px', color: 'var(--error)' }}
                  onClick={() => setUpiId('failure@razorpay')}
                >
                  ✗ failure@razorpay (Fail)
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Standard Razorpay Test Cards supported. To test immediate UPI flow, please switch back to the UPI tab.
            </div>
          )}
        </div>

        <button
          className="btn-primary btn-block"
          onClick={handlePay}
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="animate-spin" size={17} /> Authorising Payment...
            </>
          ) : (
            `Pay ₹${Math.round(orderData.amount)} Securely`
          )}
        </button>
      </div>
    </div>
  );
}

function Checkout() {
  const { cart, products, user, clearCart, authLoading } = useStore();
  const nav = useNavigate();

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    flat: '',
    street: '',
    landmark: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: ''
  });

  const [locating, setLocating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderSession, setOrderSession] = useState(null);

  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  // Cart total calculations
  const cartDetails = useMemo(() => {
    return cart
      .map(item => ({ ...item, p: products.find(p => p.id === item.product_id) }))
      .filter(x => x.p);
  }, [cart, products]);

  const subtotal = cartDetails.reduce((sum, item) => {
    const unit = item.p.discount > 0 ? item.p.price * (1 - item.p.discount / 100) : item.p.price;
    return sum + unit * item.quantity;
  }, 0);
  const shipping = subtotal >= 999 ? 0 : 49;
  const total = subtotal + shipping;

  // GPS Location Fetch
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      return alertWarning('Geolocation Unavailable', 'Your browser does not support GPS location fetch.');
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await api.get('/geocode/reverse', { params: { lat: latitude, lon: longitude } });
          const d = res.data;
          setAddress(prev => ({
            ...prev,
            street: d.street || d.area || prev.street,  // Bug 6 fix: geocode returns area not street
            city: d.city || prev.city,
            state: d.state || prev.state,
            pincode: d.pincode || prev.pincode
          }));
          toastSuccess('GPS location auto-filled! ✨');
        } catch {
          toastError('Could not resolve GPS address. Please fill manually.');
        } finally {
          setLocating(false);
        }
      },
      err => {
        setLocating(false);
        alertWarning('Location Access Denied', 'Please allow GPS access or fill in your address manually.');
      },
      { timeout: 10000 }
    );
  };

  // PIN Code Auto Lookup
  const handlePincodeChange = async pin => {
    setAddress(prev => ({ ...prev, pincode: pin }));
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      try {
        const res = await api.get('/geocode/pincode/' + pin);
        if (res.data.city) {
          setAddress(prev => ({
            ...prev,
            city: res.data.city,
            state: res.data.state || prev.state
          }));
          toastSuccess(`PIN code verified: ${res.data.city}, ${res.data.state}`);
        }
      } catch {
        // silent fallback
      }
    }
  };

  // Start Razorpay Payment Flow
  const handleStartPayment = async e => {
    e.preventDefault();
    if (!localStorage.getItem('jp_token')) {
      return alertInfo('Sign In Required', 'Please sign in to place your order.');
    }
    if (cart.length === 0) {
      return alertWarning('Empty Bag', 'Please add items before checking out.');
    }
    if (!address.name || !address.phone || !address.flat || !address.street || !address.city || !address.pincode) {
      return alertWarning('Incomplete Delivery Address', 'Please fill out all address fields.');
    }

    try {
      const fullAddressString = `${address.name} | Ph: ${address.phone}, ${address.flat}, ${address.street}, Landmark: ${address.landmark || 'N/A'}, ${address.city}, ${address.state} - ${address.pincode}`;

      // 1. Create Razorpay Order
      const rzpRes = await api.post('/payment/create-order', {
        amount: total,
        address: fullAddressString,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      });

      setOrderSession({
        razorpay_order_id: rzpRes.data.order_id,
        amount: total,
        address: fullAddressString,
        items: cart
      });

      // Open Modal
      setModalOpen(true);
    } catch (err) {
      alertError('Order Initiation Failed', err.response?.data?.error || 'Could not initiate Razorpay order.');
    }
  };

  const handlePaymentSuccess = async paymentResult => {
    setModalOpen(false);
    try {
      // 2. Verify with backend & place order
      const verifyRes = await api.post('/payment/verify', {
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
        orderData: {
          items: orderSession.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          address: orderSession.address,
          payment_method: 'Razorpay (Test UPI)'
        }
      });

      clearCart();
      alertSuccess(
        'Order Placed Successfully! 🎉',
        `Your order #${verifyRes.data.order_id} is confirmed. A confirmation and invoice have been sent to your email.`
      );
      nav('/orders/' + verifyRes.data.order_id);
    } catch (err) {
      alertError('Payment Verification Failed', err.response?.data?.error || 'Verification error');
    }
  };

  const handlePaymentFailure = err => {
    setModalOpen(false);
    alertError('Payment Failed', 'The payment could not be processed. Please try again with success@razorpay.');
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 24px' }}>
          <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p>Verifying secure checkout session...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="neu-card" style={{ padding: '48px 32px' }}>
            <User size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Sign in to Checkout</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please sign in or create an account to proceed with your delivery details and secure payment.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link className="btn-primary" to="/login?redirect=/checkout">Sign In</Link>
              <Link className="btn-secondary" to="/login?redirect=/checkout">Create Account</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="checkout-layout">
        {/* Address Form */}
        <div className="cart-items-card">
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Delivery Address</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            Where should we send your Pretty Picks package?
          </p>

          <div className="gps-location-banner">
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>⚡ Auto-fill with GPS</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Instant locality and PIN code detection</div>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleFetchLocation}
              disabled={locating}
            >
              {locating ? <Loader2 className="animate-spin" size={15} /> : <Navigation size={15} />}
              Use My Current Location
            </button>
          </div>

          <form onSubmit={handleStartPayment}>
            <div className="address-form-grid">
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  className="form-control"
                  required
                  value={address.name}
                  onChange={e => setAddress({ ...address, name: e.target.value })}
                  placeholder="e.g. Priya Sundaram"
                />
              </div>

              <div>
                <label className="form-label">Phone Number *</label>
                <input
                  className="form-control"
                  required
                  type="tel"
                  value={address.phone}
                  onChange={e => setAddress({ ...address, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="full-span">
                <label className="form-label">Flat, House no., Building, Apartment *</label>
                <input
                  className="form-control"
                  required
                  value={address.flat}
                  onChange={e => setAddress({ ...address, flat: e.target.value })}
                  placeholder="Flat 4B, Rose Petal Apts"
                />
              </div>

              <div className="full-span">
                <label className="form-label">Area, Street, Sector, Village *</label>
                <input
                  className="form-control"
                  required
                  value={address.street}
                  onChange={e => setAddress({ ...address, street: e.target.value })}
                  placeholder="12th Main, Indiranagar"
                />
              </div>

              <div>
                <label className="form-label">Landmark (Optional)</label>
                <input
                  className="form-control"
                  value={address.landmark}
                  onChange={e => setAddress({ ...address, landmark: e.target.value })}
                  placeholder="Near Lotus Park"
                />
              </div>

              <div>
                <label className="form-label">Pincode *</label>
                <input
                  className="form-control"
                  required
                  maxLength={6}
                  value={address.pincode}
                  onChange={e => handlePincodeChange(e.target.value)}
                  placeholder="6-digit PIN"
                />
              </div>

              <div>
                <label className="form-label">Town / City *</label>
                <input
                  className="form-control"
                  required
                  value={address.city}
                  onChange={e => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div>
                <label className="form-label">State *</label>
                <select
                  className="form-control"
                  value={address.state}
                  onChange={e => setAddress({ ...address, state: e.target.value })}
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <button className="btn-primary btn-block btn-lg" type="submit">
                Continue to Razorpay Payment <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Order Preview */}
        <div className="order-summary-card">
          <h3 className="summary-title">Items in Order ({cartDetails.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto', marginBottom: '20px' }}>
            {cartDetails.map(item => (
              <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={sample(item.p)} alt={item.p.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <div style={{ fontWeight: 600 }}>{item.p.name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>
                  ₹{Math.round((item.p.discount > 0 ? item.p.price * (1 - item.p.discount / 100) : item.p.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{Math.round(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? <strong style={{ color: 'var(--success)' }}>FREE</strong> : `₹${shipping}`}</span>
          </div>
          <div className="summary-row total">
            <span>Payable Total</span>
            <span style={{ color: 'var(--primary-dark)' }}>₹{Math.round(total)}</span>
          </div>
        </div>
      </main>

      {/* Razorpay Checkout Modal */}
      {orderSession && (
        <RazorpayCheckoutModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          orderData={orderSession}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
        />
      )}

      <Footer />
    </>
  );
}

// ==========================================================================
// ORDERS & 5-STEP TRACKER PAGE
// ==========================================================================
function OrderTracking({ orderId }) {
  const { user, authLoading } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      api.get('/orders/' + orderId)
        .then(r => setOrder(r.data))
        .catch(err => {
          if (err.response?.status === 401 || err.response?.status === 403) {
            setUnauthorized(true);
          } else {
            alertError('Order Load Error', 'Could not retrieve tracking details.');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [orderId, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <p>Loading package itinerary...</p>
      </div>
    );
  }

  if (unauthorized || !user) {
    return (
      <div className="neu-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Sign In Required</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 20px' }}>
          Please sign in to access details for this order.
        </p>
        <Link className="btn-primary btn-sm" to={`/login?redirect=/orders/${orderId}`}>Sign In</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="neu-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Order not found</h3>
        <Link className="btn-primary btn-sm" to="/orders" style={{ marginTop: '16px' }}>View All Orders</Link>
      </div>
    );
  }

  const steps = [
    { key: 'Ordered', title: 'Ordered', desc: 'Order placed & confirmed' },
    { key: 'Processing', title: 'Processing', desc: 'Handcrafted & quality-checked' },
    { key: 'Shipped', title: 'Shipped', desc: 'Handed to courier partner' },
    { key: 'Out for Delivery', title: 'Out for Delivery', desc: 'Arriving at your doorstep' },
    { key: 'Delivered', title: 'Delivered', desc: 'Package received with joy' }
  ];

  const currentIdx = steps.findIndex(s => s.key.toLowerCase() === (order.status || 'Ordered').toLowerCase());
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;
  const progressPercent = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="order-tracking-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.08em' }}>TRACKING SHIPMENT</span>
          <h2 style={{ fontSize: '24px' }}>Order #{order.id}</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Placed on {new Date(order.created_at).toLocaleString()}</div>
        </div>
        <div>
          <span className={`status-pill ${order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'error' : 'primary'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* 5-Step Visual Timeline */}
      {order.status !== 'Cancelled' ? (
        <div className="timeline-tracker">
          <div className="timeline-progress-bar" style={{ width: `${progressPercent}%` }} />
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={step.key}
                className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
              >
                <div className="timeline-step-circle">
                  {isCompleted ? <Check size={20} /> : idx + 1}
                </div>
                <div className="timeline-step-title">{step.title}</div>
                <div className="timeline-step-date">{step.desc}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="neu-inset-box" style={{ margin: '24px 0', textAlign: 'center', color: 'var(--error)' }}>
          <strong>This order was cancelled.</strong> If refund was applicable, it is returned via Razorpay.
        </div>
      )}

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginTop: '36px' }}>
        <div className="neu-inset-box">
          <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>Delivery Address</h4>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{order.address}</p>
        </div>

        <div className="neu-inset-box">
          <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>Payment Summary</h4>
          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            <div>Method: <strong>{order.payment_method}</strong></div>
            <div>Status: <span className="status-pill success">{order.payment_status}</span></div>
            <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 700, color: 'var(--primary-dark)' }}>
              Total Paid: ₹{Math.round(order.total)}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginTop: '32px' }}>
        <h4 style={{ fontSize: '16px', marginBottom: '14px' }}>Package Contents</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {order.items?.map(i => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', background: 'var(--surface-tint)', borderRadius: 'var(--radius-md)' }}>
              <img src={sample(i)} alt={i.name} style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{i.name}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Quantity: {i.quantity}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                ₹{Math.round(i.price * i.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const { id } = useParams();
  const { user, authLoading } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      if (user) {
        api.get('/orders')
          .then(r => setOrders(r.data))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else if (!authLoading) {
        setLoading(false);
      }
    }
  }, [id, user, authLoading]);

  if (!id && !user && !authLoading) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="neu-card" style={{ padding: '48px 32px' }}>
            <PackageCheck size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Track Your Orders</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please sign in to view your order history and track active shipments.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link className="btn-primary" to="/login?redirect=/orders">Sign In</Link>
              <Link className="btn-secondary" to="/login?redirect=/orders">Create Account</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main style={{ maxWidth: '1100px', margin: '36px auto 64px', padding: '0 24px' }}>
        {id ? (
          <OrderTracking orderId={id} />
        ) : (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Your Orders & Shipments</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
              Track the progress of your Pretty Picks deliveries and view past receipts.
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto' }} />
              </div>
            ) : orders.length === 0 ? (
              <div className="neu-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <Package size={44} color="var(--primary-light)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No orders yet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Explore our boutique collections and pick something exquisite!
                </p>
                <Link className="btn-primary btn-sm" to="/shop">Shop Now</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map(o => (
                  <div className="neu-card hover-lift" key={o.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px' }}>Order #{o.id}</div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`status-pill ${o.status === 'Delivered' ? 'success' : o.status === 'Cancelled' ? 'error' : 'primary'}`}>
                          {o.status}
                        </span>
                        <Link className="btn-secondary btn-sm" to={`/orders/${o.id}`}>
                          Track Package
                        </Link>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', padding: '8px 0' }}>
                      {o.items?.map(i => (
                        <img key={i.id} src={sample(i)} alt={i.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} title={i.name} />
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '12px', fontSize: '14px' }}>
                      <span>Items: {o.items?.reduce((s, i) => s + i.quantity, 0) || 1}</span>
                      <strong>Total: ₹{Math.round(o.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

// ==========================================================================
// WISHLIST PAGE
// ==========================================================================
function Wishlist() {
  const { wishlist, products, user, authLoading } = useStore();

  const wishlistedProducts = useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [products, wishlist]);

  if (!authLoading && !user) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="neu-card" style={{ padding: '48px 32px' }}>
            <Heart size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Your Saved Wishlist</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Sign in to view pieces you've saved and sync your wishlist across all devices.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link className="btn-primary" to="/login?redirect=/wishlist">Sign In</Link>
              <Link className="btn-secondary" to="/login?redirect=/wishlist">Create Account</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main style={{ maxWidth: '1280px', margin: '36px auto 64px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '6px' }}>Your Saved Wishlist ({wishlistedProducts.length})</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Pieces you adore and saved for a brighter day.
        </p>

        {wishlistedProducts.length === 0 ? (
          <div className="neu-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Heart size={44} color="var(--primary-light)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Your wishlist is empty</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Tap the heart icon on any product to save it here for later.
            </p>
            <Link className="btn-primary btn-sm" to="/shop">Explore Jewellery & Accessories</Link>
          </div>
        ) : (
          <div className="products-grid">
            {wishlistedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

// ==========================================================================
// ACCOUNT DASHBOARD (PROFILE, SAVED ADDRESSES, SETTINGS)
// ==========================================================================
function Account() {
  const { user, logout, loadUser, authLoading } = useStore();
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  if (authLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 24px' }}>
          <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p>Loading account details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="neu-card" style={{ padding: '48px 32px' }}>
            <User size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Your Account</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please sign in to access your profile, track shipments, and manage preferences.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link className="btn-primary" to="/login?redirect=/account">Sign In</Link>
              <Link className="btn-secondary" to="/login?redirect=/account">Create Account</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleUpdateProfile = async e => {
    e.preventDefault();
    try {
      await api.put('/me', { name: editName, phone: editPhone });
      loadUser();
      alertSuccess('Profile Updated', 'Your profile details have been updated.');
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <>
      <Header />

      <main style={{ maxWidth: '1100px', margin: '36px auto 64px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
          {/* Sidebar Menu */}
          <div className="neu-card">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '24px', fontWeight: 700 }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <h3 style={{ fontSize: '18px' }}>{user.name}</h3>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className={`btn-secondary btn-block ${activeSubTab === 'profile' ? 'active' : ''}`}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => setActiveSubTab('profile')}
              >
                <User size={16} /> My Profile
              </button>
              <Link
                className="btn-secondary btn-block"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                to="/orders"
              >
                <Package size={16} /> Order History
              </Link>
              <Link
                className="btn-secondary btn-block"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                to="/wishlist"
              >
                <Heart size={16} /> Saved Wishlist
              </Link>
              <button
                className={`btn-secondary btn-block ${activeSubTab === 'security' ? 'active' : ''}`}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => setActiveSubTab('security')}
              >
                <ShieldCheck size={16} /> Security & Passwords
              </button>
              <button
                className="btn-secondary btn-block"
                style={{ textAlign: 'left', justifyContent: 'flex-start', color: 'var(--error)' }}
                onClick={logout}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>

          {/* Sub-panel content */}
          <div className="neu-card">
            {activeSubTab === 'profile' && (
              <div>
                <h3 style={{ fontSize: '22px', marginBottom: '18px' }}>Personal Profile</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-control"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      className="form-control"
                      disabled
                      value={user.email}
                      style={{ background: 'var(--surface-alt)' }}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Status: {user.is_verified ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Verified</span> : 'Unverified'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      className="form-control"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <button className="btn-primary btn-sm" type="submit">Save Changes</button>
                </form>
              </div>
            )}

            {activeSubTab === 'security' && (
              <div>
                <h3 style={{ fontSize: '22px', marginBottom: '18px' }}>Security Credentials</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                  Manage your encrypted password and login session security.
                </p>
                <div className="neu-inset-box">
                  <div style={{ fontSize: '13.5px' }}>
                    Email verification guarantees that invoices and delivery updates are sent securely to your registered mailbox.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// ==========================================================================
// CUSTOMER SUPPORT & INTERACTIVE CONCIERGE CHAT WIDGET
// ==========================================================================
function Support() {
  const [openFaq, setOpenFaq] = useState(0);
  const [ticket, setTicket] = useState({ name: '', email: '', subject: '', message: '' });
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your Pretty Picks Concierge. How may I assist you with your orders, sizing, or jewellery care today?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const faqs = [
    {
      q: 'How long does pan-India shipping take?',
      a: 'We process orders within 24 hours. Metro deliveries typically arrive in 2-3 business days, while other locations across India take 3-5 business days.'
    },
    {
      q: 'What is your 14-day return and exchange policy?',
      a: 'We accept returns and exchanges on unworn items within 14 days of delivery. Doorstep pickup is scheduled, and refunds are credited instantly once verified.'
    },
    {
      q: 'How do I care for my rose gold & pearl jewellery?',
      a: 'Store each piece in its micro-suede pouch away from moisture. Avoid contact with perfumes, hairsprays, and harsh chemicals. Polish gently with a dry cotton cloth.'
    },
    {
      q: 'Is the Razorpay payment gateway test mode secure?',
      a: 'Yes! In test mode, no real money is deducted from your bank. You can simulate instant success using "success@razorpay" or test failure using "failure@razorpay".'
    },
    {
      q: 'Do you offer gift packaging?',
      a: 'Yes! Every Pretty Picks order arrives inside our signature luxury blush box adorned with ribbon bows, ready to delight your loved ones.'
    }
  ];

  const handleTicketSubmit = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/support', ticket);
      alertSuccess('Inquiry Sent', res.data.message || 'Thank you! Our concierge team will reply within 24 hours.');
      setTicket({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      alertError('Submission Error', err.response?.data?.error || 'Could not send ticket');
    }
  };

  const handleChatSend = e => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');

    setTimeout(() => {
      let reply = 'Thank you for reaching out! Our team is dedicated to giving you an exceptional experience. How else may I help?';
      const lower = userText.toLowerCase();

      if (lower.includes('track') || lower.includes('order')) {
        reply = 'You can track any active shipment in real time under the "Track Orders" page with our 5-step visual timeline!';
      } else if (lower.includes('return') || lower.includes('exchange')) {
        reply = 'We offer a 14-day easy return and exchange guarantee. Simply reach out or submit an inquiry with your order number!';
      } else if (lower.includes('ship') || lower.includes('delivery')) {
        reply = 'We deliver pan-India via express couriers in 2 to 4 business days. Free shipping applies on orders over ₹999!';
      } else if (lower.includes('discount') || lower.includes('code') || lower.includes('coupon')) {
        reply = 'You can use code PRETTY10 during checkout for an instant 10% discount on your entire bag!';
      } else if (lower.includes('gold') || lower.includes('silver') || lower.includes('metal')) {
        reply = 'Our jewellery features 18K rose gold electroplate over skin-safe, nickel-free hypoallergenic brass.';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <>
      <Header />

      <main className="support-container">
        <div className="support-hero-box">
          <span className="hero-eyebrow">PRETTY PICKS CONCIERGE</span>
          <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>How can we assist you today?</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
            From tracking your shipments to styling advice and custom inquiries, our customer care team is here to help.
          </p>
        </div>

        <div className="support-grid">
          {/* FAQs & Contact Form */}
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Frequently Asked Questions</h3>
            <div style={{ marginBottom: '36px' }}>
              {faqs.map((f, idx) => (
                <div className="faq-accordion-item" key={f.q}>
                  <button
                    className="faq-header-btn"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  >
                    <span>{f.q}</span>
                    {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {openFaq === idx && (
                    <div className="faq-content-body">{f.a}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Ticket Form */}
            <div className="neu-card">
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Send Us a Message</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '18px' }}>
                We respond to all customer tickets within 24 business hours.
              </p>
              <form onSubmit={handleTicketSubmit}>
                <div className="address-form-grid" style={{ marginBottom: '14px' }}>
                  <div>
                    <label className="form-label">Name *</label>
                    <input
                      className="form-control"
                      required
                      value={ticket.name}
                      onChange={e => setTicket({ ...ticket, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      className="form-control"
                      type="email"
                      required
                      value={ticket.email}
                      onChange={e => setTicket({ ...ticket, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    className="form-control"
                    value={ticket.subject}
                    onChange={e => setTicket({ ...ticket, subject: e.target.value })}
                    placeholder="e.g. Question regarding Ring Sizing"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    required
                    value={ticket.message}
                    onChange={e => setTicket({ ...ticket, message: e.target.value })}
                    placeholder="Describe how we can help you..."
                  />
                </div>
                <button className="btn-primary btn-sm" type="submit">Submit Inquiry</button>
              </form>
            </div>
          </div>

          {/* Interactive Live Chat Concierge Widget */}
          <div>
            <div className="concierge-chat-card">
              <div className="chat-header-bar">
                <div className="chat-avatar-badge">✦</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Pretty Picks Concierge</div>
                  <div style={{ fontSize: '11.5px', opacity: 0.9 }}>Online • Instant Assistance</div>
                </div>
              </div>

              <div className="chat-body-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.sender}`}>
                    {m.text}
                  </div>
                ))}
              </div>

              <form className="chat-input-row" onSubmit={handleChatSend}>
                <input
                  placeholder="Ask a question about orders, delivery..."
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                />
                <button className="neu-icon-btn" type="submit" style={{ width: '38px', height: '38px' }}>
                  <Send size={15} color="var(--primary)" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// ==========================================================================
// AUTHENTICATION: LOGIN & REGISTER
// ==========================================================================
function Login() {
  const { login, register, user } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const redirectUrl = useMemo(() => {
    return new URLSearchParams(loc.search).get('redirect') || '/';
  }, [loc.search]);

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    if (user) nav(redirectUrl);
  }, [user, nav, redirectUrl]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(form);
        alertSuccess('Welcome to Pretty Picks! ✨', 'Account created successfully.');
      } else {
        await login(form.email, form.password);
        toastSuccess('Signed in successfully');
      }
      nav(redirectUrl);
    } catch (err) {
      alertError('Authentication Error', err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <>
      <Header />

      <main style={{ maxWidth: '440px', margin: '60px auto 80px', padding: '0 24px' }}>
        <div className="neu-card" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '26px', marginBottom: '6px' }}>
              {isRegister ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {isRegister ? 'Join our luxury jewellery & accessory circle' : 'Sign in to access your bag and saved items'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Priya Sundaram"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  className="form-control"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
            )}

            <button className="btn-primary btn-block btn-lg" type="submit" style={{ marginTop: '12px' }}>
              {isRegister ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have an account? ' : 'New to Pretty Picks? '}
            <button
              style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Sign In here' : 'Create an Account'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function VerifyPage() {
  const loc = useLocation();
  const search = new URLSearchParams(loc.search);
  const token = search.get('token');
  const [msg, setMsg] = useState('Verifying your email...');
  // Bug 7 fix: track success/failure to render appropriate icon
  const [verified, setVerified] = useState(null); // null = loading, true = ok, false = fail

  useEffect(() => {
    if (token) {
      api.get('/auth/verify', { params: { token } })
        .then(r => { setMsg(r.data.message || 'Email verified successfully!'); setVerified(true); })
        .catch(e => { setMsg(e.response?.data?.error || 'Verification link expired'); setVerified(false); });
    } else {
      setMsg('No verification token provided.');
      setVerified(false);
    }
  }, [token]);

  return (
    <>
      <Header />
      <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div className="neu-card" style={{ padding: '40px 24px' }}>
          {/* Bug 7 fix: show correct icon based on verification result */}
          {verified === true && <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />}
          {verified === false && <AlertCircle size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />}
          {verified === null && <Loader2 size={48} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 16px' }} />}
          <h2 style={{ marginBottom: '12px' }}>Verification Status</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{msg}</p>
          <Link className="btn-primary btn-sm" to="/">Return to Home</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}

// ==========================================================================
// ADMIN DASHBOARD & PRODUCT/ORDER MANAGER
// ==========================================================================
function Admin() {
  const { user, refreshCatalog, authLoading } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [metrics, setMetrics] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const loadAdminData = () => {
    if (!user || user.role !== 'admin') return;
    api.get('/admin/metrics').then(r => setMetrics(r.data)).catch(() => {});
    api.get('/admin/products').then(r => setProducts(r.data)).catch(() => {});
    api.get('/admin/orders').then(r => setOrders(r.data)).catch(() => {});
    api.get('/admin/customers').then(r => setCustomers(r.data)).catch(() => {});
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      loadAdminData();
    }
  }, [user, authLoading]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toastSuccess(`Order #${orderId} updated to ${newStatus}`);
      loadAdminData();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update order');
    }
  };

  const handleSaveProduct = async p => {
    try {
      if (p.id) {
        await api.put('/products/' + p.id, p);
        toastSuccess('Product updated successfully!');
      } else {
        await api.post('/products', p);
        toastSuccess('Product added successfully!');
      }
      setProductModalOpen(false);
      loadAdminData();
      refreshCatalog();
    } catch (err) {
      alertError('Product Save Failed', err.response?.data?.error || 'Could not save product');
    }
  };

  const handleDeleteProduct = async id => {
    const res = await confirmDialog('Delete Product?', 'This will remove the product from the store catalog.');
    if (res.isConfirmed) {
      try {
        await api.delete('/products/' + id);
        toastSuccess('Product deleted');
        loadAdminData();
        refreshCatalog();
      } catch (err) {
        alertError('Delete Failed', err.response?.data?.error || 'Foreign key restriction');
      }
    }
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="neu-card" style={{ padding: '48px 32px' }}>
            <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Admin Access Required</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please sign in with an administrator account to access the store management dashboard.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link className="btn-primary" to="/login?redirect=/admin">Sign In as Admin</Link>
              <Link className="btn-secondary" to="/">Back to Store</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/jp-store-logo.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}>JP Store Admin</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link className="btn-secondary btn-sm" to="/">View Live Storefront</Link>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Administrator</span>
        </div>
      </header>

      <div className="admin-body">
        {/* Navigation Tabs */}
        <div className="admin-nav-tabs">
          <button className={`admin-tab-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            <LayoutDashboard size={17} /> Dashboard
          </button>
          <button className={`admin-tab-btn ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
            <Package size={17} /> Products ({products.length})
          </button>
          <button className={`admin-tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            <Truck size={17} /> Orders ({orders.length})
          </button>
          <button className={`admin-tab-btn ${tab === 'customers' ? 'active' : ''}`} onClick={() => setTab('customers')}>
            <Users size={17} /> Customers ({customers.length})
          </button>
          <button className={`admin-tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <Settings size={17} /> Store Settings & Razorpay
          </button>
        </div>

        {/* 1. DASHBOARD KPI TAB */}
        {tab === 'dashboard' && (
          <div>
            <div className="admin-kpi-grid">
              <div className="kpi-card">
                <div>
                  <div className="kpi-label">Total Revenue</div>
                  <div className="kpi-val">₹{Math.round(metrics.revenue || 0)}</div>
                </div>
                <div className="kpi-icon-box"><CreditCard size={24} /></div>
              </div>

              <div className="kpi-card">
                <div>
                  <div className="kpi-label">Total Orders</div>
                  <div className="kpi-val">{metrics.orders || 0}</div>
                </div>
                <div className="kpi-icon-box"><Package size={24} /></div>
              </div>

              <div className="kpi-card">
                <div>
                  <div className="kpi-label">Store Products</div>
                  <div className="kpi-val">{products.length}</div>
                </div>
                <div className="kpi-icon-box"><Sparkles size={24} /></div>
              </div>

              <div className="kpi-card">
                <div>
                  <div className="kpi-label">Registered Customers</div>
                  <div className="kpi-val">{customers.length}</div>
                </div>
                <div className="kpi-icon-box"><Users size={24} /></div>
              </div>
            </div>

            <div className="neu-card">
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Store Orders</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{o.customer_name || 'Guest'}</td>
                        <td>₹{Math.round(o.total)}</td>
                        <td>{o.payment_status}</td>
                        <td>
                          <span className={`status-pill ${o.status === 'Delivered' ? 'success' : 'primary'}`}>{o.status}</span>
                        </td>
                        <td>
                          <Link className="btn-secondary btn-sm" to={`/orders/${o.id}`}>View Details</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px' }}>Product Catalog Management</h3>
              <button
                className="btn-primary btn-sm"
                onClick={() => {
                  setEditingProduct({ name: '', price: 499, discount: 10, stock: 25, category: 'Jewellery', description: '', image: '', status: 'active' });
                  setProductModalOpen(true);
                }}
              >
                <Plus size={16} /> Add New Product
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <img src={sample(p)} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.category}</td>
                      <td>₹{p.price}</td>
                      <td>{p.stock}</td>
                      <td><span className="status-pill success">{p.status || 'active'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="neu-icon-btn"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => {
                              setEditingProduct(p);
                              setProductModalOpen(true);
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="neu-icon-btn"
                            style={{ width: '32px', height: '32px', color: 'var(--error)' }}
                            onClick={() => handleDeleteProduct(p.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {tab === 'orders' && (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Manage Customer Orders</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Current Status</th>
                    <th>Update Tracking Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>
                        <div><strong>{o.customer_name || 'Customer'}</strong></div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{o.email}</div>
                      </td>
                      <td>₹{Math.round(o.total)}</td>
                      <td><span className="status-pill success">{o.payment_status}</span></td>
                      <td><span className="status-pill primary">{o.status}</span></td>
                      <td>
                        <select
                          className="shop-sort-select"
                          value={o.status}
                          onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                        >
                          <option value="Ordered">Ordered</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CUSTOMERS TAB */}
        {tab === 'customers' && (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Store Customers</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                     <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.email}</td>
                      <td>{c.role}</td>
                      <td>
                        <span className={`status-pill ${c.status === 'blocked' ? 'error' : 'success'}`}>
                          {c.status || 'active'}
                        </span>
                      </td>
                      {/* Bug 8 fix: Block / Unblock action button */}
                      <td>
                        <button
                          className={`btn-sm ${c.status === 'blocked' ? 'btn-primary' : 'btn-danger'}`}
                          style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer',
                            background: c.status === 'blocked' ? 'var(--success)' : 'var(--error)',
                            color: '#fff', border: 'none' }}
                          onClick={async () => {
                            const newStatus = c.status === 'blocked' ? 'active' : 'blocked';
                            const action = newStatus === 'blocked' ? 'block' : 'unblock';
                            const res = await confirmDialog(`Confirm ${action}`, `Are you sure you want to ${action} ${c.name}?`, `Yes, ${action}`, 'Cancel', action === 'block');
                            if (!res.isConfirmed) return;
                            try {
                              await api.put(`/admin/customers/${c.id}/status`, { status: newStatus });
                              setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x));
                              toastSuccess(`Customer ${action}ed successfully.`);
                            } catch {
                              toastError(`Could not ${action} customer.`);
                            }
                          }}
                        >
                          {c.status === 'blocked' ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. SETTINGS & RAZORPAY TEST */}
        {tab === 'settings' && (
          <div className="neu-card" style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Store Settings & Gateway Credentials</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                await api.put('/settings', settings);
                alertSuccess('Settings Saved', 'Configuration and credentials updated.');
              } catch (err) {
                toastError('Could not update settings');
              }
            }}>
              <div className="form-group">
                <label className="form-label">Store Branding Name</label>
                <input
                  className="form-control"
                  value={settings.store_name || ''}
                  onChange={e => setSettings({ ...settings, store_name: e.target.value })}
                />
              </div>

              <div className="address-form-grid" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Support Email</label>
                  <input
                    className="form-control"
                    value={settings.email || ''}
                    onChange={e => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Support Phone</label>
                  <input
                    className="form-control"
                    value={settings.phone || ''}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Razorpay Key ID (Test Mode)</label>
                <input
                  className="form-control"
                  value={settings.razorpay_key_id || ''}
                  onChange={e => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                  placeholder="rzp_test_..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Razorpay Key Secret (Test Mode)</label>
                <input
                  className="form-control"
                  type="password"
                  value={settings.razorpay_key_secret || ''}
                  onChange={e => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                  placeholder="••••••••••••••••"
                />
              </div>

              <button className="btn-primary" type="submit">Save Store Settings</button>
            </form>
          </div>
        )}
      </div>

      {/* Product Edit Modal */}
      {productModalOpen && editingProduct && (
        <div className="mobile-drawer-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="neu-card" style={{ maxWidth: '520px', width: '92%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px' }}>{editingProduct.id ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="neu-icon-btn" onClick={() => setProductModalOpen(false)}><X size={16} /></button>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleSaveProduct(editingProduct); }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  className="form-control"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="address-form-grid" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Price (₹) *</label>
                  <input
                    className="form-control"
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label">Discount (%)</label>
                  <input
                    className="form-control"
                    type="number"
                    value={editingProduct.discount}
                    onChange={e => setEditingProduct({ ...editingProduct, discount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="address-form-grid" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-control"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  >
                    <option value="Jewellery">Jewellery</option>
                    <option value="Hair Accessories">Hair Accessories</option>
                    <option value="Luxury Gift Boxes">Luxury Gift Boxes</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Inventory Stock *</label>
                  <input
                    className="form-control"
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  className="form-control"
                  value={editingProduct.image || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <button className="btn-primary btn-block" type="submit">Save Product to Catalog</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// APP ROUTER & ROOT RENDER
// ==========================================================================
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<Orders />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/account" element={<Account />} />
      <Route path="/support" element={<Support />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StoreProvider>
      <App />
    </StoreProvider>
  </BrowserRouter>
);
