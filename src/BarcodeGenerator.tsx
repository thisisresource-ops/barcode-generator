import React, { useState, useEffect } from 'react';
import { Upload, Plus, Edit2, Trash2, Printer, Download, Search, FileUp } from 'lucide-react';

const BarcodeGenerator = () => {
  const [products, setProducts] = useState([]);
  const [logo, setLogo] = useState(null);
  const [currentView, setCurrentView] = useState('database');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', upc: '' });
  const [labelWidth, setLabelWidth] = useState(37);
  const [labelHeight, setLabelHeight] = useState(25);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProducts = await window.storage.get('products');
        const storedLogo = await window.storage.get('logo');
        
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts.value));
        }
        if (storedLogo) {
          setLogo(storedLogo.value);
        }
      } catch (error) {
        console.log('No stored data found');
      }
    };
    loadData();
  }, []);

  const saveProducts = async (newProducts) => {
    setProducts(newProducts);
    try {
      await window.storage.set('products', JSON.stringify(newProducts));
    } catch (error) {
      console.error('Failed to save products:', error);
    }
  };

  const saveLogo = async (logoData) => {
    setLogo(logoData);
    try {
      await window.storage.set('logo', logoData);
    } catch (error) {
      console.error('Failed to save logo:', error);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        saveLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = () => {
    if (formData.name && formData.sku && formData.upc) {
      const newProduct = {
        id: Date.now(),
        ...formData
      };
      saveProducts([...products, newProduct]);
      setFormData({ name: '', sku: '', upc: '' });
    }
  };

  const handleEditProduct = () => {
    if (formData.name && formData.sku && formData.upc) {
      const updatedProducts = products.map(p => 
        p.id === editingProduct.id ? { ...p, ...formData } : p
      );
      saveProducts(updatedProducts);
      setEditingProduct(null);
      setFormData({ name: '', sku: '', upc: '' });
    }
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      saveProducts(products.filter(p => p.id !== id));
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, sku: product.sku, upc: product.upc });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', upc: '' });
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const newProducts = lines.slice(1).map((line, index) => {
          const [name, sku, upc] = line.split(',').map(s => s.trim());
          return { id: Date.now() + index, name, sku, upc };
        }).filter(p => p.name && p.sku && p.upc);
        saveProducts([...products, ...newProducts]);
      };
      reader.readAsText(file);
    }
  };

  const exportCSV = () => {
    const csv = ['Product Name,SKU,UPC', 
      ...products.map(p => `${p.name},${p.sku},${p.upc}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.upc.includes(searchTerm)
  );

  const toggleProductSelection = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const generateBarcode = (upc) => {
    const bars = upc.split('').map(digit => {
      const patterns = ['0001101', '0011001', '0010011', '0111101', '0100011', 
                       '0110001', '0101111', '0111011', '0110111', '0001011'];
      return patterns[parseInt(digit)] || '0000000';
    }).join('');
    
    return (
      <div style={{ display: 'inline-flex', height: '40px' }}>
        {bars.split('').map((bit, i) => (
          <div key={i} style={{
            width: '2px',
            height: '40px',
            backgroundColor: bit === '1' ? '#000' : '#fff',
            display: 'inline-block'
          }} />
        ))}
      </div>
    );
  };

  const BarcodeLabel = ({ product }) => (
    <div style={{
      width: `${labelWidth}mm`,
      height: `${labelHeight}mm`,
      border: '1px solid #ddd',
      padding: '2mm',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      pageBreakInside: 'avoid',
      backgroundColor: 'white'
    }}>
      <div style={{ width: '100%', textAlign: 'center', minHeight: '6mm', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {logo && (
          <img src={logo} alt="Logo" style={{ 
            maxHeight: '6mm', 
            maxWidth: '80%', 
            objectFit: 'contain' 
          }} />
        )}
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        {generateBarcode(product.upc)}
      </div>
      <div style={{ fontSize: '6pt', textAlign: 'center', width: '100%' }}>{product.upc}</div>
      <div style={{ 
        fontSize: '7pt', 
        fontWeight: 'bold', 
        textAlign: 'center',
        lineHeight: '1.1',
        width: '100%'
      }}>
        {product.name}
      </div>
      <div style={{ fontSize: '6pt', textAlign: 'center', width: '100%' }}>SKU: {product.sku}</div>
    </div>
  );

  const printLabels = () => {
    window.print();
  };

  const btnStyle = (isActive) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#2563eb' : '#e5e7eb',
    color: isActive ? 'white' : 'black',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '20px' }}>Barcode Label Generator</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setCurrentView('database')} style={btnStyle(currentView === 'database')}>
          Product Database
        </button>
        <button onClick={() => setCurrentView('single')} style={btnStyle(currentView === 'single')}>
          Single Label
        </button>
        <button onClick={() => setCurrentView('bulk')} style={btnStyle(currentView === 'bulk')}>
          Bulk Print
        </button>
        <button onClick={() => setCurrentView('settings')} style={btnStyle(currentView === 'settings')}>
          Settings
        </button>
      </div>

      {currentView === 'database' && (
        <div>
          <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr 1fr' }}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
              <input
                type="text"
                placeholder="UPC Code"
                value={formData.upc}
                onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {editingProduct ? (
                <>
                  <button onClick={handleEditProduct} style={{
                    padding: '10px 20px', backgroundColor: '#10b981', color: 'white',
                    border: 'none', borderRadius: '5px', cursor: 'pointer'
                  }}>
                    Update Product
                  </button>
                  <button onClick={cancelEdit} style={{
                    padding: '10px 20px', backgroundColor: '#6b7280', color: 'white',
                    border: 'none', borderRadius: '5px', cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={handleAddProduct} style={{
                  padding: '10px 20px', backgroundColor: '#10b981', color: 'white',
                  border: 'none', borderRadius: '5px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <Plus size={16} /> Add Product
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px 10px 10px 40px', borderRadius: '5px', border: '1px solid #ccc', width: '100%' }}
              />
            </div>
            <label style={{
              padding: '10px 20px', backgroundColor: '#2563eb', color: 'white',
              borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <FileUp size={16} /> Import CSV
              <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
            </label>
            <button onClick={exportCSV} style={{
              padding: '10px 20px', backgroundColor: '#10b981', color: 'white',
              border: 'none', borderRadius: '5px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Download size={16} /> Export CSV
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Product Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>SKU</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>UPC Code</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{product.name}</td>
                  <td style={{ padding: '12px' }}>{product.sku}</td>
                  <td style={{ padding: '12px' }}>{product.upc}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => startEdit(product)} style={{
                      padding: '5px 10px', backgroundColor: '#3b82f6', color: 'white',
                      border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px'
                    }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} style={{
                      padding: '5px 10px', backgroundColor: '#ef4444', color: 'white',
                      border: 'none', borderRadius: '3px', cursor: 'pointer'
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No products found. Add your first product above!
            </div>
          )}
        </div>
      )}

      {currentView === 'single' && (
        <div>
          <h2 style={{ marginBottom: '15px' }}>Generate Single Label</h2>
          <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
            <select
              onChange={(e) => {
                const product = products.find(p => p.id === parseInt(e.target.value));
                if (product) {
                  setFormData({ name: product.name, sku: product.sku, upc: product.upc });
                }
              }}
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="">Select from database or enter manually below</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.sku}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="UPC Code"
              value={formData.upc}
              onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>

          {formData.name && formData.sku && formData.upc && (
            <div>
              <h3 style={{ marginBottom: '10px' }}>Preview:</h3>
              <div id="printArea" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <BarcodeLabel product={formData} />
              </div>
              <button onClick={printLabels} style={{
                padding: '10px 20px', backgroundColor: '#10b981', color: 'white',
                border: 'none', borderRadius: '5px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto'
              }}>
                <Printer size={16} /> Print Label
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'bulk' && (
        <div>
          <h2 style={{ marginBottom: '15px' }}>Bulk Print Labels</h2>
          <p style={{ marginBottom: '15px', color: '#6b7280' }}>
            Select products from your database to print multiple labels at once.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(products.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Product Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>SKU</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>UPC Code</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>{product.name}</td>
                  <td style={{ padding: '12px' }}>{product.sku}</td>
                  <td style={{ padding: '12px' }}>{product.upc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedProducts.length > 0 && (
            <div>
              <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                Selected: {selectedProducts.length} product(s)
              </p>
              <div id="printArea" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(40mm, 1fr))',
                gap: '5mm',
                marginBottom: '20px'
              }}>
                {products.filter(p => selectedProducts.includes(p.id)).map(product => (
                  <BarcodeLabel key={product.id} product={product} />
                ))}
              </div>
              <button onClick={printLabels} style={{
                padding: '10px 20px', backgroundColor: '#10b981', color: 'white',
                border: 'none', borderRadius: '5px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto'
              }}>
                <Printer size={16} /> Print {selectedProducts.length} Label(s)
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'settings' && (
        <div>
          <h2 style={{ marginBottom: '15px' }}>Settings</h2>
          
          <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Company Logo</h3>
            <label style={{
              padding: '10px 20px', backgroundColor: '#2563eb', color: 'white',
              borderRadius: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}>
              <Upload size={16} /> {logo ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </label>
            {logo && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ marginBottom: '10px' }}>Current Logo:</p>
                <img src={logo} alt="Logo" style={{ maxWidth: '200px', border: '1px solid #ccc' }} />
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px' }}>Label Dimensions</h3>
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Width (mm):
                </label>
                <input
                  type="number"
                  value={labelWidth}
                  onChange={(e) => setLabelWidth(Number(e.target.value))}
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Height (mm):
                </label>
                <input
                  type="number"
                  value={labelHeight}
                  onChange={(e) => setLabelHeight(Number(e.target.value))}
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%' }}
                />
              </div>
            </div>
            <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
              Default: 37mm x 25mm
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body > *:not(#printArea) {
            display: none !important;
          }
          #printArea {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 10mm;
          }
          @page {
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default BarcodeGenerator;
