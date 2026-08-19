import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaFilter, FaPhone, FaWhatsapp, FaCog, FaSignOutAlt, FaCarSide, FaGasPump,
  FaCogs, FaCalendarAlt, FaTimes, FaChevronDown, FaStar, FaPalette,
  FaShareAlt, FaCalculator, FaCalendarCheck, FaSearch, FaSortAmountDown,
  FaCheckCircle, FaShieldAlt, FaHandshake, FaRoad, FaCheck
} from 'react-icons/fa';
import logo from './assets/logo.png';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import { API_URL } from './api';
import './smvt.css';

const NO_IMAGE_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Crect width='400' height='260' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Inter,sans-serif' font-size='14' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E`;

const CONTACT = '0733493804';
const WA_NUM  = `254${CONTACT.replace(/^0/, '')}`;
const EMAIL   = 'bluesealmotormanagers@gmail.com';
const LOCATION = 'Kiambu Road, Nairobi, Kenya';

const CATEGORIES = ['All Vehicles', 'SUVs & 4x4', 'Sedans & Saloons', 'Luxury & Sports', 'Commercial'];

const SkeletonCard = () => (
  <div className="car-card">
    <div className="skeleton" style={{ height: '215px' }} />
    <div className="car-body" style={{ gap: '.6rem' }}>
      <div className="skeleton" style={{ height: '15px', width: '65%' }} />
      <div className="skeleton" style={{ height: '22px', width: '42%' }} />
      <div style={{ display: 'flex', gap: '.4rem' }}>
        <div className="skeleton" style={{ height: '24px', width: '60px', borderRadius: '20px' }} />
        <div className="skeleton" style={{ height: '24px', width: '70px', borderRadius: '20px' }} />
        <div className="skeleton" style={{ height: '24px', width: '65px', borderRadius: '20px' }} />
      </div>
      <div className="skeleton" style={{ height: '44px', borderRadius: '8px', marginTop: '.4rem' }} />
    </div>
  </div>
);

const App = () => {
  const [showAdmin, setShowAdmin]   = useState(new URLSearchParams(window.location.search).get('admin') === 'true');
  const [authToken, setAuthToken]   = useState(() => localStorage.getItem('bluesealAdminToken') || localStorage.getItem('smvtAdminToken') || '');
  const isAuthenticated             = Boolean(authToken);

  const [filters, setFilters] = useState({ searchTerm: '', fuelFilter: '', yearFilter: '', transmissionFilter: '', colorFilter: '' });
  const [activeCategory, setActiveCategory] = useState('All Vehicles');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [selectedImgIdx, setSelectedImgIdx] = useState({});
  const [cars, setCars]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [fullscreenImg, setFullscreenImg] = useState(null);

  // Advanced Tools Modals & Toasts
  const [toastMsg, setToastMsg] = useState('');
  const [calculatorCar, setCalculatorCar] = useState(null);
  const [testDriveCar, setTestDriveCar] = useState(null);
  const [testDriveForm, setTestDriveForm] = useState({ name: '', phone: '', date: '', time: 'Morning (10:00 AM - 1:00 PM)' });

  // Finance calculator state
  const [depositPct, setDepositPct] = useState(20);
  const [loanMonths, setLoanMonths] = useState(36);
  const interestRate = 13.5;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/cars`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setCars(d); setLoading(false); })
      .catch(() => { setError('Unable to load live inventory. Please check back shortly.'); setLoading(false); });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setFullscreenImg(null);
        setShowFilters(false);
        setCalculatorCar(null);
        setTestDriveCar(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const clearFilters = () => setFilters({ searchTerm: '', fuelFilter: '', yearFilter: '', transmissionFilter: '', colorFilter: '' });

  // Verify token validity on load
  useEffect(() => {
    if (!authToken) return;
    fetch(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          handleLogout();
        }
      })
      .catch(() => {});
  }, [authToken]);

  // 30-minute idle session auto-logout
  useEffect(() => {
    if (!isAuthenticated) return;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 mins
    let timeoutId;

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        showToast('Admin session expired due to 30 minutes of inactivity.');
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('bluesealAdminToken');
    localStorage.removeItem('smvtAdminToken');
    setAuthToken('');
    setShowAdmin(false);
  };

  // Filter & Sort Logic
  const filtered = cars.filter(c => {
    const q = filters.searchTerm.toLowerCase();
    const matchesSearch = (!q || [c.title, c.brand, c.model, c.color].some(f => f?.toLowerCase().includes(q)));
    const matchesFuel   = (!filters.fuelFilter || c.fuelType === filters.fuelFilter);
    const matchesYear   = (!filters.yearFilter || c.year?.toString() === filters.yearFilter);
    const matchesTrans  = (!filters.transmissionFilter || c.transmission === filters.transmissionFilter);
    const matchesColor  = (!filters.colorFilter || c.color?.toLowerCase() === filters.colorFilter.toLowerCase());

    // Category match
    let matchesCategory = true;
    if (activeCategory === 'SUVs & 4x4') {
      matchesCategory = ['prado', 'land cruiser', 'range rover', 'cx-5', 'cx-8', 'patrol', 'harrier', 'rav4', 'outback', 'suv', '4x4'].some(k => `${c.title} ${c.model}`.toLowerCase().includes(k));
    } else if (activeCategory === 'Sedans & Saloons') {
      matchesCategory = ['c200', 'c300', 'e-class', '320i', '520i', 'premio', 'allion', 'axio', 'camry', 'mercedes', 'bmw', 'sedan'].some(k => `${c.title} ${c.model}`.toLowerCase().includes(k));
    } else if (activeCategory === 'Luxury & Sports') {
      matchesCategory = (c.price >= 5000000) || ['amg', 'm-sport', 'range rover', 'porsche', 'lexus', 'hse'].some(k => `${c.title} ${c.model}`.toLowerCase().includes(k));
    } else if (activeCategory === 'Commercial') {
      matchesCategory = ['hilux', 'd-max', 'ranger', 'canter', 'probox', 'hiace', 'pickup', 'commercial'].some(k => `${c.title} ${c.model}`.toLowerCase().includes(k));
    }

    return matchesSearch && matchesFuel && matchesYear && matchesTrans && matchesColor && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === 'price-high') return (Number(b.price) || 0) - (Number(a.price) || 0);
    if (sortBy === 'year-new') return (Number(b.year) || 0) - (Number(a.year) || 0);
    return 0;
  });

  const uniq = f => [...new Set(cars.map(c => c[f]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const yearOpts = uniq('year').sort((a, b) => Number(b) - Number(a));
  const activeFltCount = [filters.fuelFilter, filters.yearFilter, filters.transmissionFilter, filters.colorFilter].filter(Boolean).length;

  // Loan Calculations
  const calcPrice = calculatorCar?.price || 5000000;
  const depositAmount = (calcPrice * depositPct) / 100;
  const principal = calcPrice - depositAmount;
  const monthlyRate = (interestRate / 100) / 12;
  const monthlyPayment = principal > 0
    ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) / (Math.pow(1 + monthlyRate, loanMonths) - 1))
    : 0;

  const handleShare = (car) => {
    const shareData = {
      title: `${car.title} — Blue Seal Motor Managers Ltd`,
      text: `Check out this ${car.title} for KES ${car.price?.toLocaleString()} at Blue Seal Motor Managers Ltd (Kiambu Road, Nairobi)!`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`);
      showToast('Vehicle link and details copied to clipboard!');
    }
  };

  const handleTestDriveSubmit = (e) => {
    e.preventDefault();
    if (!testDriveCar) return;
    const msg = encodeURIComponent(`Hello Blue Seal Motor Managers Ltd (BMM), I would like to schedule a Test Drive for the ${testDriveCar.title} (KES ${testDriveCar.price?.toLocaleString()}) on ${testDriveForm.date || 'upcoming date'} (${testDriveForm.time}). My Name: ${testDriveForm.name}, Phone: ${testDriveForm.phone}.`);
    window.open(`https://wa.me/${WA_NUM}?text=${msg}`, '_blank');
    setTestDriveCar(null);
    showToast('Test drive booking initiated via WhatsApp!');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="toast-notification"
          >
            <FaCheckCircle color="#10b981" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setShowAdmin(false)} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="BLUESEAL MOTOR MANAGER'S LTD (BMM)" className="navbar-logo" />
        </div>
        <div className="navbar-actions">
          <button onClick={() => setShowAdmin(false)} className={`btn btn-nav ${!showAdmin ? 'active' : ''}`} aria-label="Car listings">
            <FaCarSide />
            <span>Showroom</span>
          </button>
          
          <button 
            onClick={() => setShowAdmin(true)} 
            className={`btn ${showAdmin ? 'btn-primary' : 'btn-outline-red'}`} 
            aria-label="Admin Login and Portal"
          >
            <FaCog />
            <span>{isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}</span>
          </button>

          {isAuthenticated && (
            <button onClick={handleLogout} className="btn btn-danger btn-sm" aria-label="Logout" title="Logout from Admin">
              <FaSignOutAlt size={13} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </nav>

      {showAdmin ? (
        isAuthenticated ? <AdminPanel authToken={authToken} onUnauthorized={handleLogout} /> : <AdminLogin onLogin={setAuthToken} />
      ) : (
        <>
          {/* ── Hero ── */}
          <section className="hero">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <FaStar size={10} color="#ff4d6d" /> Precision in every mile · Kiambu Road
              </div>
              <h1>
                Drive Excellence with <br />
                <span className="brand-highlight">BLUESEAL</span> <span className="text-white">MOTOR MANAGER'S LTD</span>
              </h1>
              <p>Nairobi's premier auto dealership &amp; vehicle managers located along Kiambu Road. Handpicked certified new and quality pre-owned vehicles at competitive market prices.</p>
              <div className="hero-ctas" style={{ display: 'flex', gap: '.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent('Hi Blue Seal Motor Managers (BMM), I would like to enquire about your available vehicles on Kiambu Road.')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                  <FaWhatsapp /> Chat on WhatsApp
                </a>
                <a href={`tel:${CONTACT}`} className="btn btn-outline-red btn-lg">
                  <FaPhone /> Call Showroom
                </a>
                <button onClick={() => setCalculatorCar(cars[0] || { title: 'Standard Vehicle', price: 5000000 })} className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>
                  <FaCalculator /> Loan Estimator
                </button>
              </div>

              <div className="hero-stats">
                <div className="hero-stat"><div className="hero-stat-num">{cars.length || '25'}+</div><div className="hero-stat-label">Cars in Stock</div></div>
                <div className="hero-stat"><div className="hero-stat-num">100%</div><div className="hero-stat-label">Certified Inspection</div></div>
                <div className="hero-stat"><div className="hero-stat-num">Kiambu Rd</div><div className="hero-stat-label">Prime Showroom</div></div>
              </div>
            </div>
          </section>

          {/* ── Main Showroom Wrapper ── */}
          <div className="main-wrapper" id="inventory">

            {/* Category Quick Tabs */}
            <div className="category-pills">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search and Sort Bar */}
            <div className="search-sort-container">
              <div className="search-wrap" style={{ flex: 1 }}>
                <FaSearch color="var(--red)" style={{ flexShrink: 0 }} />
                <input
                  id="search-input" type="search" className="search-input"
                  value={filters.searchTerm}
                  onChange={e => setFilter('searchTerm', e.target.value)}
                  placeholder="Search make, model, Prado, C200, Range Rover…"
                  aria-label="Search cars"
                />
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`btn ${showFilters || activeFltCount ? 'btn-primary' : 'btn-ghost'}`}
                  aria-expanded={showFilters}
                  style={{ position: 'relative', flexShrink: 0 }}
                >
                  <FaFilter />
                  {activeFltCount > 0 && <span className="badge-count">{activeFltCount}</span>}
                  <FaChevronDown size={11} style={{ transition: 'transform .2s', transform: showFilters ? 'rotate(180deg)' : 'none' }} />
                </button>
              </div>

              <div className="sort-wrap">
                <FaSortAmountDown color="var(--text-3)" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select" aria-label="Sort cars">
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="year-new">Year: Newest First</option>
                </select>
              </div>
            </div>

            {/* Filters Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .16 }} className="filter-panel">
                  <div className="filter-header">
                    <strong style={{ fontSize: '.95rem', color: 'var(--text)' }}>Refine Results</strong>
                    {activeFltCount > 0 && <button onClick={clearFilters} className="btn btn-danger btn-sm"><FaTimes /> Reset Filters</button>}
                  </div>
                  <div className="filter-grid">
                    {[
                      { id: 'fuel-filter',  label: '⛽ All Fuels', key: 'fuelFilter', opts: uniq('fuelType') },
                      { id: 'year-filter',  label: '📅 All Years', key: 'yearFilter', opts: yearOpts },
                      { id: 'trans-filter', label: '⚙️ All Transmissions', key: 'transmissionFilter', opts: uniq('transmission') },
                      { id: 'color-filter', label: '🎨 All Colors', key: 'colorFilter', opts: uniq('color') },
                    ].map(({ id, label, key, opts }) => (
                      <select key={id} id={id} className="filter-select" value={filters[key]} onChange={e => setFilter(key, e.target.value)} aria-label={label}>
                        <option value="">{label}</option>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="alert alert--error" role="alert" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {/* Results Count */}
            {!loading && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="results-count">
                  {filtered.length === 0 ? 'No vehicles match your search criteria.' : `${filtered.length} vehicle${filtered.length !== 1 ? 's' : ''} available`}
                </p>
                {activeCategory !== 'All Vehicles' && (
                  <span style={{ fontSize: '.8rem', color: 'var(--red)', fontWeight: 700 }}>
                    Category: {activeCategory}
                  </span>
                )}
              </div>
            )}

            {/* Car Grid */}
            <div className="car-grid">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : filtered.map(car => {
                    const imgIdx = selectedImgIdx[car._id] || 0;
                    const img = car.images?.[imgIdx] || car.images?.[0] || NO_IMAGE_SVG;
                    const exp = expandedCardId === car._id;
                    const waMsg = encodeURIComponent(`Hi Blue Seal Motor Managers (BMM), I'm interested in the ${car.title} listed at KES ${car.price?.toLocaleString()}. Is it still available at your Kiambu Road showroom?`);

                    return (
                      <motion.article key={car._id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }} className="car-card">
                        {/* Image Wrap */}
                        <div className="car-image-wrap">
                          <img src={img} alt={car.title} className="car-image"
                            onClick={() => car.images?.length && setFullscreenImg(img)}
                            onError={e => { e.target.src = NO_IMAGE_SVG; }}
                            style={{ cursor: car.images?.length ? 'zoom-in' : 'default' }} />
                          {car.condition && (
                            <span className={`car-badge car-badge--${car.condition === 'New' ? 'new' : 'used'}`}>{car.condition}</span>
                          )}
                          {car.images?.length > 1 && (
                            <span className="car-img-counter">{imgIdx + 1}/{car.images.length}</span>
                          )}

                          <button onClick={() => handleShare(car)} className="btn-share-floating" title="Share Vehicle">
                            <FaShareAlt size={12} />
                          </button>
                        </div>

                        {/* Thumbnails */}
                        {car.images?.length > 1 && (
                          <div className="car-thumbs">
                            {car.images.map((src, i) => (
                              <img key={i} src={src} alt={`View ${i + 1}`}
                                className={`car-thumb ${imgIdx === i ? 'active' : ''}`}
                                onClick={() => setSelectedImgIdx(p => ({ ...p, [car._id]: i }))}
                                onError={e => { e.target.src = NO_IMAGE_SVG; }} />
                            ))}
                          </div>
                        )}

                        {/* Body */}
                        <div className="car-body">
                          <h3 className="car-title">{car.title}</h3>
                          <div className="car-price-wrap">
                            <span className="car-price">KES {car.price?.toLocaleString()}</span>
                            <span className="car-price-label">Negotiable</span>
                          </div>
                          
                          <div className="car-meta">
                            <span className="car-pill"><FaCalendarAlt size={10} />{car.year}</span>
                            <span className="car-pill"><FaGasPump size={10} />{car.fuelType}</span>
                            <span className="car-pill"><FaCogs size={10} />{car.transmission}</span>
                          </div>

                          <AnimatePresence>
                            {exp && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: .17 }} className="car-details-expanded">
                                <div><strong>Brand</strong><span>{car.brand}</span></div>
                                <div><strong>Model</strong><span>{car.model}</span></div>
                                <div><strong>Condition</strong><span>{car.condition || 'Verified Quality'}</span></div>
                                <div><strong><FaPalette size={10} /> Color</strong><span>{car.color}</span></div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Action Grid */}
                          <div className="car-actions">
                            <button className={`btn ${exp ? 'btn-ghost' : 'btn-primary'}`} onClick={() => setExpandedCardId(p => p === car._id ? null : car._id)}>
                              {exp ? 'Less' : 'Details'}
                            </button>
                            <a href={`tel:${car.contactNumber || CONTACT}`} className="btn btn-success" aria-label={`Call about ${car.title}`}>
                              <FaPhone size={11} /> Call
                            </a>
                            <a href={`https://wa.me/254${String(car.contactNumber || CONTACT).replace(/^0/, '')}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa" aria-label={`WhatsApp about ${car.title}`}>
                              <FaWhatsapp size={12} /> WA
                            </a>
                          </div>

                          {/* Test Drive Button */}
                          <button
                            onClick={() => setTestDriveCar(car)}
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', marginTop: '.4rem', fontSize: '.78rem', color: 'var(--text-2)' }}
                          >
                            <FaCalendarCheck size={11} color="var(--red)" /> Book Test Drive on Kiambu Road
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
            </div>
          </div>

          {/* ── Showroom Trust Bar ── */}
          <div style={{ background: '#0a0a0e', padding: '1.5rem 1rem', marginTop: '2rem', borderTop: '1px solid rgba(225,29,72,.15)' }}>
            <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(1rem, 5vw, 4rem)', flexWrap: 'wrap' }}>
              {[
                [FaShieldAlt, 'Certified Inspection & Clean Titles'],
                [FaHandshake, 'Transparent Pricing & Trade-ins'],
                [FaRoad, 'Test Drives on Kiambu Road'],
                [FaCheck, 'Dedicated Motor Managers']
              ].map(([Icon, text], idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '.45rem', color: 'rgba(255,255,255,.8)', fontSize: '.82rem', fontWeight: 600 }}>
                  <Icon color="var(--red-lt)" size={14} /> {text}
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="footer">
            <div className="footer-grid">
              <div>
                <h3>BLUESEAL MOTOR MANAGER'S LTD</h3>
                <p style={{ color: 'var(--red-lt)', fontWeight: 600, fontStyle: 'italic', marginBottom: '.6rem' }}>Precision in every mile</p>
                <p>📍 {LOCATION}</p>
                <p>✉️ <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
                <p>🕒 Mon – Sun: 8:30 am – 6:30 pm</p>
                <p style={{ fontWeight: 700, color: '#fff', marginTop: '.5rem', fontSize: '1.05rem' }}>📞 0733-493-804</p>
              </div>
              <div>
                <h3>Showroom Location</h3>
                <iframe
                  title="Blue Seal Motor Managers Kiambu Road Location"
                  src="https://maps.google.com/maps?q=Kiambu%20Road,%20Nairobi,%20Kenya&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%" height="155"
                  style={{ border: 0, borderRadius: 'var(--r)', display: 'block', marginTop: '.5rem', filter: 'brightness(.9) saturate(.9)' }}
                  allowFullScreen="" loading="lazy" />
              </div>
            </div>
            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} BLUESEAL MOTOR MANAGER'S LTD (BMM). All rights reserved.</span>
              
              <button 
                onClick={() => setShowAdmin(true)} 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--text-3)', fontSize: '.75rem', padding: '.3rem .7rem' }}
                title="Open Dealer Admin Login"
              >
                <FaCog size={11} /> Dealer Admin Login
              </button>
            </div>
          </footer>

          {/* ── Floating WhatsApp ── */}
          <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent('Hi Blue Seal Motor Managers (BMM), I\'d like to enquire about a car on Kiambu Road.')}`}
            target="_blank" rel="noopener noreferrer"
            className="fab-wa" aria-label="Chat on WhatsApp" title="Chat on WhatsApp">
            <FaWhatsapp />
          </a>

          {/* ── Fullscreen Lightbox Modal ── */}
          <AnimatePresence>
            {fullscreenImg && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setFullscreenImg(null)}>
                <img src={fullscreenImg} alt="Vehicle high resolution full view" className="modal-img" onClick={e => e.stopPropagation()} />
                <button className="modal-close" onClick={() => setFullscreenImg(null)} aria-label="Close image view">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Financing Loan Calculator Modal ── */}
          <AnimatePresence>
            {calculatorCar && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setCalculatorCar(null)}>
                <div className="modal-card" onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <FaCalculator color="var(--red)" /> Vehicle Financing Calculator
                    </h3>
                    <button onClick={() => setCalculatorCar(null)} className="btn btn-ghost btn-sm">✕</button>
                  </div>

                  <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
                    Estimate monthly bank financing payments for <strong>{calculatorCar.title}</strong> (KES {calcPrice.toLocaleString()}).
                  </p>

                  <div className="calc-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', fontWeight: 700 }}>
                      <span>Deposit ({depositPct}%):</span>
                      <span style={{ color: 'var(--red)' }}>KES {depositAmount.toLocaleString()}</span>
                    </div>
                    <input type="range" min="10" max="60" step="5" value={depositPct} onChange={e => setDepositPct(Number(e.target.value))} className="calc-range" />
                  </div>

                  <div className="calc-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', fontWeight: 700 }}>
                      <span>Repayment Term:</span>
                      <span>{loanMonths} Months ({loanMonths / 12} Yrs)</span>
                    </div>
                    <input type="range" min="12" max="60" step="6" value={loanMonths} onChange={e => setLoanMonths(Number(e.target.value))} className="calc-range" />
                  </div>

                  <div className="calc-result-box">
                    <div style={{ fontSize: '.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Estimated Monthly Payment</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--red)', marginTop: '.2rem' }}>
                      KES {monthlyPayment.toLocaleString()} <span style={{ fontSize: '.85rem', color: 'var(--text-2)', fontWeight: 500 }}>/ mo</span>
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.35rem' }}>
                      Based on ~{interestRate}% p.a. indicative commercial bank rate.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
                    <a
                      href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(`Hi Blue Seal Motor Managers (BMM), I would like to discuss bank financing for ${calculatorCar.title} (Deposit: KES ${depositAmount.toLocaleString()}, ~KES ${monthlyPayment.toLocaleString()}/mo for ${loanMonths} months).`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-primary" style={{ flex: 1 }}
                    >
                      <FaWhatsapp /> Enquire Financing with Agent
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Test Drive Booking Modal ── */}
          <AnimatePresence>
            {testDriveCar && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setTestDriveCar(null)}>
                <div className="modal-card" onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <FaCalendarCheck color="var(--red)" /> Schedule a Test Drive
                    </h3>
                    <button onClick={() => setTestDriveCar(null)} className="btn btn-ghost btn-sm">✕</button>
                  </div>

                  <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '1.2rem' }}>
                    Experience <strong>{testDriveCar.title}</strong> at our Kiambu Road showroom.
                  </p>

                  <form onSubmit={handleTestDriveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    <div>
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text" required placeholder="e.g. John Kamau"
                        value={testDriveForm.name} onChange={e => setTestDriveForm(p => ({ ...p, name: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">Phone / WhatsApp Number *</label>
                      <input
                        type="tel" required placeholder="07XXXXXXXX"
                        value={testDriveForm.phone} onChange={e => setTestDriveForm(p => ({ ...p, phone: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-grid-2">
                      <div>
                        <label className="form-label">Preferred Date *</label>
                        <input
                          type="date" required
                          value={testDriveForm.date} onChange={e => setTestDriveForm(p => ({ ...p, date: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label">Time Slot *</label>
                        <select
                          value={testDriveForm.time} onChange={e => setTestDriveForm(p => ({ ...p, time: e.target.value }))}
                          className="form-select"
                        >
                          <option>Morning (9:00 AM - 12:00 PM)</option>
                          <option>Afternoon (1:00 PM - 4:00 PM)</option>
                          <option>Evening (4:00 PM - 6:00 PM)</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '.5rem' }}>
                      <FaWhatsapp /> Confirm Booking on WhatsApp
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default App;
