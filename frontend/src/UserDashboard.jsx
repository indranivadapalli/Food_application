import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline,Alert,TextField,Chip, AppBar,Dialog,DialogContent,DialogContentText,DialogActions,DialogTitle, Button ,Paper,Grid,Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon,CircularProgress, ListItemText, Divider, Container, Avatar
} from '@mui/material';
import {
  Dashboard as DashIcon,Edit as EditIcon,Delete as DeleteIcon, ShoppingCart, AccountCircle, History, ExitToApp
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
 const [cartItems, setCartItems] = useState(() => {
  const saved = localStorage.getItem('userCart');
  return saved ? JSON.parse(saved) : [];
});

const addToCart = (item) => {
  const updatedCart = [...cartItems];
  const existingItem = updatedCart.find((i) => i.id === item.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    updatedCart.push({ ...item, quantity: 1 });
  }

  setCartItems(updatedCart);
  localStorage.setItem('userCart', JSON.stringify(updatedCart));
  alert(`${item.name} added to cart!`);
};
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
const displayHeaderName = userObj?.user?.name || " user profile";
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
      case 'Dashboard': return (
        <BrowseRestaurants userObj={userObj}
          selectedRestaurant={selectedRestaurant} 
          setSelectedRestaurant={setSelectedRestaurant} 
          addToCart={addToCart}
        />
      );
      case 'Add to Cart': return (
      <CartView 
        setActiveTab={setActiveTab} 
        cartItems={cartItems} // Add this
        setCartItems={setCartItems} // Add this
      />
    );
      case 'My Orders': return <UserOrdersView userObj={userObj} />;
      case 'My Profile': return <ProfileView userObj={userObj} />;
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
            <AccountCircle />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {displayHeaderName}
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
const BrowseRestaurants = ({ userObj,selectedRestaurant, setSelectedRestaurant,addToCart }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
const [menuItems, setMenuItems] = useState([]);
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
React.useEffect(() => {
  if (!selectedRestaurant?.id) return;
  if (selectedRestaurant) {
    const fetchMenu = async () => {
      try {
        console.log("Fetching menu for:", selectedRestaurant.id);
        const res = await axios.get(`http://127.0.0.1:8000/menu/${selectedRestaurant.id}`);
     const rawMenuData = res.data.menu || res.data;
    
    console.log("Raw Menu Data:", rawMenuData);

    // 2. Extract items from the categories (starters, main course, etc.)
    // We convert the object values into an array and grab the 'items' from each
    const allItems = Object.values(rawMenuData).flatMap(category => {
      return Array.isArray(category.items) ? category.items : [];
    });

    console.log("Extracted Items:", allItems);
    setMenuItems(allItems);
      } catch (err) {
        console.error("Failed to load menu", err);
        setMenuItems([]);
      }
    };
    fetchMenu();
  }
}, [selectedRestaurant,userObj]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }
if (selectedRestaurant) {
  return (
    <Box>
      <Button onClick={() => setSelectedRestaurant(null)} sx={{ mb: 2, color: '#2e7d32' }}>
        ← Back to Nearby Restaurants
      </Button>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        {selectedRestaurant.name} Menu
      </Typography>
      <Grid container spacing={3}>
        {Array.isArray(menuItems) && menuItems.length > 0 ? (
        menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              {/* Display menu item data here */}
              <Box sx={{ height: 140, mb: 2, bgcolor: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
        <img 
          src={`http://127.0.0.1:8000/${item.menu_item_pic}`} 
          alt={item.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
      </Box>
              <Typography variant="h6">{item.name}</Typography>
              <Typography color="success.main" fontWeight="bold">₹{item.price}</Typography>
            <Button 
          variant="contained" 
          color="success" 
          size="small"
          disabled={!item.is_available}
          onClick={() => addToCart(item)}
        >
          {item.is_available ? "Add To Cart" : "Sold Out"}
        </Button>
            </Paper>
          </Grid>
        ))
      ) : (
    <Typography sx={{ p: 3 }}>No menu items available for this restaurant.</Typography>
  )}
      </Grid>
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
                 {rest.restaurant_pic ? (
    <img 
      src={`http://127.0.0.1:8000/${rest.restaurant_pic}`} 
      alt={rest.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      // If the backend image fails to load, hide it and show the bgcolor
      onError={(e) => { e.target.style.display = 'none'; }} 
    />
  ) : (
    <Typography variant="body2" color="text.secondary">No Image Available</Typography>
  )}
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
                <Button 
  variant="contained" 
  color="success" 
  onClick={(e) => {
    e.stopPropagation(); // Prevents the Paper's onClick from firing
    setSelectedRestaurant(rest); // 'rest' matches your .map((rest) => ...)
  }}
>
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
const CartView = ({ setActiveTab,cartItems, setCartItems, userObj}) => {

const [openCheckout, setOpenCheckout] = useState(false);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('userCart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
const handlePlaceOrder = async () => {
    setOrderPlacing(true);
    try {
      // Example API structure - adjust to your backend endpoint
      const orderData = {
        user_id: userObj.user.id,
        items: cartItems,
        total_amount: calculateTotal(),
        status: 'pending'
      };
      
      // await axios.post('http://127.0.0.1:8000/orders/place', orderData);
      
      // Clear cart after success
      setCartItems([]);
      localStorage.removeItem('userCart');
      setOpenCheckout(false);
      alert("Order placed successfully!");
      setActiveTab('My Orders'); // Redirect to orders page
    } catch (err) {
      console.error("Order failed", err);
      alert("Failed to place order.");
    } finally {
      setOrderPlacing(false);
    }
  };
  {/* Checkout Confirmation Dialog */}
<Dialog open={openCheckout} onClose={() => setOpenCheckout(false)}>
  <DialogTitle sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
    Confirm Your Order
  </DialogTitle>
  <DialogContent>
    <DialogContentText>
      You are about to place an order for **₹{calculateTotal()}**. 
      Please confirm your delivery details.
    </DialogContentText>
    <Box sx={{ mt: 2 }}>
       <Typography variant="subtitle2">Deliver to:</Typography>
       <Typography variant="body1" fontWeight="bold">{userObj?.user?.username}</Typography>
    </Box>
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button onClick={() => setOpenCheckout(false)} color="inherit">Cancel</Button>
    <Button 
      onClick={handlePlaceOrder} 
      variant="contained" 
      color="success" 
      disabled={orderPlacing}
    >
      {orderPlacing ? <CircularProgress size={24} /> : "Confirm Order"}
    </Button>
  </DialogActions>
</Dialog>
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
                src={`http://127.0.0.1:8000/${item.menu_item_pic}`} 
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
           <Button 
  variant="contained" 
  color="success" 
  fullWidth 
  size="large"
  onClick={() => setOpenCheckout(true)} // Opens the dialog
>
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
        const res = await axios.get(`http://127.0.0.1:8000/orders/user/${userObj.user.id}/orders`);
        
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
const ProfileView = ({ userObj }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  // Initialize state with whatever is currently in userObj
  const [editData, setEditData] = useState({
    name: userObj?.user?.name || userObj?.name || '',
    mobile: userObj?.user?.mobile || userObj?.mobile || '', // Using mobile as per API docs
    address: userObj?.user?.address || '',
    password: ''
  });

  // useEffect to fetch and sync profile data on component mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      console.log("ProfileView: Fetching latest profile data...");
      try {
        const res = await axios.get(`http://127.0.0.1:8000/users/`);
        console.log("ProfileView: Data received from server:", res.data);
        
        // Handle cases where data might be nested in res.data.user
       const targetId = userObj?.user?.id || userObj?.user?.user_id;
      const latestData = res.data.find(u => (u.id || u.user_id) === targetId);
        // Update local state for form fields
       if (latestData) {
        console.log("ProfileView: Found User Data:", latestData);
        setEditData({
          name: latestData.name || '',
          mobile: latestData.mobile || '', 
          address: latestData.address || '',
          password: ''
        });
      }
        // Update localStorage to keep Sidebar/Header in sync
        const updatedUser = {
          ...userObj,
          user: {
            ...userObj.user,
            username: latestData.username,
            ...latestData
          }
        };
        localStorage.setItem('userObj', JSON.stringify(updatedUser));
        console.log("ProfileView: Email preserved in sync:", updatedUser.email);
      } catch (err) {
        console.error("ProfileView: Failed to sync profile with server", err);
      }
    };

    if (userObj?.user?.id|| userObj?.user?.user_id) {
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
      
      if (editData.password) {
        formData.append('password', editData.password);
      }
      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      const response = await axios.put(
        `http://127.0.0.1:8000/users/update/${userObj.user.id}`, 
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
    const confirmDelete = window.confirm("Are you sure? This will permanently delete your user.");
    if (confirmDelete) {
      try {
        console.log("ProfileView: Deleting account ID:", userObj.user.id);
        await axios.delete(`http://127.0.0.1:8000/users/delete/${userObj.user.id}`);
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
      {userObj?.user?.name} Profile
      </Typography>
      
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar 
             src={previewUrl || (userObj?.user?.profile_picture 
  ? `http://127.0.0.1:8000/${userObj.user.profile_picture}` 
  : "")}
              sx={{ width: 120, height: 120, bgcolor: '#1a237e', fontSize: '3rem', border: '4px solid #fff', boxShadow: 2 }}
            >
              {!previewUrl && !userObj?.user?.profile_picture && (userObj?.name?.username?.user?.charAt(0) || "U")}
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
              <Typography variant="h5" fontWeight="bold">{editData.name || userObj?.user?.username || "User"}</Typography>
              <Typography color="text.secondary">{userObj?.email|| userObj?.user?.email || "Email not found"}</Typography>
              <Chip label="Verified user Partner" color="success" size="small" sx={{ mt: 1 }} />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">USER NAME</Typography>
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
              <Typography variant="caption" color="gray">USER ADDRESS</Typography>
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
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>Delete Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is permanent. All your data will be removed from our servers. 
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteAccount} variant="contained" color="error">Confirm Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
    
  );
};
export default UserDashboard;