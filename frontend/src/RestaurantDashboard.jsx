import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline,Avatar, FormControlLabel, TextField, Switch, Paper, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, Button, ListItemText, Divider, Container, Grid, Chip, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashIcon, AddBox, AccountCircle,ShoppingCart, Edit, Delete, ExitToApp, Menu as MenuIcon
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;

const RestaurantDashboard = () => {
  console.log("Rendering RestaurantDashboard component");
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [userName] = useState(localStorage.getItem('name') || localStorage.getItem('user') || "User");
  const navigate = useNavigate();
  const [userObj,setUserObj] = useState(() => {
    const saved = localStorage.getItem('userObj');
    if (!saved) return null;
    try {
    const parsed = JSON.parse(saved);
    if (parsed.status === 'error') return null; 
    return parsed;
    } catch (error) {
      console.error("Failed to parse userObj:", error);
      return {};
    }
  });
useEffect(() => {
  const storedUser = localStorage.getItem('userObj');
  if (!storedUser || !userObj) {
    navigate('/login');
    return;
  }

  // 2. Role-based protection
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
          <Typography variant="body1">
            Welcome, <b>{userName}</b>
          </Typography>
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

const DashboardHome = ({ userObj }) => {
  console.log("Rendering DashboardHome");
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
const [actionLoading, setActionLoading] = useState(false);
const handleCompleteOrder = async (orderId) => {
  setActionLoading(true);
    try {
      await axios.put(`http://127.0.0.1:8000/orders/${orderId}/status`, {
        status: 'Completed'
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o));
    } catch (err) {
      alert("Failed to update status");
    }
    finally {
      setActionLoading(false); // Enable button
    }
  };
  const categories = ["All", "Tiffins", "Starters", "Main Course", "SoftDrinks", "Desserts"];

  useEffect(() => {
    console.log('user object ', userObj);
    if (!userObj?.restaurant?.id) {
    console.error("DashboardHome: Missing restaurant ID in userObj");
    setLoading(false);
    return;
  }
    console.log("DashboardHome: useEffect fetching data");
    const fetchData = async () => {
      try {
        const [menuRes, ordersRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/menu/${userObj.restaurant.id}`),
          axios.get(`http://127.0.0.1:8000/orders/restaurant/${userObj.restaurant.id}`)
        ]);
        console.log("DashboardHome: Menu response received", menuRes.data);
        console.log("DashboardHome: Orders response received", ordersRes.data);
        setMenuItems(menuRes.data || []);
        setOrders(ordersRes.data || []);
      } catch (err) {
        console.error("DashboardHome: Fetch error", err);
      } finally {
        console.log("DashboardHome: Loading finished");
        setLoading(false);
      }
    };
    fetchData();
  }, [userObj]);

  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => {
        const match = item.category === selectedCategory;
        if(match) console.log(`Filtering item: ${item.name} matches ${selectedCategory}`);
        return match;
      });

  if (loading) {
    console.log("DashboardHome: Showing CircularProgress");
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  console.log('order ', orders);
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCart fontSize="large" /> Present Orders
      </Typography>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        { orders.length > 0 && orders.filter(order => order.status !== 'Completed').length > 0 ? (
          orders.filter(order => order.status !== 'Completed').map((order) => {
            console.log("Rendering active order:", order.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Paper elevation={3} sx={{ p: 2, bgcolor: '#fff5f5', borderTop: '5px solid #d32f2f', borderRadius: '10px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">Order #{order.id}</Typography>
                    <Chip label={order.status} size="small" color="error" variant="filled" sx={{ fontWeight: 'bold' }} />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ minHeight: '60px' }}>
                    {order.items.map((item) => (
                      <Typography key={item.id} variant="body2">• {item.quantity}x {item.name}</Typography>
                    ))}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Total: ₹{order.totalAmount}</Typography>
                    <Button 
    size="small" 
    variant="contained" 
    color="success" 
    onClick={() => handleCompleteOrder(order.id)} // ADD THIS
  >
    Done
  </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}>
              <Typography color="text.secondary">No active orders at the moment.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Menu Overview</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "contained" : "outlined"}
            onClick={() => {
              console.log("Category filter changed to:", cat);
              setSelectedCategory(cat);
            }}
            sx={{
              borderRadius: '20px', textTransform: 'none', px: 3,
              bgcolor: selectedCategory === cat ? '#1a237e' : 'transparent',
              color: selectedCategory === cat ? 'white' : '#1a237e',
              borderColor: '#1a237e', '&:hover': { bgcolor: '#1a237e', color: 'white' }
            }}
          >
            {cat}
          </Button>
        ))}
      </Box>
      <Grid container spacing={2}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid #1a237e' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                  <Typography color="primary" fontWeight="bold">₹{item.price}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">{item.category}</Typography>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography sx={{ py: 5, textAlign: 'center', color: 'gray' }}>No items found in {selectedCategory}</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

const MenuView = ({userObj}) => {
  console.log("Rendering MenuView");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    console.log("MenuView: useEffect fetching menu");
    console.log('user obj', userObj);
    const fetchMenu = async () => {
       if (!userObj?.restaurant?.id) {
    console.error("No restaurant ID found");
    setLoading(false);
    return;
  }
      try {
        const res = await axios.get(`http://127.0.0.1:8000/menu/${userObj.restaurant.id}`);
        console.log("MenuView: Menu data received", res.data);
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("MenuView: Fetch Error", err);
        setItems([]);
      } finally {
        console.log("MenuView: Loading finished");
        setLoading(false);
      }
    };
    fetchMenu();
  }, [userObj]);

  if (loading) {
    console.log("MenuView: Showing CircularProgress");
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }
  console.log('items ', items);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>Full Restaurant Menu</Typography>
      {items?.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#fffde7' }}>
          <MenuIcon sx={{ fontSize: 60, color: '#fbc02d', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>Your menu is currently empty!</Typography>
          <Typography variant="body1" color="text.secondary">Go to <b>"Add New Item"</b> to build your menu.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => {
            console.log("Rendering menu item:", item.name);
            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Paper elevation={2} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{ height: 140, bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MenuIcon sx={{ fontSize: 40, color: '#bdbdbd' }} />}
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{item.name}</Typography>
                      <Chip label={`₹${item.price}`} size="small" color="primary" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Category: <b>{item.category}</b></Typography>
                    <Divider />
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<Edit />} color="inherit" onClick={() => console.log("Edit clicked for:", item.id)}>Edit</Button>
                      <Button size="small" startIcon={<Delete />} color="error" onClick={() => console.log("Remove clicked for:", item.id)}>Remove</Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

const AddItemForm = ({ userObj }) => {
  console.log("Rendering AddItemForm");
  const [formData, setFormData] = useState({
    name: '', price: '', imageUrl: '', category: '', isAvailable: true
  });

  const categories = ["Tiffins", "Starters", "Main Course", "SoftDrinks", "Desserts"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Form input change - ${name}: ${value}`);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission initiated with data:", formData);
    if (!userObj?.restaurant?.id) {
    alert("Error: Restaurant ID not found. Please log in again.");
    return;
  }
    try {
      // ID removed from string per request
      const response = await axios.post(`http://127.0.0.1:8000/menu/${userObj.restaurant.id}/add`, {
        ...formData,
        price: Number(formData.price)
      });
      console.log("Form submission success:", response.data);
      alert("Item added successfully!");
      setFormData({ name: '', price: '', imageUrl: '', category: '', isAvailable: true });
    } catch (err) {
      console.error("Form submission error:", err);
      alert(err.response?.data?.detail ||"Failed to add item.");
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 3 }}>Add New Menu Item</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Item Name" name="name" value={formData.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Category" name="category" value={formData.category} onChange={handleChange} SelectProps={{ native: true }} required>
                <option value=""></option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Image URL" name="imageUrl" placeholder="https://example.com/food.jpg" value={formData.imageUrl} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={formData.isAvailable} onChange={(e) => {
                  console.log("Availability switch toggled:", e.target.checked);
                  setFormData({ ...formData, isAvailable: e.target.checked });
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
const OrdersView = ({ userObj }) => {
  console.log("Rendering OrdersView");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
const handleCompleteOrder = async (orderId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/orders/${orderId}/status`, {
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
        const res = await axios.get(`http://127.0.0.1:8000/orders/restaurant/${userObj?.restaurant?.id}`);
        console.log("OrdersView: Data received", res.data);
        setOrders(res.data || []);
      } catch (err) {
        console.error("OrdersView: Fetch Error", err);
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
                  {order.items.map((item, i) => (
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
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // DYNAMIC DELETE LOGIC
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure? This will permanently delete your restaurant and all menu items.");
    if (confirmDelete) {
      try {
        await axios.delete(`http://127.0.0.1:8000/users/${userObj?.restaurant?.id}`);
        alert("Account deleted.");
        localStorage.clear();
        navigate('/login');
      } catch (err) {
        alert("Error deleting account. Please try again.");
      }
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match!");
      return;
    }
    try {
      await axios.put(`http://127.0.0.1:8000/users/${userObj?.restaurant?.id}/change-password`, {
        old_password: passwords.current,
        new_password: passwords.new
      });
      alert("Password updated!");
      setShowPasswordFields(false);
    } catch (err) {
      alert("Failed to update password.");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>
        Owner Profile
      </Typography>
      
      <Grid container spacing={4}>
        {/* LEFT SIDE: USER INFO (DYNAMIC) */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
              {/* IMAGE IS NOW NON-EDITABLE DISPLAY ONLY */}
              <Avatar 
                src={userObj?.restaurant?.imageUrl || ""} 
                sx={{ width: 120, height: 120, bgcolor: '#1a237e', fontSize: '3rem', border: '4px solid #fff', boxShadow: 2 }}
              >
                {userObj?.name?.charAt(0) || "U"}
              </Avatar>
              
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {userObj?.name || "Unauthorized User"}
                </Typography>
                <Typography color="text.secondary">
                  {userObj?.email || "No Email Provided"}
                </Typography>
                <Chip label="Verified Restaurant Partner" color="success" size="small" sx={{ mt: 1 }} />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="gray" sx={{ textTransform: 'uppercase' }}>Restaurant Name</Typography>
                <Typography variant="body1" fontWeight="500">{userObj?.restaurant?.name || "Not Set"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="gray" sx={{ textTransform: 'uppercase' }}>Phone Number</Typography>
                <Typography variant="body1" fontWeight="500">{userObj?.phone || "Not Provided"}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="gray" sx={{ textTransform: 'uppercase' }}>Restaurant Address</Typography>
                <Typography variant="body1" fontWeight="500">{userObj?.restaurant?.address || "No Address on file"}</Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
              {/* EDIT BUTTON (Can lead to a specialized edit page) */}
              <Button 
                variant="contained" 
                startIcon={<Edit />} 
                sx={{ bgcolor: '#1a237e' }}
                onClick={() => alert("Redirecting to Edit Profile Form...")}
              >
                Edit Profile
              </Button>
              
              {/* DYNAMIC DELETE BUTTON */}
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<Delete />}
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT SIDE: SECURITY */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Security Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your data is encrypted. You can update your credentials below.
            </Typography>

            {!showPasswordFields ? (
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => setShowPasswordFields(true)}
              >
                Change Account Password
              </Button>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  type="password" 
                  label="Current Password" 
                  fullWidth 
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                />
                <TextField 
                  type="password" 
                  label="New Password" 
                  fullWidth 
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                />
                <TextField 
                  type="password" 
                  label="Confirm New Password" 
                  fullWidth 
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button variant="contained" color="success" fullWidth onClick={handlePasswordChange}>Update</Button>
                  <Button variant="text" color="inherit" fullWidth onClick={() => setShowPasswordFields(false)}>Cancel</Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default RestaurantDashboard;