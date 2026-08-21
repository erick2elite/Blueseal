import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaList, FaUpload, FaTimes,
  FaFileDownload, FaSearch
} from 'react-icons/fa';
import { API_URL, saveLocalCar, removeLocalCar, mergeCarsWithLocal } from './api.js';
import './smvt.css';

const NO_IMAGE_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60' viewBox='0 0 80 60'%3E%3Crect width='80' height='60' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%2394a3b8'%3ENo Img%3C/text%3E%3C/svg%3E`;

const AdminPanel = ({ authToken, onUnauthorized, onCarAddedOrUpdated }) => {
  const [cars, setCars] = useState([]);
  const [view, setView] = useState('list'); // 'add' or 'list'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingCar, setEditingCar] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');

  const [carData, setCarData] = useState({
    title: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: '',
    condition: 'Used',
    status: 'Available',
    contactNumber: '0733493804',
    images: []
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleUnauthorized = () => {
    showMessage('Session expired. Please log in again.', 'error');
    if (onUnauthorized) onUnauthorized();
  };

  const fetchCars = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cars`);
      if (res.ok) {
        const data = await res.json();
        setCars(mergeCarsWithLocal(data));
      } else {
        setCars(mergeCarsWithLocal([]));
      }
    } catch {
      setCars(mergeCarsWithLocal([]));
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCarData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const autoTitle = `${carData.year ? carData.year + ' ' : ''}${carData.brand} ${carData.model}`.trim() || carData.title || 'Vehicle';
      const payload = { ...carData, title: autoTitle, price: Number(carData.price), year: Number(carData.year) };
      const url = editingCar ? `${API_URL}/api/cars/${editingCar._id || editingCar.id}` : `${API_URL}/api/cars`;
      const method = editingCar ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        const savedCar = (data && (data._id || data.id)) ? data : {
          ...payload,
          _id: editingCar ? (editingCar._id || editingCar.id) : `car-${Date.now()}`,
          id: editingCar ? (editingCar._id || editingCar.id) : `car-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        saveLocalCar(savedCar, Boolean(editingCar));
        showMessage(editingCar ? `"${autoTitle}" updated successfully!` : `"${autoTitle}" added to showroom!`, 'success');
        resetForm();
        fetchCars();
        setView('list');
        if (onCarAddedOrUpdated) onCarAddedOrUpdated();
      } else if (res.status === 401) {
        handleUnauthorized();
      } else {
        showMessage(`Error: ${data?.error || data?.message || 'Failed to save car'}`, 'error');
      }
    } catch {
      showMessage('Unable to save car. Check your backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Support up to 5 image uploads with canvas compression
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
    const promises = files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxW = 900, maxH = 675;
          let { width: w, height: h } = img;
          if (w > maxW) { h = (h * maxW) / w; w = maxW; }
          if (h > maxH) { w = (w * maxH) / h; h = maxH; }
          canvas.width = w; canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.70));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }));
    Promise.all(promises).then(imgs => setCarData(prev => ({ ...prev, images: imgs })));
  };

  const removeImage = (i) => {
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
    setCarData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  };

  const resetForm = () => {
    setCarData({
      title: '', brand: '', model: '', year: new Date().getFullYear(),
      price: '', fuelType: 'Petrol', transmission: 'Automatic',
      color: '', condition: 'Used', status: 'Available', contactNumber: '0733493804',
      images: []
    });
    setImagePreviews([]);
    setEditingCar(null);
  };

  const handleEdit = (car) => {
    setCarData({ ...car });
    setEditingCar(car);
    setImagePreviews(car.images || []);
    setView('add');
  };

  const handleDelete = async (carId, carTitle) => {
    if (!window.confirm(`Delete "${carTitle || 'this vehicle'}" from inventory? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/cars/${carId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status === 404 || res.status === 500) {
        removeLocalCar(carId);
        showMessage('Vehicle deleted successfully from showroom!', 'success');
        fetchCars();
        if (onCarAddedOrUpdated) onCarAddedOrUpdated();
      } else if (res.status === 401) {
        handleUnauthorized();
      } else {
        showMessage(`Error: ${data?.error || data?.message || 'Failed to delete'}`, 'error');
      }
    } catch {
      removeLocalCar(carId);
      showMessage('Vehicle deleted successfully from showroom!', 'success');
      fetchCars();
      if (onCarAddedOrUpdated) onCarAddedOrUpdated();
    }
  };

  // Quick Export Inventory CSV Report
  const handleExportCSV = () => {
    if (!cars.length) {
      showMessage('No cars to export.', 'error');
      return;
    }
    const headers = ['Title', 'Brand', 'Model', 'Year', 'Price_KES', 'Fuel', 'Transmission', 'Color', 'Condition', 'Status'];
    const rows = cars.map(c => [
      `"${c.title || `${c.year} ${c.brand} ${c.model}`}"`,
      `"${c.brand || ''}"`,
      `"${c.model || ''}"`,
      c.year || '',
      c.price || 0,
      `"${c.fuelType || ''}"`,
      `"${c.transmission || ''}"`,
      `"${c.color || ''}"`,
      `"${c.condition || ''}"`,
      `"${c.status || 'Available'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BlueSeal_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage('Inventory summary CSV downloaded!', 'success');
  };

  const totalInventoryValue = cars.reduce((acc, c) => acc + (Number(c.price) || 0), 0);
  const availableCount = cars.filter(c => c.status !== 'Sold').length;

  const filteredAdminCars = cars.filter(c => {
    const q = adminSearch.toLowerCase();
    return !q || [c.title, c.brand, c.model, c.color, c.status, c.year?.toString()].some(f => f?.toLowerCase().includes(q));
  });

  const inputCls = 'form-input';
  const selectCls = 'form-select';

  return (
    <div className="admin-wrap" style={{ paddingTop: '1.25rem', paddingBottom: '3rem' }}>
      <div className="admin-card">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--text)' }}>
              BLUESEAL MOTOR MANAGER'S LTD (BMM)
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '.85rem', marginTop: '.2rem' }}>
              Kiambu Road Showroom · Management Portal
            </p>
          </div>
          <div className="admin-tabs">
            <button
              onClick={() => setView('list')}
              className={`btn ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <FaList /> Manage ({cars.length})
            </button>
            <button
              onClick={() => { setView('add'); resetForm(); }}
              className={`btn ${view === 'add' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <FaPlus /> {editingCar ? 'Edit Car' : 'Add New Car'}
            </button>
          </div>
        </div>

        {/* Alert message */}
        {message.text && (
          <div className={`alert alert--${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1.25rem' }}>
            {message.text}
          </div>
        )}

        {/* Real-time KPI Stats Bar */}
        <div className="stats-bar">
          <div className="stat-box">
            <div className="stat-box-num">{cars.length}</div>
            <div className="stat-box-label">Total Inventory</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num">KES {(totalInventoryValue / 1000000).toFixed(1)}M</div>
            <div className="stat-box-label">Total Stock Value</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num" style={{ color: 'var(--green)' }}>{availableCount}</div>
            <div className="stat-box-label">Available for Sale</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num" style={{ color: 'var(--gold)' }}>{cars.filter(c => c.status === 'Reserved').length}</div>
            <div className="stat-box-label">Reserved / In Deals</div>
          </div>
        </div>

        {view === 'add' ? (
          /* Add / Edit Form */
          <form onSubmit={handleSubmit}>
            {editingCar && (
              <div className="alert alert--warning" style={{ marginBottom: '1rem', fontSize: '.85rem' }}>
                ✏️ Editing Vehicle: <strong>{editingCar.title || `${editingCar.brand} ${editingCar.model}`}</strong>
              </div>
            )}

            <div className="form-grid-2">
              <div>
                <label className="form-label">Brand / Make *</label>
                <input name="brand" value={carData.brand} onChange={handleInputChange} placeholder="e.g. Toyota, Mercedes-Benz, BMW, Land Rover" required className={inputCls} />
              </div>
              <div>
                <label className="form-label">Model *</label>
                <input name="model" value={carData.model} onChange={handleInputChange} placeholder="e.g. Prado TX, C200 AMG, Range Rover Sport" required className={inputCls} />
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label className="form-label">Year of Manufacture *</label>
                <input name="year" type="number" min="1990" max="2027" value={carData.year} onChange={handleInputChange} required className={inputCls} />
              </div>
              <div>
                <label className="form-label">Price (KES) *</label>
                <input name="price" type="number" min="0" value={carData.price} onChange={handleInputChange} placeholder="e.g. 5800000" required className={inputCls} />
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label className="form-label">Fuel Type *</label>
                <select name="fuelType" value={carData.fuelType} onChange={handleInputChange} required className={selectCls}>
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Electric</option>
                </select>
              </div>
              <div>
                <label className="form-label">Transmission *</label>
                <select name="transmission" value={carData.transmission} onChange={handleInputChange} required className={selectCls}>
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label className="form-label">Exterior Color *</label>
                <input name="color" value={carData.color} onChange={handleInputChange} placeholder="e.g. Pearl White, Obsidian Black, Firenze Red" required className={inputCls} />
              </div>
              <div>
                <label className="form-label">Listing Status / Condition *</label>
                <select name="status" value={carData.status || carData.condition} onChange={handleInputChange} required className={selectCls}>
                  <option value="Available">Available for Sale</option>
                  <option value="Featured">Featured Spotlight</option>
                  <option value="Reserved">Reserved / Under Deal</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            {/* Image upload (Up to 5 images) */}
            <div style={{ marginBottom: '1.5rem', marginTop: '.4rem' }}>
              <label className="form-label">
                <FaUpload /> Vehicle Photos <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(Up to 5 images)</span>
              </label>
              <label className="image-upload-zone">
                <input type="file" multiple accept="image/*" onChange={handleFileSelect} />
                <div style={{ pointerEvents: 'none' }}>
                  <FaUpload size={24} style={{ marginBottom: '.4rem', color: 'var(--red)' }} />
                  <p style={{ fontWeight: 700, fontSize: '.95rem' }}>Tap or click to select vehicle photos</p>
                  <p style={{ fontSize: '.8rem', color: 'var(--text-3)', marginTop: '.2rem' }}>JPG, PNG, WebP — up to 5 images</p>
                </div>
              </label>

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="preview-item">
                      <img src={src} alt={`Preview ${i + 1}`} />
                      <button type="button" className="preview-remove" onClick={() => removeImage(i)} aria-label="Remove image">
                        <FaTimes size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div style={{ display: 'flex', gap: '.75rem', flexDirection: 'column' }}>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {loading ? (editingCar ? 'Updating…' : 'Adding…') : (editingCar ? 'Update Vehicle' : 'Add Vehicle to Showroom')}
              </button>
              {editingCar && (
                <button type="button" onClick={() => { resetForm(); setView('list'); }} className="btn btn-ghost btn-lg" style={{ width: '100%' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Manage Inventory View */
          <div>
            {/* Search & Export Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.65rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type="search"
                  placeholder="Filter stock by make, model, year…"
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px', fontSize: '.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button onClick={handleExportCSV} className="btn btn-ghost btn-sm" title="Export Inventory CSV Report">
                  <FaFileDownload /> Export CSV
                </button>
                <button onClick={() => { resetForm(); setView('add'); }} className="btn btn-primary btn-sm">
                  <FaPlus /> Add Car
                </button>
              </div>
            </div>

            <div className="manage-grid">
              {filteredAdminCars.map((car) => (
                <div key={car._id || car.id} className="manage-card">
                  <img
                    src={car.images?.[0] || NO_IMAGE_SVG}
                    alt={car.title}
                    className="manage-card-img"
                    onError={(e) => { e.target.src = NO_IMAGE_SVG; }}
                  />
                  <div className="manage-card-info">
                    <div className="manage-card-title">{car.title || `${car.brand} ${car.model}`}</div>
                    <div className="manage-card-price">KES {car.price?.toLocaleString()}</div>
                    <div className="manage-card-meta">
                      {car.year} · {car.fuelType} · {car.transmission} · {car.color}
                    </div>
                  </div>
                  <div className="manage-card-actions">
                    <button onClick={() => handleEdit(car)} className="btn btn-warning btn-sm">
                      <FaEdit /> Edit
                    </button>
                    <button onClick={() => handleDelete(car._id || car.id, car.title)} className="btn btn-danger btn-sm">
                      <FaTrash /> Del
                    </button>
                  </div>
                </div>
              ))}

              {filteredAdminCars.length === 0 && (
                <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '2.5rem' }}>
                  No vehicles match your search.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
