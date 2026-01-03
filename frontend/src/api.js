import axios from 'axios';

const BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
});
export const registerUser = (formData) => api.post('/users/register', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const loginUser = (credentials) => api.post('/users/login', credentials);
export const getAllUsers = () => api.get('/users/');
export const addRestaurant = (formData) => api.post('/restaurants/add', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const addMenuItem = (restaurantId, formData) => api.post(`/restaurants/${restaurantId}/menu/add`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getMenu = (restaurantId) => api.get(`/restaurants/${restaurantId}/menu`);

export const getAllRestaurants = () => api.get('/restaurants/');

export const createOrder = (formData) => api.post('/orders/create', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const updateOrderStatus = (orderId, status) => api.put(`/orders/${orderId}/status`, null, {
  params: { new_status: status }
});
export const getAllOrders = () => api.get('/orders/');

export default api;