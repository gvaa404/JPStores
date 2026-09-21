import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

function Header() {
  const { user, logout, cartCount, wishlist } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [term, setTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearch = e => {
    if (e.key === 'Enter' && term.trim()) {
      nav('/shop?search=' + encodeURIComponent(term.trim()));
      setDrawerOpen(false);
    }
  };

  return (
    <>
      <div className="announcement-bar">
        <span>✨ Free Express Pan-India Delivery on orders over ₹999</span>
        <span className="code">USE CODE: PRETTY10 FOR 10% OFF</span>
      </div>

      <header className="site-header">
        <div className="header-inner">
          {/* Brand */}
          <Link className="brand" to="/">
            <img className="brand-logo-img" src="/jp-store-logo.png" alt="JP Store Logo" />
            <div className="brand-info">
              <span className="brand-name">JP Store</span>
              <span className="brand-tagline">Pretty Picks</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <ul className="nav-links">
            <li>
              <Link className={`nav-link ${loc.pathname === '/' ? 'active' : ''}`} to="/">
                Home
              </Link>
            </li>
            <li>
              <Link className={`nav-link ${loc.pathname === '/shop' ? 'active' : ''}`} to="/shop">
                Shop All
              </Link>
            </li>
            <li>
              <Link className="nav-link" to="/shop?category=Jewellery">
                Jewellery
              </Link>
            </li>
            <li>
              <Link className="nav-link" to="/shop?category=Hair%20Accessories">
                Hair Accessories
              </Link>
            </li>
            <li>
              <Link className={`nav-link ${loc.pathname === '/support' ? 'active' : ''}`} to="/support">
                Help & Concierge
              </Link>
            </li>
          </ul>

          {/* Search Box */}
          <div className="header-search">
            <Search className="search-icon" size={17} />
            <input
              type="text"
              value={term}
              onChange={e => setTerm(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search jewellery, hairpins, gifts..."
            />
          </div>

          {/* Actions */}
          <div className="header-actions">
            <Link className="neu-icon-btn" to="/wishlist" title="Wishlist">
              <Heart size={18} />
              {wishlist.length > 0 && <span className="neu-badge gold">{wishlist.length}</span>}
            </Link>

            <Link className="neu-icon-btn" to="/cart" title="Shopping Bag">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="neu-badge">{cartCount}</span>}
            </Link>

            {user ? (
              <>
                <Link className="neu-icon-btn" to="/account" title="Account">
                  <User size={18} />
                </Link>
                {user.role === 'admin' && (
                  <Link className="neu-icon-btn" to="/admin" title="Admin Panel">
                    <LayoutDashboard size={18} />
                  </Link>
                )}
                <button className="neu-icon-btn" onClick={logout} title="Sign Out">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link className="btn-primary btn-sm" to="/login">
                Sign In
              </Link>
            )}

            <button
              className="mobile-menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div className="brand">
                <img className="brand-logo-img" src="/jp-store-logo.png" alt="JP Store" />
                <div className="brand-info">
                  <span className="brand-name">JP Store</span>
                  <span className="brand-tagline">Pretty Picks</span>
                </div>
              </div>
              <button className="neu-icon-btn" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                className="form-control"
                placeholder="Search products..."
                value={term}
                onChange={e => setTerm(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              <Link className="nav-link" to="/" onClick={() => setDrawerOpen(false)}>Home</Link>
              <Link className="nav-link" to="/shop" onClick={() => setDrawerOpen(false)}>Shop All</Link>
              <Link className="nav-link" to="/shop?category=Jewellery" onClick={() => setDrawerOpen(false)}>Jewellery</Link>
              <Link className="nav-link" to="/shop?category=Hair%20Accessories" onClick={() => setDrawerOpen(false)}>Hair Accessories</Link>
              <Link className="nav-link" to="/shop?category=Luxury%20Gift%20Boxes" onClick={() => setDrawerOpen(false)}>Luxury Gift Boxes</Link>
              <Link className="nav-link" to="/orders" onClick={() => setDrawerOpen(false)}>Track Orders</Link>
              <Link className="nav-link" to="/support" onClick={() => setDrawerOpen(false)}>Help & Concierge</Link>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Welcome, {user.name}</div>
                  <Link className="btn-secondary btn-sm" to="/account" onClick={() => setDrawerOpen(false)}>My Account</Link>
                  {user.role === 'admin' && (
                    <Link className="btn-secondary btn-sm" to="/admin" onClick={() => setDrawerOpen(false)}>Admin Panel</Link>
                  )}
                  <button className="btn-primary btn-sm" onClick={() => { logout(); setDrawerOpen(false); }}>Sign Out</button>
                </div>
              ) : (
                <Link className="btn-primary btn-block" to="/login" onClick={() => setDrawerOpen(false)}>
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
