import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline,TextField,Chip, AppBar, Button ,Paper,Grid,Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon,CircularProgress, ListItemText, Divider, Container, Avatar
} from '@mui/material';
import {
  Dashboard as DashIcon,Edit, ShoppingCart, AccountCircle, History, ExitToApp
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const navigate = useNavigate();
  const [userObj] = useState(() => {
    const saved = localStorage.getItem('userObj');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.status === 'success' ? parsed : parsed; 
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (!userObj) {
      navigate('/login');
    }
  }, [userObj, navigate]);

  if (!userObj) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashIcon /> },
    { text: 'Add to Cart', icon: <ShoppingCart /> },
    { text: 'My Orders', icon: <History /> },
    { text: 'My Profile', icon: <AccountCircle /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <BrowseRestaurants />;
      case 'Add to Cart': return <CartView />;
      case 'My Orders': return <UserOrdersView userObj={userObj} />;
      case 'My Profile': return <UserProfileView userObj={userObj} />;
      default: return <BrowseRestaurants />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* HEADER */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#2e7d32' }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Foodie Portal
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#fff', color: '#2e7d32' }}>
              {userObj?.name?.charAt(0) || "U"}
            </Avatar>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {userObj?.name || "User"}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR */}
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
                  onClick={() => setActiveTab(item.text)}
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

      {/* MAIN BODY */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Toolbar />
        <Container maxWidth="lg">
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};
const BrowseRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/restaurants');

        const data = res.data.restaurants || res.data; 
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2e7d32' }}>
        Nearby Restaurants
      </Typography>

      {restaurants.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f1f8e9' }}>
          <Typography variant="h6" color="text.secondary">
            No restaurants are available right now.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please check back later!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {restaurants.map((rest) => (
            <Grid item xs={12} sm={6} md={4} key={rest.id}>
              <Paper 
                elevation={3} 
                sx={{ 
                  borderRadius: 3, 
                  overflow: 'hidden', 
                  transition: '0.3s', 
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/restaurant/${rest.id}`)}
              >
                {/* RESTAURANT IMAGE */}
                <Box sx={{ height: 160, bgcolor: '#e0e0e0' }}>
                  <img 
                    src={rest.restaurant_pic 
                      ? `http://127.0.0.1:8000/${rest.restaurant_pic}` 
                      : "https://via.placeholder.com/300x160?text=No+Image"} 
                    alt={rest.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>

                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {rest.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {rest.address || "No address provided"}
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', px: 1, borderRadius: 1, fontWeight: 'bold' }}>
                      FREE DELIVERY
                    </Typography>
                    <Button size="small" variant="contained" color="success" sx={{ borderRadius: 2 }}>
                      View Menu
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
const CartView = ({ setActiveTab }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('userCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('userCart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (cartItems.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        textAlign: 'center' 
      }}>
        <ShoppingCart sx={{ fontSize: 100, color: '#bdbdbd', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your cart is empty!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Looks like you haven't added any delicious food yet.
        </Typography>
        <Button 
          variant="contained" 
          color="success" 
          size="large"
          onClick={() => setActiveTab('Dashboard')} // Redirects user to browse
          sx={{ borderRadius: '25px', px: 4 }}
        >
          Order Now
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2e7d32' }}>
        Your Shopping Cart
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {cartItems.map((item) => (
            <Paper key={item.id} elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={item.imageUrl} 
                variant="rounded" 
                sx={{ width: 80, height: 80, mr: 2 }} 
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantity: {item.quantity}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="success.main">
                  ₹{item.price * item.quantity}
                </Typography>
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </Button>
              </Box>
            </Paper>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: '#f1f8e9' }}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal</Typography>
              <Typography>₹{calculateTotal()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Delivery Fee</Typography>
              <Typography color="success.main">FREE</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="success.main">₹{calculateTotal()}</Typography>
            </Box>
            <Button variant="contained" color="success" fullWidth size="large">
              Checkout
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
const UserOrdersView = ({ userObj, setActiveTab }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        // Replace with your actual user orders endpoint
        const res = await axios.get(`http://127.0.0.1:8000/orders/user/${userObj.id}`);
        
        // Extracting from { status: 'success', orders: [...] } to avoid .filter errors
        const ordersData = res.data.orders || res.data||[];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (err) {
        console.error("Error fetching user orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (userObj?.id) fetchUserOrders();
  }, [userObj]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="success" /></Box>;

  if (orders.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', minHeight: '60vh', textAlign: 'center' 
      }}>
        <History sx={{ fontSize: 100, color: '#bdbdbd', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No orders found!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You haven't placed any orders yet. Hungry?
        </Typography>
        <Button 
          variant="contained" 
          color="success" 
          onClick={() => setActiveTab('Dashboard')}
          sx={{ borderRadius: '25px', px: 4 }}
        >
          Start Ordering
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2e7d32' }}>
        My Order History
      </Typography>
      <Grid container spacing={2}>
        {orders.map((order) => (
          <Grid item xs={12} key={order.id}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, borderLeft: '6px solid #2e7d32' }}>
              <Grid container alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6">Order #{order.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3} sx={{ textAlign: { xs: 'left', sm: 'center' }, my: { xs: 1, sm: 0 } }}>
                  <Chip 
                    label={order.status} 
                    color={order.status === 'Completed' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </Grid>
                <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" color="success.main">₹{order.totalAmount}</Typography>
                  <Button size="small" variant="text" color="primary">View Details</Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
const UserProfileView = ({ userObj }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // State for user data (matches your restaurant profile logic)
  const [editData, setEditData] = useState({
    name: userObj?.name || '',
    mobile: userObj?.mobile || '',
    address: userObj?.address || '',
    newPassword: ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('mobile', editData.mobile); // Backend expects 'mobile'
      formData.append('address', editData.address);
      
      if (editData.newPassword) {
        formData.append('password', editData.newPassword);
      }
      if (selectedFile) {
        formData.append('user_pic', selectedFile);
      }

      const response = await axios.put(
        `http://127.0.0.1:8000/users/${userObj.user.id}/update`, 
        formData, 
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Permanent LocalStorage update
      const updatedUserObj = {
        ...userObj,
        ...editData,
        user_pic: response.data.user_pic || userObj.user_pic
      };
      
      localStorage.setItem('userObj', JSON.stringify(updatedUserObj));
      alert("Profile updated!");
      setIsEditing(false);
      window.location.reload(); 
      
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update profile.");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2e7d32' }}>
        My Profile
      </Typography>
      
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          
          {/* Header Section (Same as Restaurant Dashboard) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar 
              src={previewUrl || (userObj?.user_pic ? `http://127.0.0.1:8000/${userObj.user_pic}` : "")}
              sx={{ width: 120, height: 120, bgcolor: '#2e7d32', fontSize: '3rem', border: '4px solid #fff', boxShadow: 2 }}
            >
              {!previewUrl && !userObj?.user_pic && (userObj?.name?.charAt(0) || "U")}
            </Avatar>
            
            {isEditing && (
              <Box>
                <input accept="image/*" style={{ display: 'none' }} id="user-pic-file" type="file" onChange={handleFileChange} />
                <label htmlFor="user-pic-file">
                  <Button variant="contained" size="small" component="span" sx={{ bgcolor: '#2e7d32' }}>
                    Upload
                  </Button>
                </label>
              </Box>
            )}
            
            <Box>
              <Typography variant="h5" fontWeight="bold">{userObj?.name || "User Name"}</Typography>
              <Typography color="text.secondary">{userObj?.email}</Typography>
              <Chip label="Customer Account" color="success" size="small" sx={{ mt: 1 }} />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Form Fields (Consistent UI) */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">FULL NAME</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
              ) : (
                <Typography variant="body1" fontWeight="500">{userObj?.name}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">mobile NUMBER</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.mobile} onChange={(e) => setEditData({...editData, mobile: e.target.value})} />
              ) : (
                <Typography variant="body1" fontWeight="500">{userObj?.mobile || "Not Set"}</Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="gray">DELIVERY ADDRESS</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" multiline rows={2} value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} />
              ) : (
                <Typography variant="body1" fontWeight="500">{userObj?.address || "No address saved"}</Typography>
              )}
            </Grid>

            {isEditing && (
              <Grid item xs={12}>
                <Typography variant="caption" color="primary">CHANGE PASSWORD (OPTIONAL)</Typography>
                <TextField fullWidth type="password" size="small" value={editData.newPassword} onChange={(e) => setEditData({...editData, newPassword: e.target.value})} sx={{ mt: 1 }} />
              </Grid>
            )}
          </Grid>

          {/* Buttons */}
          <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <Button variant="contained" startIcon={<Edit />} sx={{ bgcolor: '#2e7d32' }} onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="contained" color="success" onClick={handleUpdateProfile}>Save Changes</Button>
                <Button variant="text" color="inherit" onClick={() => { setIsEditing(false); setPreviewUrl(null); }}>Cancel</Button>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
export default UserDashboard;