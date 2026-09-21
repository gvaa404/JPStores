import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { alertSuccess, alertWarning } from '../utils/alert';
import { useStore } from '../context/StoreContext';

function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = e => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      return alertWarning('Invalid Email', 'Please enter a valid email address.');
    }
    alertSuccess('Subscribed!', 'Welcome to the Pretty Picks VIP circle. Enjoy 10% off your first order with code PRETTY10.');
    setEmail('');
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="brand" style={{ marginBottom: '14px' }}>
            <img className="brand-logo-img" src="/jp-store-logo.png" alt="JP Store" />
            <div className="brand-info">
              <span className="brand-name">JP Store</span>
              <span className="brand-tagline">Pretty Picks</span>
            </div>
          </div>
          <p className="footer-desc">
            Discover timeless, handcrafted jewellery and everyday statement accessories.
            Thoughtfully curated to bring a spark of everyday luxury into your life.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="neu-icon-btn"><ShieldCheck size={18} color="var(--primary)" /></span>
            <span className="neu-icon-btn"><Truck size={18} color="var(--primary)" /></span>
            <span className="neu-icon-btn"><CreditCard size={18} color="var(--accent)" /></span>
          </div>
        </div>

        <div>
          <h4 className="footer-col-title">Collections</h4>
          <ul className="footer-links">
            <li><Link to="/shop?category=Jewellery">Jewellery & Pendants</Link></li>
            <li><Link to="/shop?category=Hair%20Accessories">Hair Accessories</Link></li>
            <li><Link to="/shop?category=Luxury%20Gift%20Boxes">Luxury Keepsake Boxes</Link></li>
            <li><Link to="/shop?category=Stationery">Aesthetic Stationery</Link></li>
            <li><Link to="/shop">All New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Customer Care</h4>
          <ul className="footer-links">
            <li><Link to="/orders">Track Your Order</Link></li>
            <li><Link to="/support">Help & FAQ Center</Link></li>
            <li><Link to="/support">14-Day Return Policy</Link></li>
            <li><Link to="/support">Jewellery Care Guide</Link></li>
            <li><Link to="/support">Contact Concierge</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Join Pretty Picks Club</h4>
          <p className="footer-desc">
            Sign up for secret promotions, limited releases, and style inspirations.
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className="btn-primary btn-sm" type="submit">Join</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div>© {new Date().getFullYear()} JP Store – Pretty Picks. All rights reserved. Handcrafted with love.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/support">Terms of Service</Link>
          <Link to="/support">Privacy Policy</Link>
          <Link to="/support">Shipping & Returns</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
