import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline, Avatar, FormControlLabel, TextField, Switch, Paper, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, Dialog, DialogContent, DialogActions, DialogTitle,
  ListItemIcon, Button, ListItemText, MenuItem, Divider, Container, Grid, Chip, CircularProgress, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Dashboard as DashIcon, Edit as EditIcon, Delete as DeleteIcon, AddBox, AccountCircle, ShoppingCart, ExitToApp, Menu as MenuIcon, LocalShipping
} from '@mui/icons-material';
import axios from 'axios';

const NEXT_STATUS = {
  PLACED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED"
};

const drawerWidth = 240;
const API_BASE_URL = "http://127.0.0.1:8000";

const resolveImageUrl = (url) => {
  console.log("resolveImageUrl called with:", url);
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;
  const fullUrl = `${API_BASE_URL}/${cleanPath}`;
  console.log("resolveImageUrl resolved to:", fullUrl);
  return fullUrl;
};

const RestaurantDashboard = () => {
  console.log("=== RestaurantDashboard: Component Rendering ===");
  const [activeTab, setActiveTab] = useState('Dashboard');
  const navigate = useNavigate();
  
  const [userObj, setUserObj] = useState(() => {
    const saved = localStorage.getItem('userObj');
    console.log("RestaurantDashboard: Initial userObj from localStorage:", saved);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      console.log("RestaurantDashboard: Parsed userObj:", parsed);
      return parsed.status === 'success' ? parsed : null;
    } catch (error) {
      console.error("RestaurantDashboard: Failed to parse userObj:", error);
      return null;
    }
  });

  const displayHeaderName = userObj?.restaurant?.name || userObj?.name || "Restaurant Owner";
  console.log("RestaurantDashboard: Display header name:", displayHeaderName);

  useEffect(() => {
    console.log("RestaurantDashboard: useEffect - Checking authentication");
    if (!userObj) {
      console.log("RestaurantDashboard: No userObj found, redirecting to login");
      navigate('/login');
      return;
    }
    if (userObj.role !== 'restaurant') {
      console.log("RestaurantDashboard: Invalid role, access denied");
      alert("Access Denied");
      navigate('/');
    }
  }, [userObj, navigate]);

  if (!userObj) {
    console.log("RestaurantDashboard: userObj is null, rendering nothing");
    return null;
  }

  const handleLogout = () => {
    console.log("RestaurantDashboard: Logout initiated");
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashIcon /> },
    { text: 'Menu', icon: <MenuIcon /> },
    { text: 'Add New Item', icon: <AddBox /> },
    { text: 'Orders', icon: <ShoppingCart /> },
    { text: 'Profile', icon: <AccountCircle /> },
  ];

  const renderContent = () => {
    console.log("RestaurantDashboard: Rendering content for tab:", activeTab);
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardHome userObj={userObj} />;
      case 'Menu':
        return <MenuView userObj={userObj} />;
      case 'Add New Item':
        return <AddItemForm userObj={userObj} />;
      case 'Orders':
        return <OrdersView userObj={userObj} />;
      case 'Profile':
        return <ProfileView userObj={userObj} />;
      default:
        return <DashboardHome userObj={userObj} />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1a237e' }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Restaurant Panel
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountCircle />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {displayHeaderName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  selected={activeTab === item.text}
                  onClick={() => {
                    console.log("RestaurantDashboard: Tab clicked:", item.text);
                    setActiveTab(item.text);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon><ExitToApp color="error" /></ListItemIcon>
                <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Toolbar />
        <Container maxWidth="lg">
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};

// --- DASHBOARD HOME COMPONENT ---
export const DashboardHome = ({ userObj }) => {
  console.log("=== DashboardHome: Component Rendering ===");
  console.log("DashboardHome: userObj received:", userObj);
  
  const [menuItems, setMenuItems] = useState([]); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [actionLoading, setActionLoading] = useState(false);

  const handleCompleteOrder = async (order) => {
    console.log("DashboardHome: handleCompleteOrder called for order:", order);
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) {
      console.log("DashboardHome: No next status found, order already completed");
      alert("Order already completed");
      return;
    }

    console.log("DashboardHome: Updating order status to:", nextStatus);
    setActionLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/orders/${order.id}/status`,
        null,
        { params: { status: nextStatus } }
      );
      console.log("DashboardHome: Order status update response:", response.data);

      setOrders(prev =>
        prev.map(o =>
          o.id === order.id ? { ...o, status: nextStatus } : o
        )
      );
      console.log("DashboardHome: Order status updated successfully in state");
    } catch (err) {
      console.error("DashboardHome: Failed to update order status:", err);
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    console.log("DashboardHome: useEffect triggered");
    if (!userObj?.restaurant?.id) {
      console.log("DashboardHome: No restaurant ID found, stopping load");
      setLoading(false);
      return;
    }
    console.log("DashboardHome: Fetching data for restaurant ID:", userObj.restaurant.id);
    
    const fetchData = async () => {
      try {
        console.log("DashboardHome: Fetching categories...");
        const categoriesRes = await axios.get(`${API_BASE_URL}/category/${userObj.restaurant.id}/categories`);
        console.log("DashboardHome: Categories response:", categoriesRes.data);
        
        const categoriesData = categoriesRes.data.categories || [];
        setCategories(categoriesData);
        console.log("DashboardHome: Categories set:", categoriesData);

        console.log("DashboardHome: Fetching menu...");
        const menuRes = await axios.get(`${API_BASE_URL}/menu/${userObj.restaurant.id}`);
        console.log("DashboardHome: Menu response:", menuRes.data);

        const menuData = menuRes.data.menu;
        const allItems = [];
        
        if (menuData && typeof menuData === 'object') {
          Object.entries(menuData).forEach(([categoryName, categoryData]) => {
            console.log(`DashboardHome: Processing category "${categoryName}":`, categoryData);
            if (categoryData.items && Array.isArray(categoryData.items)) {
              categoryData.items.forEach(item => {
                const processedItem = {
                  item_id: item.id,
                  name: item.name,
                  price: item.price,
                  category_id: categoryData.category_id,
                  category_name: categoryName,
                  menu_item_pic: item.menu_item_pic,
                  is_available: item.is_available
                };
                console.log("DashboardHome: Processed menu item:", processedItem);
                allItems.push(processedItem);
              });
            }
          });
        }
        setMenuItems(allItems);
        console.log("DashboardHome: Total menu items fetched:", allItems.length);

        console.log("DashboardHome: Fetching orders...");
        const ordersRes = await axios.get(`${API_BASE_URL}/orders/restaurant/${userObj.restaurant.id}`);
        console.log("DashboardHome: Orders response:", ordersRes.data);
        
        const ordersArray = ordersRes.data.orders || [];
        const formattedOrders = ordersArray.map(o => {
          const formatted = {
            id: o.order_id,
            status: o.status,
            totalAmount: o.total_amount,
            userId: o.user?.id,
            userName: o.user?.name,
            items: o.items?.map(item => ({
              id: item.menu_id,
              name: item.menu_item_name,
              quantity: item.quantity,
              menu_item_pic: item.menu_item_pic
            })) || []
          };
          console.log("DashboardHome: Formatted order:", formatted);
          return formatted;
        });
        setOrders(formattedOrders);
        console.log("DashboardHome: Total orders fetched:", formattedOrders.length);

      } catch (err) {
        console.error("DashboardHome: Fetch error:", err);
      } finally {
        setLoading(false);
        console.log("DashboardHome: Data fetch completed");
      }
    };
    fetchData();
    
  }, [userObj]);

  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category_name === selectedCategory);

  console.log("DashboardHome: Filtered items count:", filteredItems.length, "for category:", selectedCategory);

  if (loading) {
    console.log("DashboardHome: Rendering loading spinner");
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCart fontSize="large" /> Present Orders
      </Typography>

      <Grid container spacing={2} sx={{ mb: 6 }}>
        {orders.length > 0 && orders.filter(order => order.status !== 'DELIVERED').length > 0 ? (
          orders.filter(order => order.status !== 'DELIVERED').map((order) => {
            console.log("DashboardHome: Rendering active order:", order.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Paper elevation={3} sx={{ p: 2, bgcolor: '#fff5f5', borderTop: '5px solid #d32f2f', borderRadius: '10px', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">Order #{order.id}</Typography>
                    <Chip label={order.status} size="small" color="error" variant="filled" sx={{ fontWeight: 'bold' }} />
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                      {order.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Customer ID: {order.userId}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ minHeight: '80px' }}>
                    {order.items?.map((item, idx) => (
                      <Typography key={idx} variant="body2">• {item.quantity}x {item.name}</Typography>
                    ))}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Total: ₹{order.totalAmount}</Typography>
                    <Button 
                      size="small" variant="contained" color="success" 
                      disabled={actionLoading}
                      onClick={() => handleCompleteOrder(order)}
                    >
                      {actionLoading ? <CircularProgress size={20} /> : "Done"}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}>
              <Typography color="text.secondary">No active orders</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>Menu Items</Typography>

      <FormControl sx={{ mb: 2, minWidth: 200 }}>
        <InputLabel>Filter by Category</InputLabel>
        <Select
          value={selectedCategory}
          label="Filter by Category"
          onChange={(e) => {
            console.log("DashboardHome: Category filter changed to:", e.target.value);
            setSelectedCategory(e.target.value);
          }}
        >
          <MenuItem value="All">All Categories</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.name}>
              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={2}>
        {filteredItems.map((item) => {
          console.log("DashboardHome: Rendering menu item:", item.item_id);
          return (
            <Grid item xs={12} sm={6} md={3} key={item.item_id}>
              <Paper elevation={1} sx={{ height: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '4px solid #1a237e' }}>
                <Box sx={{ height: '140px', width: '100%', bgcolor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {item.menu_item_pic ? (
                    <img src={resolveImageUrl(item.menu_item_pic)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <MenuIcon sx={{ fontSize: 40, color: '#bdbdbd' }} />
                  )}
                </Box>
                <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</Typography>
                    <Typography color="primary" sx={{ fontWeight: 'bold' }}>₹{item.price}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.category_name ? item.category_name.charAt(0).toUpperCase() + item.category_name.slice(1) : 'No Category'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// --- MENU VIEW COMPONENT ---
export const MenuView = ({ userObj }) => {
  console.log("=== MenuView: Component Rendering ===");
  console.log("MenuView: userObj received:", userObj);
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", category_id: "", is_available: true });

  useEffect(() => {
    console.log("MenuView: useEffect - Fetching menu");
    const fetchMenu = async () => {
      if (!userObj?.restaurant?.id) { 
        console.log("MenuView: No restaurant ID, stopping fetch");
        setLoading(false); 
        return; 
      }
      
      console.log("MenuView: Fetching menu for restaurant ID:", userObj.restaurant.id);
      try {
        const res = await axios.get(`${API_BASE_URL}/menu/${userObj.restaurant.id}`);
        console.log("MenuView: Menu fetch response:", res.data);
        
        const menuData = res.data?.menu;
        let allItems = [];
        
        if (menuData && typeof menuData === 'object') {
          Object.entries(menuData).forEach(([categoryName, cat]) => {
            console.log(`MenuView: Processing category "${categoryName}":`, cat);
            if (cat.items) {
              cat.items.forEach(item => {
                const processedItem = {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  category_id: cat.category_id,
                  category_name: categoryName,
                  is_available: item.is_available,
                  menu_item_pic: item.menu_item_pic
                };
                console.log("MenuView: Processed item:", processedItem);
                allItems.push(processedItem);
              });
            }
          });
        }
        setItems(allItems);
        console.log("MenuView: Total items loaded:", allItems.length);
      } catch (err) {
        console.error("MenuView: Fetch error:", err);
        setItems([]);
      } finally {
        setLoading(false);
        console.log("MenuView: Fetch completed");
      }
    };
    fetchMenu();
  }, [userObj]);

  const handleRemove = async (itemId) => {
    console.log("MenuView: handleRemove called for item ID:", itemId);
    if (!window.confirm("Are you sure you want to remove this item?")) {
      console.log("MenuView: Remove cancelled by user");
      return;
    }

    console.log("MenuView: Deleting item ID:", itemId);
    try {
      const response = await axios.delete(`${API_BASE_URL}/menu/${itemId}`);
      console.log("MenuView: Delete response:", response.data);
      
      setItems(prev => prev.filter(item => item.id !== itemId));
      console.log("MenuView: Item removed from state successfully");
      alert("Item removed successfully!");
    } catch (err) {
      console.error("MenuView: Failed to remove item:", err);
      console.error("MenuView: Error details:", err.response?.data);
      alert("Failed to remove item.");
    }
  };

  const openEditModal = (item) => {
    console.log("MenuView: Opening edit modal for item:", item);
    setEditItem(item);
    setEditForm({
      name: item.name,
      price: item.price,
      category_id: item.category_id,
      is_available: item.is_available
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    console.log("MenuView: handleEditSubmit called");
    console.log("MenuView: Editing item:", editItem);
    console.log("MenuView: Edit form data:", editForm);
    
    if (!editItem) {
      console.log("MenuView: No edit item selected");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("item_name", editForm.name);
      formData.append("price", parseFloat(editForm.price));
      formData.append("is_available", editForm.is_available);

      if (editForm.menu_item_pic instanceof File) {
        console.log("MenuView: Appending new image file");
        formData.append("menu_item_pic", editForm.menu_item_pic);
      }

      console.log("MenuView: Submitting update for item ID:", editItem.id);
      const response = await axios.put(`${API_BASE_URL}/menu/${editItem.id}/update`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      console.log("MenuView: Update response:", response.data);

      setItems(prev => prev.map(it => it.id === editItem.id ? { ...it, ...editForm } : it));
      console.log("MenuView: Item updated in state successfully");
      alert("Item updated successfully!");
      setEditOpen(false);
      setEditItem(null);
    } catch (err) {
      console.error("MenuView: Update failed:", err);
      console.error("MenuView: Error details:", err.response?.data);
      alert("Failed to update item");
    }
  };

  if (loading) {
    console.log("MenuView: Rendering loading spinner");
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>Full Restaurant Menu</Typography>

      <Grid container spacing={3}>
        {items.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No menu items found.</Typography>
            </Paper>
          </Grid>
        )}

        {items.map((item) => {
          console.log("MenuView: Rendering item:", item.id);
          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ height: 140, bgcolor: '#e0e0e0' }}>
                  {item.menu_item_pic ? (
                    <img src={resolveImageUrl(item.menu_item_pic)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <MenuIcon sx={{ fontSize: 60, color: '#bdbdbd' }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{item.name}</Typography>
                    <Chip label={`₹${item.price}`} size="small" color="primary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.category_name ? item.category_name.charAt(0).toUpperCase() + item.category_name.slice(1) : 'No Category'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<EditIcon />} color="inherit" onClick={() => {
                      console.log("MenuView: Edit button clicked for item:", item.id);
                      openEditModal(item);
                    }}>Edit</Button>
                    <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={() => {
                      console.log("MenuView: Delete button clicked for item:", item.id);
                      handleRemove(item.id);
                    }}>Remove</Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={() => {
        console.log("MenuView: Closing edit modal");
        setEditOpen(false);
      }}>
        <DialogTitle>Edit Menu Item</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Item Name" value={editForm.name} onChange={(e) => {
            console.log("MenuView: Edit form - name changed to:", e.target.value);
            setEditForm({...editForm, name: e.target.value});
          }} fullWidth />
          <TextField label="Price (₹)" type="number" value={editForm.price} onChange={(e) => {
            console.log("MenuView: Edit form - price changed to:", e.target.value);
            setEditForm({...editForm, price: e.target.value});
          }} fullWidth />
          <FormControlLabel
            control={<Switch checked={editForm.is_available} onChange={(e) => {
              console.log("MenuView: Edit form - availability changed to:", e.target.checked);
              setEditForm({...editForm, is_available: e.target.checked});
            }} color="primary" />}
            label="Available for Customers"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            console.log("MenuView: Edit cancelled");
            setEditOpen(false);
          }}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleEditSubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// --- ADD ITEM FORM COMPONENT ---
export const AddItemForm = ({ userObj }) => {
  console.log("=== AddItemForm: Component Rendering ===");
  console.log("AddItemForm: userObj received:", userObj);
  
  const [selectedFileName, setSelectedFileName] = useState("");
  const [formData, setFormData] = useState({
    name: '', price: '', menu_item_pic: null, category_id: '', is_available: true
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AddItemForm: useEffect - Fetching categories");
    const fetchCategories = async () => {
      if (!userObj?.restaurant?.id) {
        console.log("AddItemForm: No restaurant ID, stopping fetch");
        setLoading(false);
        return;
      }

      console.log("AddItemForm: Fetching categories for restaurant ID:", userObj.restaurant.id);
      try {
        const response = await axios.get(`${API_BASE_URL}/category/${userObj.restaurant.id}/categories`);
        console.log("AddItemForm: Categories response:", response.data);
        
        const categoriesData = response.data.categories || [];
        setCategories(categoriesData);
        console.log("AddItemForm: Categories set:", categoriesData);
        
        if (categoriesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            category_id: categoriesData[0].id
          }));
          console.log("AddItemForm: Default category set to:", categoriesData[0].id);
        }
      } catch (err) {
        console.error("AddItemForm: Failed to fetch categories:", err);
      } finally {
        setLoading(false);
        console.log("AddItemForm: Categories fetch completed");
      }
    };

    fetchCategories();
  }, [userObj]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`AddItemForm: Form field changed - ${name}: ${value}`);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("AddItemForm: Form submission started");
    console.log("AddItemForm: Form data:", formData);
    
    if (!userObj?.restaurant?.id) {
      console.log("AddItemForm: Restaurant ID not found");
      alert("Restaurant ID not found");
      return;
    }

    if (!formData.category_id) {
      console.log("AddItemForm: No category selected");
      alert("Please select a category");
      return;
    }

    console.log("AddItemForm: Restaurant ID:", userObj.restaurant.id);
    console.log("AddItemForm: Selected category ID:", formData.category_id);

    try {
      const formDataObj = new FormData();
      formDataObj.append("item_name", formData.name);
      formDataObj.append("price", parseFloat(formData.price));
      formDataObj.append("category_id", parseInt(formData.category_id));
      formDataObj.append("is_available", formData.is_available);

      if (formData.menu_item_pic instanceof File) {
        console.log("AddItemForm: Appending image file:", formData.menu_item_pic.name);
        formDataObj.append("menu_item_pic", formData.menu_item_pic);
      }

      console.log("AddItemForm: Submitting to API...");
      const response = await axios.post(
        `${API_BASE_URL}/menu/${userObj.restaurant.id}/add`,
        formDataObj,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("AddItemForm: API response:", response.data);
      alert("Item added successfully!");
      
      setFormData({
        name: '',
        price: '',
        menu_item_pic: null,
        category_id: categories.length > 0 ? categories[0].id : '',
        is_available: true
      });
      setSelectedFileName("");
      console.log("AddItemForm: Form reset completed");

    } catch (err) {
      console.error("AddItemForm: Submission error:", err);
      console.error("AddItemForm: Error response:", err.response?.data);
      alert(err.response?.data?.message || "Failed to add item");
    }
  };

  if (loading) {
    console.log("AddItemForm: Rendering loading spinner");
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 3 }}>Add New Menu Item</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Item Name" name="name" value={formData.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                select 
                fullWidth 
                label="Category" 
                name="category_id" 
                value={formData.category_id} 
                onChange={handleChange} 
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 200 }
                    }
                  }
                }}
              >
                {categories.length === 0 ? (
                  <MenuItem disabled>No categories available</MenuItem>
                ) : (
                  categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth>
                Upload Item Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ ...formData, menu_item_pic: file });
                      setSelectedFileName(file.name);
                      console.log("AddItemForm: File selected:", file.name);
                    }
                  }}
                />
              </Button>
              {selectedFileName && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Selected file: {selectedFileName}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={formData.is_available} onChange={(e) => {
                  console.log("AddItemForm: Availability changed to:", e.target.checked);
                  setFormData({ ...formData, is_available: e.target.checked });
                }} color="primary" />}
                label="Available for Customers"
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth size="large" sx={{ bgcolor: '#1a237e', py: 1.5, fontWeight: 'bold' }}>Save Item to Menu</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

// --- ORDERS VIEW COMPONENT ---
const OrdersView = ({ userObj }) => {
  console.log("=== OrdersView: Component Rendering ===");
  console.log("OrdersView: userObj received:", userObj);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState('');

  const handleCompleteOrder = async (order) => {
    console.log("OrdersView: handleCompleteOrder called for order:", order);
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) {
      console.log("OrdersView: No next status available");
      return;
    }

    setActionLoading(true);
    console.log("OrdersView: Updating status to:", nextStatus);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/orders/${order.id}/status`,
        null,
        { params: { status: nextStatus } }
      );
      console.log("OrdersView: Status update response:", response.data);

      setOrders(prev =>
        prev.map(o =>
          o.id === order.id ? { ...o, status: nextStatus } : o
        )
      );
      console.log("OrdersView: Order status updated in state");
    } catch (err) {
      console.error("OrdersView: Failed to update status:", err);
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDelivery = async () => {
    console.log("OrdersView: handleAssignDelivery called");
    console.log("OrdersView: Selected order:", selectedOrder);
    console.log("OrdersView: Selected partner:", selectedPartner);
    
    if (!selectedPartner) {
      console.log("OrdersView: No partner selected");
      alert("Please select a delivery partner");
      return;
    }

    try {
      console.log("OrdersView: Assigning partner to order");
      const response = await axios.post(`${API_BASE_URL}/orders/${selectedOrder.id}/assign/${selectedPartner}`);
      console.log("OrdersView: Assignment response:", response.data);
      
      alert(`Delivery partner assigned successfully!`);
      setAssignDialogOpen(false);
      setSelectedOrder(null);
      setSelectedPartner('');
      
      // Refresh orders
      console.log("OrdersView: Refreshing orders after assignment");
      fetchOrders();
    } catch (err) {
      console.error("OrdersView: Failed to assign delivery partner:", err);
      console.error("OrdersView: Error details:", err.response?.data);
      alert(err.response?.data?.message || "Failed to assign delivery partner");
    }
  };

  const fetchOrders = async () => {
    console.log("OrdersView: fetchOrders called");
    if (!userObj?.restaurant?.id) {
      console.log("OrdersView: No restaurant ID found");
      setLoading(false);
      return;
    }

    console.log("OrdersView: Fetching orders for restaurant ID:", userObj.restaurant.id);
    try {
      const res = await axios.get(`${API_BASE_URL}/orders/restaurant/${userObj.restaurant.id}`);
      console.log("OrdersView: Orders response:", res.data);
      
      const ordersArray = res.data.orders || []; 
      const formattedOrders = ordersArray.map(o => {
        const formatted = {
          id: o.order_id,
          status: o.status,
          totalAmount: o.total_amount,
          userId: o.user?.id,
          userName: o.user?.name,
          items: o.items?.map(item => ({
            id: item.menu_id,
            name: item.menu_item_name,
            quantity: item.quantity,
            menu_item_pic: item.menu_item_pic
          })) || []
        };
        console.log("OrdersView: Formatted order:", formatted);
        return formatted;
      });
      
      setOrders(formattedOrders);
      console.log("OrdersView: Total orders set:", formattedOrders.length);
    } catch (err) {
      console.error("OrdersView: Fetch error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
      console.log("OrdersView: Orders fetch completed");
    }
  };

  useEffect(() => {
    console.log("OrdersView: useEffect - Initial data fetch");
    
    const fetchData = async () => {
      await fetchOrders();
      
      // Fetch delivery partners
      console.log("OrdersView: Fetching delivery partners");
      try {
        const partnersRes = await axios.get(`${API_BASE_URL}/delivery/`);
        console.log("OrdersView: Delivery partners response:", partnersRes.data);
        
        const partners = partnersRes.data.delivery_persons || [];
        setDeliveryPartners(partners);
        console.log("OrdersView: Delivery partners set:", partners.length);
      } catch (err) {
        console.error("OrdersView: Failed to fetch delivery partners:", err);
      }
    };

    fetchData();
  }, [userObj]);

  if (loading) {
    console.log("OrdersView: Rendering loading spinner");
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
  const pastOrders = orders.filter(o => o.status === 'DELIVERED');
  
  console.log("OrdersView: Active orders:", activeOrders.length);
  console.log("OrdersView: Past orders:", pastOrders.length);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>Order Management</Typography>

      <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f', fontWeight: 'bold' }}>Incoming & Active Orders</Typography>
      {activeOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4, bgcolor: '#fff5f5' }}>
          <Typography color="text.secondary">No incoming orders right now.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {activeOrders.map((order) => {
            console.log("OrdersView: Rendering active order:", order.id);
            return (
              <Grid item xs={12} key={order.id}>
                <Paper elevation={2} sx={{ p: 2, borderLeft: '6px solid #d32f2f' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Order #{order.id}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: '#1a237e', fontWeight: '500' }}>
                        Customer: {order.userName || "Guest"} (User ID: {order.userId})
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        {order.items?.map((item, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Avatar 
                              src={resolveImageUrl(item.menu_item_pic)}
                              variant="rounded" 
                              sx={{ width: 40, height: 40 }}
                            />
                            <Typography variant="body2">
                              {item.quantity}x <strong>{item.name}</strong>
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label={order.status} color="error" sx={{ mb: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>₹{order.totalAmount}</Typography>
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          disabled={actionLoading}
                          onClick={() => {
                            console.log("OrdersView: Complete button clicked for order:", order.id);
                            handleCompleteOrder(order);
                          }}
                        >
                          {actionLoading ? "Processing..." : "Mark Completed"}
                        </Button>
                        {order.status === 'PREPARING' && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            startIcon={<LocalShipping />}
                            onClick={() => {
                              console.log("OrdersView: Assign delivery clicked for order:", order.id);
                              setSelectedOrder(order);
                              setAssignDialogOpen(true);
                            }}
                          >
                            Assign Delivery
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>Past Orders (Completed)</Typography>
      {pastOrders.length === 0 ? (
        <Typography variant="body2" sx={{ ml: 2, color: 'gray' }}>No past orders found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {pastOrders.map((order) => {
            console.log("OrdersView: Rendering past order:", order.id);
            return (
              <Grid item xs={12} key={order.id}>
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#f9f9f9' }}>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Order #{order.id}</Typography>
                    <Typography variant="caption" color="text.secondary">Items: {order.items.length}</Typography>
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
                      Customer: {order.userName} (ID: {order.userId})
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontWeight="bold">₹{order.totalAmount}</Typography>
                    <Typography variant="caption" color="success.main">Finished</Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Assign Delivery Partner Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => {
        console.log("OrdersView: Closing assign dialog");
        setAssignDialogOpen(false);
      }}>
        <DialogTitle>Assign Delivery Partner</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Delivery Partner</InputLabel>
            <Select
              value={selectedPartner}
              label="Select Delivery Partner"
              onChange={(e) => {
                console.log("OrdersView: Partner selected:", e.target.value);
                setSelectedPartner(e.target.value);
              }}
            >
              {deliveryPartners.filter(p => p.is_available).map((partner) => (
                <MenuItem key={partner.id} value={partner.id}>
                  {partner.name} - {partner.vehicle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            console.log("OrdersView: Assign cancelled");
            setAssignDialogOpen(false);
          }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleAssignDelivery}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ProfileView = ({ userObj }) => {
  console.log("=== ProfileView: Component Rendering ===");
  console.log("ProfileView: userObj received:", userObj);
  
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [editData, setEditData] = useState({
    name: userObj?.restaurant?.name || userObj?.name || '',
    mobile: userObj?.restaurant?.mobile || userObj?.mobile || '',
    address: userObj?.restaurant?.address || '',
    newPassword: ''
  });
  
  useEffect(() => {
    console.log("ProfileView: useEffect - Fetching latest profile");
    const fetchLatestProfile = async () => {
      if (!userObj?.restaurant?.id) {
        console.log("ProfileView: No restaurant ID found");
        return;
      }

      console.log("ProfileView: Fetching profile for restaurant ID:", userObj.restaurant.id);
      try {
        const res = await axios.get(`${API_BASE_URL}/restaurants/${userObj.restaurant.id}`);
        console.log("ProfileView: Profile response:", res.data);
        
        const latestData = res.data.restaurant || res.data;

        setEditData({
          name: latestData.name || '',
          mobile: latestData.mobile || '', 
          address: latestData.address || '',
          newPassword: ''
        });
        console.log("ProfileView: Profile data updated in state");

        const updatedUser = {
          ...userObj,
          restaurant: {
            ...userObj.restaurant,
            ...latestData
          }
        };
        localStorage.setItem('userObj', JSON.stringify(updatedUser));
        console.log("ProfileView: localStorage updated");
      } catch (err) {
        console.error("ProfileView: Failed to sync profile:", err);
      }
    };

    fetchLatestProfile();
  }, [userObj]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("ProfileView: Image file selected:", file.name);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    console.log("ProfileView: handleUpdateProfile called");
    console.log("ProfileView: Update data:", editData);
    console.log("ProfileView: Selected file:", selectedFile);
    
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('mobile', editData.mobile);
      formData.append('address', editData.address);
      
      if (editData.newPassword) {
        console.log("ProfileView: Including new password in update");
        formData.append('password', editData.newPassword);
      }
      if (selectedFile) {
        console.log("ProfileView: Including new image in update");
        formData.append('restaurant_pic', selectedFile);
      }

      console.log("ProfileView: Submitting update to API");
      const response = await axios.put(
        `${API_BASE_URL}/restaurants/${userObj.restaurant.id}/update`, 
        formData, 
        { headers: { 'Content-Type': 'multipart/form-data' } } 
      );

      console.log("ProfileView: Update response:", response.data);
      alert("Profile updated successfully!");
      setIsEditing(false);
      setPreviewUrl(null);
      window.location.reload(); 
      
    } catch (err) {
      console.error("ProfileView: Update error:", err);
      console.error("ProfileView: Error details:", err.response?.data);
      alert(err.response?.data?.detail || "Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    console.log("ProfileView: handleDeleteAccount called");
    const confirmDelete = window.confirm("Are you sure? This will permanently delete your restaurant.");
    if (confirmDelete) {
      console.log("ProfileView: User confirmed deletion");
      try {
        await axios.delete(`${API_BASE_URL}/restaurants/${userObj.restaurant.id}`);
        console.log("ProfileView: Account deleted successfully");
        localStorage.clear();
        alert("Account deleted.");
        navigate('/login');
      } catch (err) {
        console.error("ProfileView: Delete error:", err);
        alert("Could not delete account.");
      }
    } else {
      console.log("ProfileView: Deletion cancelled");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>
        Owner Profile
      </Typography>
      
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar 
              src={previewUrl || (userObj?.restaurant?.restaurant_pic 
                ? `${API_BASE_URL}/${userObj.restaurant.restaurant_pic}` 
                : "")}
              sx={{ width: 120, height: 120, bgcolor: '#1a237e', fontSize: '3rem', border: '4px solid #fff', boxShadow: 2 }}
            >
              {!previewUrl && !userObj?.restaurant?.restaurant_pic && (userObj?.name?.charAt(0) || "U")}
            </Avatar>
            {isEditing && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <input accept="image/*" style={{ display: 'none' }} id="icon-button-file" type="file" onChange={handleFileChange} />
                <label htmlFor="icon-button-file">
                  <Button variant="contained" size="small" component="span" sx={{ fontSize: '10px', p: 0.5, bgcolor: '#1a237e' }}>
                    Upload New
                  </Button>
                </label>
              </Box>
            )} 
            <Box>
              <Typography variant="h5" fontWeight="bold">{editData.name || "Owner"}</Typography>
              <Typography color="text.secondary">{userObj?.email || userObj?.restaurant?.email || "Email not found"}</Typography>
              <Chip label="Verified Restaurant Partner" color="success" size="small" sx={{ mt: 1 }} />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">RESTAURANT NAME</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.name} onChange={(e) => {
                  console.log("ProfileView: Name changed to:", e.target.value);
                  setEditData({...editData, name: e.target.value});
                }} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.name}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">MOBILE NUMBER</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.mobile} onChange={(e) => {
                  console.log("ProfileView: Mobile changed to:", e.target.value);
                  setEditData({...editData, mobile: e.target.value});
                }} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.mobile || "Not Provided"}</Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="gray">RESTAURANT ADDRESS</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" multiline rows={2} value={editData.address} onChange={(e) => {
                  console.log("ProfileView: Address changed to:", e.target.value);
                  setEditData({...editData, address: e.target.value});
                }} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.address || "No Address on file"}</Typography>
              )}
            </Grid>

            {isEditing && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="primary">UPDATE PASSWORD</Typography>
                <TextField fullWidth type="password" size="small" placeholder="New Password" value={editData.newPassword} onChange={(e) => {
                  console.log("ProfileView: New password entered");
                  setEditData({...editData, newPassword: e.target.value});
                }} sx={{ mt: 1 }} />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <>
                <Button variant="contained" startIcon={<EditIcon />} sx={{ bgcolor: '#1a237e' }} onClick={() => {
                  console.log("ProfileView: Edit mode enabled");
                  setIsEditing(true);
                }}>
                  Edit Profile
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" color="success" onClick={handleUpdateProfile}>Save Changes</Button>
                <Button variant="text" color="inherit" onClick={() => {
                  console.log("ProfileView: Edit cancelled");
                  setIsEditing(false);
                  setPreviewUrl(null);
                }}>
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RestaurantDashboard