'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { 
  fetchProducts, 
  fetchCategories, 
  deleteProduct, 
  createProduct, 
  updateProduct 
} from '@/lib/api/products';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. URL Resilience: Handle non-numeric page values like ?page=abc
  const rawPage = searchParams.get('page');
  const parsedPage = parseInt(rawPage || '1', 10);
  const currentPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  // 2. URL Resilience: Handle invalid limit values like ?limit=random
  const limitParam = parseInt(searchParams.get('limit') || '10', 10);
  const currentLimit = [10, 20, 50].includes(limitParam) ? limitParam : 10;

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState(search);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ title: '', price: '', category: '', stock: '', rating: 5 });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const abortControllerRef = useRef(null);

  // Update URL helper
  const updateURL = useCallback((newParams) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  // Keep search input synced with URL
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateURL({ search: searchInput, page: 1, category: '' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateURL]);

  // Auto-correct malformed URLs like ?page=abc directly in the address bar
  useEffect(() => {
    if (rawPage && (isNaN(parsedPage) || parsedPage < 1)) {
      updateURL({ page: 1 });
    }
  }, [rawPage, parsedPage, updateURL]);

  // Load products from API
  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError('');

    try {
      const skip = (currentPage - 1) * currentLimit;
      const data = await fetchProducts(
        {
          skip,
          limit: currentLimit,
          search,
          category,
          sortBy: sortBy || undefined
        },
        abortControllerRef.current.signal
      );

      // URL Resilience: Handle out-of-bounds page entries like ?page=999
      if (data.total > 0 && skip >= data.total) {
        updateURL({ page: 1 });
        return;
      }

      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      if (!axios.isCancel(err) && err.name !== 'CanceledError') {
        setError(err.message || 'Failed to load products.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentLimit, search, category, sortBy, updateURL]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Modal Handlers
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ title: '', price: '', category: categories[0] || 'beauty', stock: '', rating: 4.5 });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      price: product.price,
      category: product.category,
      stock: product.stock,
      rating: product.rating
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.price || Number(formData.price) <= 0) errors.price = 'Valid price is required';
    if (!formData.stock || Number(formData.stock) < 0) errors.stock = 'Valid stock count is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData, price: Number(formData.price), stock: Number(formData.stock) } : p));
      } else {
        const newProd = await createProduct(formData);
        setProducts(prev => [{ ...newProd, id: Date.now(), thumbnail: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png' }, ...prev]);
        setTotal(t => t + 1);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      alert(err.message || 'Action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingId);
      setProducts(prev => prev.filter(p => p.id !== deletingId));
      setTotal(t => Math.max(0, t - 1));
      setDeletingId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage catalog items, stock, and pricing</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Search products by title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full md:w-80 px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => updateURL({ category: e.target.value, page: 1, search: '' })}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => updateURL({ sortBy: e.target.value, page: 1 })}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sort By</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-gray-500">Loading products...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center text-red-600">
          <p className="font-semibold">{error}</p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-500">
          No products match your criteria.
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover rounded-lg border bg-gray-50" />
                      <Link href={`/products/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${p.price}</td>
                    <td className="px-6 py-4 text-sm text-amber-600 font-medium">★ {p.rating}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.stock}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => openEditModal(p)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeletingId(p.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 px-2.5 py-1.5 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {products.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex gap-4">
                  <img src={p.thumbnail} alt={p.title} className="w-20 h-20 object-cover rounded-lg border" />
                  <div className="flex-1">
                    <Link href={`/products/${p.id}`} className="font-semibold text-gray-900 line-clamp-1 hover:text-blue-600">
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{p.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-gray-900">${p.price}</span>
                      <span className="text-xs text-amber-600 font-medium">★ {p.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    onClick={() => openEditModal(p)}
                    className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-600 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingId(p.id)}
                    className="text-xs font-medium px-3 py-1.5 bg-red-50 text-red-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-sm text-gray-600">
              Showing {Math.min((currentPage - 1) * currentLimit + 1, total)} - {Math.min(currentPage * currentLimit, total)} of {total}
            </span>
            <div className="flex items-center gap-3">
              <select
                value={currentLimit}
                onChange={(e) => updateURL({ limit: e.target.value, page: 1 })}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </select>

              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => updateURL({ page: currentPage - 1 })}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage * currentLimit >= total}
                  onClick={() => updateURL({ page: currentPage + 1 })}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                />
                {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                  />
                  {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                  />
                  {formErrors.stock && <p className="text-xs text-red-500 mt-1">{formErrors.stock}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Popup */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-xl p-6 shadow-xl text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete Product?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to remove this product? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}