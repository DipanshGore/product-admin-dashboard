import axiosInstance from '../axios';

export const fetchProducts = async ({ skip = 0, limit = 10, search = '', category = '', sortBy = '', order = 'asc' }, signal) => {
  let url = '/products';
  
  // DummyJSON cannot search and filter category together. Search takes precedence.
  if (search && search.trim() !== '') {
    url = `/products/search?q=${encodeURIComponent(search.trim())}`;
  } else if (category && category.trim() !== '') {
    url = `/products/category/${encodeURIComponent(category.trim())}`;
  }

  // Only pass sortBy and order if a field is explicitly chosen
  const params = { limit, skip}; // Added delay for demonstration purposes
  if (sortBy) {
    params.sortBy = sortBy;
    params.order = order || 'asc';
  }

  const response = await axiosInstance.get(url, { params, signal });
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};

export const fetchCategories = async () => {
  const response = await axiosInstance.get('/products/categories');
  return response.data.map(c => typeof c === 'string' ? c : c.slug);
};

export const createProduct = async (productData) => {
  const response = await axiosInstance.post('/products/add', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await axiosInstance.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};