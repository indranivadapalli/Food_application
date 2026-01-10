import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline,Avatar, FormControlLabel, TextField, Switch, Paper, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, Button, ListItemText,MenuItem, Divider, Container, Grid, Chip, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashIcon,Edit as EditIcon,Delete as DeleteIcon, AddBox, AccountCircle,ShoppingCart, ExitToApp, Menu as MenuIcon
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;

const RestaurantDashboard = () => {
  console.log("Rendering RestaurantDashboard component");
  const [activeTab, setActiveTab] = useState('Dashboard');
  const navigate = useNavigate();
  
  const [userObj,setUserObj] = useState(() => {
    const saved = localStorage.getItem('userObj');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.status === 'success' ? parsed : null;
    } catch (error) {
      console.error("Failed to parse userObj:", error);
      return null;
    }
  });
const displayHeaderName = userObj?.restaurant?.name || userObj?.name || "Restaurant Owner";
useEffect(() => {
    if (!userObj) {
      navigate('/login');
      return;
    }
    if (userObj.role !== 'restaurant') {
      alert("Access Denied");
      navigate('/');
    }
  }, [userObj, navigate]);

  if (!userObj) return null;
  const handleLogout = () => {
    console.log("Logout initiated");
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
    console.log("Switching content to:", activeTab);
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardHome userObj={userObj} />;
      case 'Menu':
        return <MenuView userObj={userObj} />;
      case 'Add New Item':
        return <AddItemForm userObj={userObj} />;
      case 'Orders':
        return <OrdersView userObj={userObj} />;
      case 'Profile': return <ProfileView userObj={userObj} />;
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
                    console.log("Tab clicked:", item.text);
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
// --- SHARED CONSTANTS ---
const API_BASE_URL = "http://127.0.0.1:8000";
const CATEGORY_MAP = {
  "tiffins": 2, // Adjust these IDs to match your specific database logs
  "starters": 1,
  "main course": 3,
  "soft drinks": 4,
  "deserts": 5
};

// --- DASHBOARD HOME COMPONENT ---
export const DashboardHome = ({ userObj }) => {
  const [menuItems, setMenuItems] = useState([]); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [actionLoading, setActionLoading] = useState(false);

  const categories = ["All","starters","tiffins",  "main course", "soft drinks", "deserts"];

  const getImageUrl = (path) => path ? `${API_BASE_URL}/${path}` : null;

  const handleCompleteOrder = async (orderId) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/orders/${userObj.restaurant.id}/status`, {
        status: 'Completed'
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o));
      alert("Order marked as completed!");
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!userObj?.restaurant?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [menuRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/menu/${userObj.restaurant.id}`),
          axios.get(`${API_BASE_URL}/orders/restaurant/${userObj.restaurant.id}`)
        ]);

        const menuData = menuRes.data.menu;
        let allItems = [];
        
        if (menuData && typeof menuData === 'object' && !Array.isArray(menuData)) {
          Object.values(menuData).forEach(category => {
            if (category.items && Array.isArray(category.items)) {
              allItems = [...allItems, ...category.items];
            }
          });
        } else {
          allItems = Array.isArray(menuRes.data) ? menuRes.data : [];
        }

        setMenuItems(allItems);
        setOrders(ordersRes.data.orders || []);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userObj]);

  const filteredItems = selectedCategory === "All" 
  ? menuItems 
  : menuItems.filter(item => {
      // Ensure the category name from your state exactly matches the CATEGORY_MAP key
      const targetId = CATEGORY_MAP[selectedCategory.toLowerCase()];
      return Number(item.category_id) === targetId;
    });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCart fontSize="large" /> Present Orders
      </Typography>

      <Grid container spacing={2} sx={{ mb: 6 }}>
        {orders.length > 0 && orders.filter(order => order.status !== 'Completed').length > 0 ? (
          orders.filter(order => order.status !== 'Completed').map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#fff5f5', borderTop: '5px solid #d32f2f', borderRadius: '10px', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Order #{order.id}</Typography>
                  <Chip label={order.status} size="small" color="error" variant="filled" sx={{ fontWeight: 'bold' }} />
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
                    onClick={() => handleCompleteOrder(order.id)}
                  >
                    {actionLoading ? <CircularProgress size={20} /> : "Done"}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}><Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}><Typography color="text.secondary">No active orders</Typography></Paper></Grid>
        )}
      </Grid>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Menu Overview</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "contained" : "outlined"}
            onClick={() => setSelectedCategory(cat)}
            sx={{ borderRadius: '20px', textTransform: 'capitalize', px: 3 }}
          >
            {cat}
          </Button>
        ))}
      </Box>

      <Grid container spacing={2}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.item_id || item.id}>
            <Paper elevation={1} sx={{ height: '240px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '4px solid #1a237e' }}>
              <Box sx={{ height: '140px', width: '100%', bgcolor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {item.menu_item_pic ? (
                  <img src={getImageUrl(item.menu_item_pic)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <MenuIcon sx={{ fontSize: 40, color: '#bdbdbd' }} />
                )}
              </Box>
              <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</Typography>
                  <Typography color="primary" sx={{ fontWeight: 'bold' }}>₹{item.price}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">Category ID: {item.category_id}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// --- MENU VIEW COMPONENT ---
export const MenuView = ({ userObj }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      
      if (!userObj?.restaurant?.id) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API_BASE_URL}/menu/${userObj.restaurant.id}`);
        const menuData = res.data?.menu;
        console.log("Items fetched :", res);
        let allItems = [];
        if (menuData && typeof menuData === 'object') {
          Object.values(menuData).forEach(cat => {
            if (cat.items) allItems = [...allItems, ...cat.items];
          });
        }
        setItems(allItems);
      } catch (err) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [userObj]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>Full Restaurant Menu</Typography>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.item_id}>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ height: 140, bgcolor: '#e0e0e0' }}>
                {item.menu_item_pic && <img src={`${API_BASE_URL}/${item.menu_item_pic}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </Box>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{item.name}</Typography>
                  <Chip label={`₹${item.price}`} size="small" color="primary" />
                </Box>
                <Typography variant="body2" color="text.secondary">Category ID: {item.category_id}</Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<EditIcon />} color="inherit">Edit</Button>
                  <Button size="small" startIcon={<DeleteIcon />} color="error">Remove</Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// --- ADD ITEM FORM COMPONENT ---
export const AddItemForm = ({ userObj }) => {
  const [selectedFileName, setSelectedFileName] = useState("");

  const [formData, setFormData] = useState({
    name: '', price: '', menu_item_pic: '', category_id: '', is_available: true
  });

  const categories = ["tiffins", "starters", "main course", "soft drinks", "deserts"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!userObj?.restaurant?.id) {
    alert("Restaurant ID not found");
    return;
  }

  const categoryId = CATEGORY_MAP[formData.category_id?.toLowerCase()];
  if (!categoryId) {
    alert("Invalid category selected");
    return;
  }

  try {
    const formDataObj = new FormData();
    formDataObj.append("item_name", formData.name); // 🔥 FIXED
    formDataObj.append("price", parseFloat(formData.price));
    formDataObj.append("category_id", categoryId);
    formDataObj.append("is_available", formData.is_available);

    if (formData.menu_item_pic instanceof File) {
      formDataObj.append("menu_item_pic", formData.menu_item_pic);
    }

    await axios.post(
      `${API_BASE_URL}/menu/${userObj.restaurant.id}/add`,
      formDataObj,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    alert("Item added successfully!");
    setFormData({
      name: '',
      price: '',
      menu_item_pic: '',
      category_id: '',
      is_available: true
    });

  } catch (err) {
    console.error("Submission error:", err.response?.data);
    alert(JSON.stringify(err.response?.data?.detail));
  }
};


  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 3 }}>Add New Menu Item</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Item Name" name="name" value={formData.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Category" name="category_id" value={formData.category_id} onChange={handleChange} required>
                {categories?.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} required />
            </Grid>
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
    setSelectedFileName(file.name); // 👈 store file name
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

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} color="primary" />}
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
const OrdersView = ({ userObj }) => {
  console.log("Rendering OrdersView");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
const handleCompleteOrder = async (orderId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/orders/${userObj.restaurant.id}/status`, {
        status: 'Completed'
      });
      // Refresh local state to move order to "Past Orders"
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o));
      alert("Order marked as completed!");
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };
  useEffect(() => {
    console.log("OrdersView: useEffect fetching all orders");
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/orders/restaurant/${userObj.restaurant.id}`);
      const ordersArray = res.data.orders || []; 
    setOrders(ordersArray);
      } catch (err) {
        console.error("OrdersView: Fetch Error", err);
      setOrders([]);
      } finally {
        console.log("OrdersView: Loading finished");
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userObj]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  // Filter orders into categories
  const activeOrders = orders.filter(o => o.status !== 'Completed');
  const pastOrders = orders.filter(o => o.status === 'Completed');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>Order Management</Typography>

      {/* --- INCOMING / PRESENT ORDERS --- */}
      <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f', fontWeight: 'bold' }}>Incoming & Active Orders</Typography>
      {activeOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4, bgcolor: '#fff5f5' }}>
          <Typography color="text.secondary">No incoming orders right now.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {activeOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Paper elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '6px solid #d32f2f' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">Order #{order.id}</Typography>
                  {order.items?.map((item, i) => (
                    <Typography key={i} variant="body2">{item.quantity}x {item.name}</Typography>
                  ))}
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={order.status} color="error" sx={{ mb: 1 }} />
                  <Typography variant="h6">₹{order.totalAmount}</Typography>
                  <Button 
    size="small" 
    variant="contained" 
    color="success" 
    sx={{ mt: 1 }}
    disabled={actionLoading}
    onClick={() => handleCompleteOrder(order.id)} // ADD THIS
  >
   {actionLoading ? "Processing..." : "Mark Completed"}
  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* --- PAST ORDERS --- */}
      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>Past Orders (Completed)</Typography>
      {pastOrders.length === 0 ? (
        <Typography variant="body2" sx={{ ml: 2, color: 'gray' }}>No past orders found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {pastOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#f9f9f9' }}>
                <Box>
                  <Typography variant="body1" fontWeight="bold">Order #{order.id}</Typography>
                  <Typography variant="caption" color="text.secondary">Items: {order.items.length}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" fontWeight="bold">₹{order.totalAmount}</Typography>
                  <Typography variant="caption" color="success.main">Finished</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

const ProfileView = ({ userObj }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Initialize state with whatever is currently in userObj
  const [editData, setEditData] = useState({
    name: userObj?.restaurant?.name || userObj?.name || '',
    mobile: userObj?.restaurant?.mobile || userObj?.mobile || '', // Using mobile as per API docs
    address: userObj?.restaurant?.address || '',
    newPassword: ''
  });

  // useEffect to fetch and sync profile data on component mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      console.log("ProfileView: Fetching latest profile data...");
      try {
        const res = await axios.get(`http://127.0.0.1:8000/restaurants/${userObj.restaurant.id}`);
        console.log("ProfileView: Data received from server:", res.data);
        
        // Handle cases where data might be nested in res.data.restaurant
        const latestData = res.data.restaurant || res.data;

        // Update local state for form fields
        setEditData({
          name: latestData.name || '',
          mobile: latestData.mobile || '', 
          address: latestData.address || '',
          newPassword: ''
        });

        // Update localStorage to keep Sidebar/Header in sync
        const updatedUser = {
          ...userObj,
          restaurant: {
            ...userObj.restaurant,
            ...latestData
          }
        };
        localStorage.setItem('userObj', JSON.stringify(updatedUser));
        console.log("ProfileView: Email preserved in sync:", updatedUser.email);
      } catch (err) {
        console.error("ProfileView: Failed to sync profile with server", err);
      }
    };

    if (userObj?.restaurant?.id) {
      fetchLatestProfile();
    }
  }, [userObj]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("ProfileView: Image selected:", file.name);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    console.log("ProfileView: Initiating profile update...");
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('mobile', editData.mobile); // Sending as 'mobile' for backend
      formData.append('address', editData.address);
      
      if (editData.newPassword) {
        formData.append('password', editData.newPassword);
      }
      if (selectedFile) {
        formData.append('restaurant_pic', selectedFile);
      }

      const response = await axios.put(
        `http://127.0.0.1:8000/restaurants/${userObj.restaurant.id}/update`, 
        formData, 
        { headers: { 'Content-Type': 'multipart/form-data' } } 
      );

      console.log("ProfileView: Update response:", response.data);

      alert("Profile updated successfully!");
      setIsEditing(false);
      setPreviewUrl(null);
      window.location.reload(); 
      
    } catch (err) {
      console.error("ProfileView: Update error:", err.response);
      alert(err.response?.data?.detail || "Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure? This will permanently delete your restaurant.");
    if (confirmDelete) {
      try {
        console.log("ProfileView: Deleting account ID:", userObj.restaurant.id);
        await axios.delete(`http://127.0.0.1:8000/restaurants/${userObj.restaurant.id}`);
        localStorage.clear();
        alert("Account deleted.");
        navigate('/login');
      } catch (err) {
        console.error("ProfileView: Delete error:", err);
        alert("Could not delete account.");
      }
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
  ? `http://127.0.0.1:8000/${userObj.restaurant.restaurant_pic}` 
  : "")}
              sx={{ width: 120, height: 120, bgcolor: '#1a237e', fontSize: '3rem', border: '4px solid #fff', boxShadow: 2 }}
            >
              {!previewUrl && !userObj?.restaurant?.restaurant_pic && (userObj?.name?.charAt(0) || "U")}
            </Avatar>
            {isEditing && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <input accept="menu_item_pic/*" style={{ display: 'none' }} id="icon-button-file" type="file" onChange={handleFileChange} />
                <label htmlFor="icon-button-file">
                  <Button variant="contained" size="small" component="span" sx={{ fontSize: '10px', p: 0.5, bgcolor: '#1a237e' }}>
                    Upload New
                  </Button>
                </label>
              </Box>
            )} 
            <Box>
              <Typography variant="h5" fontWeight="bold">{editData.name || "Owner"}</Typography>
              <Typography color="text.secondary">{userObj?.email|| userObj?.restaurant?.email || "Email not found"}</Typography>
              <Chip label="Verified Restaurant Partner" color="success" size="small" sx={{ mt: 1 }} />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">RESTAURANT NAME</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.name}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">MOBILE NUMBER</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.mobile} onChange={(e) => setEditData({...editData, mobile: e.target.value})} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.mobile || "Not Provided"}</Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="gray">RESTAURANT ADDRESS</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" multiline rows={2} value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.address || "No Address on file"}</Typography>
              )}
            </Grid>

            {isEditing && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="primary">UPDATE PASSWORD</Typography>
                <TextField fullWidth type="password" size="small" placeholder="New Password" value={editData.newPassword} onChange={(e) => setEditData({...editData, newPassword: e.target.value})} sx={{ mt: 1 }} />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <>
                <Button variant="contained" startIcon={<EditIcon />} sx={{ bgcolor: '#1a237e' }} onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" color="success" onClick={handleUpdateProfile}>Save Changes</Button>
                <Button variant="text" color="inherit" onClick={() => { setIsEditing(false); setPreviewUrl(null); }}>
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
export default RestaurantDashboard;