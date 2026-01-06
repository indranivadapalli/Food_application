import React, { useState, useEffect } from 'react';
import { Menu, X, Plus, Edit2, Trash2, Clock, Package, LogOut, ChevronRight } from 'lucide-react';

const RestaurantDashboard = () => {
  const [tab, setTab] = useState('Menu Management');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orders, setOrders] = useState([]);
  
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  
  const [newCategory, setNewCategory] = useState({ name: '', start_time: '', end_time: '' });
  const [newItem, setNewItem] = useState({ 
    item_name: '', 
    price: '', 
    is_available: true,
    menu_item_pic: null 
  });

  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : { id: 2, name: "Demo Restaurant", email: "demo@restaurant.com" };
  });

  const API_BASE = 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    fetchOrders();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/category/${userData.id}/categories`);
      const data = await res.json();
      if (data.status === "success") {
        setCategories(data.categories);
        if (data.categories.length > 0 && !selectedCategory) {
          setSelectedCategory(data.categories[0].name);
        }
      }
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu/${userData.id}`);
      const data = await res.json();
      if (data.status === "success") {
        setMenuItems(data.menu);
      }
    } catch (err) {
      console.error("Error fetching menu items", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      const data = await res.json();
      if (data.status === "success") {
        const myOrders = data.orders.filter(o => o.restaurant_id === userData.id);
        setOrders(myOrders);
      }
    } catch (err) {
      console.error("Error fetching orders", err);
    }
  };

  const handleAddCategory = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('start_time', newCategory.start_time);
      formData.append('end_time', newCategory.end_time);

      const res = await fetch(`${API_BASE}/category/${userData.id}/categories/add`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setOpenAddCategory(false);
        setNewCategory({ name: '', start_time: '', end_time: '' });
        fetchCategories();
        alert('Category added successfully!');
      } else {
        alert(data.message || 'Failed to add category');
      }
    } catch (err) {
      console.error("Failed to add category", err);
      alert('Error adding category');
    }
  };

  const handleAddItem = async () => {
    try {
      const categoryId = categories.find(c => c.name === selectedCategory)?.id;
      if (!categoryId) {
        alert('Please select a category first');
        return;
      }

      const formData = new FormData();
      formData.append('item_name', newItem.item_name);
      formData.append('price', newItem.price);
      formData.append('category_id', categoryId);
      formData.append('is_available', newItem.is_available);
      if (newItem.menu_item_pic) {
        formData.append('menu_item_pic', newItem.menu_item_pic);
      }

      const res = await fetch(`${API_BASE}/menu/${userData.id}/add`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setOpenAddItem(false);
        setNewItem({ item_name: '', price: '', is_available: true, menu_item_pic: null });
        fetchMenuItems();
        alert('Menu item added successfully!');
      } else {
        alert(data.message || 'Failed to add item');
      }
    } catch (err) {
      console.error("Failed to add item", err);
      alert('Error adding menu item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/menu/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === "success") {
        fetchMenuItems();
        alert('Item deleted successfully');
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      alert('Error deleting item');
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      const formData = new FormData();
      formData.append('is_available', !currentStatus);

      const res = await fetch(`${API_BASE}/menu/${itemId}/availability`, {
        method: 'PATCH',
        body: formData
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchMenuItems();
      }
    } catch (err) {
      console.error("Failed to toggle availability", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center border-b">
          <div className="w-16 h-16 bg-indigo-900 rounded-full mx-auto mb-3 flex items-center justify-center">
            <Menu className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-indigo-900">{userData.name}</h2>
          <p className="text-sm text-gray-500">Restaurant Partner</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-50 border-2 border-indigo-900 text-indigo-900'
                      : 'bg-white border border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">{cat.name}</p>
                      <p className="text-xs text-gray-500">{cat.start_time} - {cat.end_time}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setOpenAddCategory(true)}
              className="w-full mt-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => setTab('Menu Management')}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-3 ${
                tab === 'Menu Management' ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Menu Management</span>
            </button>
            <button
              onClick={() => setTab('Restaurant Orders')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                tab === 'Restaurant Orders' ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span>Restaurant Orders</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'Menu Management' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
                {selectedCategory && (
                  <p className="text-gray-500 capitalize mt-1">Category: {selectedCategory}</p>
                )}
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setOpenAddItem(true)}
                  className="px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Menu Item
                </button>
              )}
            </div>

            {!selectedCategory ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600">Select a category to view menu items</h3>
              </div>
            ) : !menuItems[selectedCategory]?.items || menuItems[selectedCategory]?.items?.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No items in this category yet</h3>
                <button
                  onClick={() => setOpenAddItem(true)}
                  className="mt-4 px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems[selectedCategory]?.items?.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    {item.menu_item_pic && (
                      <img src={item.menu_item_pic} alt={item.name} className="w-full h-40 object-cover rounded-t-lg" />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <span className="text-indigo-900 font-bold text-lg">₹{item.price}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.is_available)}
                          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                            item.is_available
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </button>
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Restaurant Orders' && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Orders for Your Kitchen</h1>
            {orders.length > 0 ? orders.map(o => (
              <div key={o.id} className="bg-white rounded-lg shadow p-6 mb-4 border-l-4 border-indigo-900">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold">Order #{o.id}</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-sm font-medium">
                    {o.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">Total Amount: ₹{o.total_amount}</p>
                <p className="text-sm text-gray-500">User ID: {o.user_id}</p>
              </div>
            )) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Menu className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600">No orders received yet</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {openAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Category</h2>
              <button onClick={() => setOpenAddCategory(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Breakfast, Lunch, Starters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={newCategory.start_time}
                  onChange={(e) => setNewCategory({...newCategory, start_time: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={newCategory.end_time}
                  onChange={(e) => setNewCategory({...newCategory, end_time: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setOpenAddCategory(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {openAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Menu Item</h2>
              <button onClick={() => setOpenAddItem(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dish Name</label>
                <input
                  type="text"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Item Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewItem({...newItem, menu_item_pic: e.target.files[0]})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {newItem.menu_item_pic && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {newItem.menu_item_pic.name}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setOpenAddItem(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="flex-1 px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
