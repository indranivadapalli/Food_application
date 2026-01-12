import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline,Skeleton,Snackbar,Alert,TextField,Chip, AppBar,Badge,Dialog,DialogContent,DialogContentText,DialogActions,DialogTitle, Button ,Paper,Grid,Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon,CircularProgress, ListItemText, Divider, Container, Avatar
} from '@mui/material';
import {
  Dashboard as DashIcon,Edit as EditIcon,Delete as DeleteIcon,Search as SearchIcon, AccountCircle, History, ExitToApp
} from '@mui/icons-material';

import axios from 'axios';
const drawerWidth = 240;

const UserDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [refreshOrders, setRefreshOrders] = useState(0);
   const userObj = JSON.parse(localStorage.getItem("userObj"));
   console.log(" User object from localStorage:", userObj);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
const showNotify = (msg, sev = 'success') => {
  setNotification({ open: true, message: msg, severity: sev });
};
  


const displayHeaderName = userObj?.user?.name || " user profile";
  useEffect(() => {
    if (!userObj) {
       console.log("No user found → redirecting to /login");
      navigate('/login');
    }
  }, [userObj, navigate]);

  if (!userObj) return null;

  const handleLogout = () => {
     console.log("Logging out user:", userObj);
   localStorage.removeItem('userObj');
console.log(" User logged out, backend data preserved");
navigate('/login');
  };

  const menuList = [
    { text: 'Dashboard', icon: <DashIcon /> },
    { text: 'My Orders', icon: <History /> },
    { text: 'My Profile', icon: <AccountCircle /> },
  ];

  const renderContent = () => {
    console.log(" Active Tab:", activeTab);
    switch (activeTab) {
      case 'Dashboard': return (
        <BrowseRestaurants userObj={userObj}
          selectedRestaurant={selectedRestaurant} 
          setSelectedRestaurant={setSelectedRestaurant} 
        showNotify={showNotify}
  setActiveTab={setActiveTab}
   setRefreshOrders={setRefreshOrders}
    orders={orders}
   setOrders={setOrders}
          />
);
      case 'My Orders': 
  return (
   <UserOrdersView 
  userObj={userObj}
  showNotify={showNotify}
  setActiveTab={setActiveTab}
   refreshOrders={refreshOrders}
   orders={orders}
   setOrders={setOrders}
/>

  );
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
            {menuList?.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  selected={activeTab === item.text}
                  onClick={() =>
                    { setActiveTab(item.text);
                       if(item.text === "My Orders"){
       setRefreshOrders(prev => prev + 1); // force refresh
    }}
                    
                  }
                >
              <ListItemIcon sx={{ color: activeTab === item.text ? '#2e7d32' : 'inherit' }}>
  {item.icon}
</ListItemIcon>

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
      <Snackbar 
  open={notification.open} 
  autoHideDuration={3000} 
  onClose={() => setNotification({ ...notification, open: false })}
>
  <Alert severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
    {notification.message}
  </Alert>
</Snackbar>

    </Box>
  );
};
const BrowseRestaurants = ({ userObj,selectedRestaurant, setSelectedRestaurant,showNotify,setActiveTab,setRefreshOrders,setOrders}) => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
const [quantity, setQuantity] = useState(1);
const [openOrderDialog, setOpenOrderDialog] = useState(false);
const handleopenOrderDialog = (item) => {
  console.log("Order dialog opened for item:", item);
  setSelectedItem(item);
  setQuantity(1);
  setOpenOrderDialog(true);
};
const [menuList, setMenuList] = useState([]);
  useEffect(() => {
     console.log(" Fetching restaurants...");
    const fetchRestaurants = async () => {
      try {
        
        const res = await axios.get('http://127.0.0.1:8000/restaurants');
console.log(" Restaurants API response:", res.data);
        const data = res.data.restaurants || res.data; 
        setRestaurants(Array?.isArray(data) ? data : []);
      } catch (err) {

        console.error("Failed to fetch restaurants", err);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);
  const handlePlaceOrder = async () => {
  try {
    const formData = new FormData();

    formData.append("user_id", userObj.user.id);
    formData.append("restaurant_id", selectedRestaurant.id);

    // 🔥 items MUST be STRING
    formData.append(
  "items",
  JSON.stringify([
    {
      menu_id: selectedItem.id,   // ✅ REQUIRED BY BACKEND
      quantity: quantity
    }
  ])
);

    // attachment optional – skip for now
    for (let pair of formData.entries()) {
  console.log(pair[0], pair[1]);
}

 const res= await axios.post(
      "http://127.0.0.1:8000/orders/create",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    setOpenOrderDialog(false);
    showNotify("Order placed successfully 🎉", "success");
  const newOrderId = res.data.id || Math.floor(Math.random() * 1000000); // use backend returned id if available
    setOrders(prev => [
      ...prev,
      {
        id: newOrderId,
        items: [
          {
            food_id: selectedItem.id,
            name: selectedItem.name,
            price: selectedItem.price,
            quantity
          }
        ],
        status: "Pending",
        created_at: new Date().toISOString()
      }
    ]);
    setActiveTab("My Orders");
    setRefreshOrders(prev => prev + 1);
  

  } catch (err) {
    console.error("Order placement failed:", err.response?.data || err);
    showNotify("Order failed", "error");
    setOpenOrderDialog(false);
  }
};

useEffect(() => {
  if (!selectedRestaurant?.id) return;
  console.log(" Fetching menu for restaurant:", selectedRestaurant.id);
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
      return Array?.isArray(category.items) ? category.items : [];
    });

    console.log("Extracted Items:", allItems);
    setMenuList(allItems);
      } catch (err) {
        console.error("Failed to load menu", err);
        setMenuList([]);
      }
    };
    fetchMenu();
  }
}, [selectedRestaurant]);

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
        {Array?.isArray(menuList) && menuList.length > 0 ? (
        menuList.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              {/* Display menu item data here */}
              <Box sx={{ height: 140, mb: 2, bgcolor: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
        {item.menu_item_pic && (
  <img
    src={`http://127.0.0.1:8000/${item.menu_item_pic}`}
    alt={item.name}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    onError={(e) => (e.target.style.display = 'none')}
  />
)}
      </Box>
              <Typography variant="h6">{item.name}</Typography>
              <Typography color="success.main" fontWeight="bold">₹{item.price}</Typography>
           <Button
  variant="contained"
  color="success"
  size="small"
  onClick={() => handleopenOrderDialog(item)}
>
  Order Now
</Button>

            </Paper>
          </Grid>
        ))
      ) : (
    <Typography sx={{ p: 3 }}>No menu items available for this restaurant.</Typography>
  )}
      </Grid>
      <Dialog
        open={openOrderDialog}
        onClose={() => setOpenOrderDialog(false)}
      >
        <DialogTitle>Order Summary</DialogTitle>

        <DialogContent>
          <Typography><b>{selectedItem?.name}</b></Typography>
          <Typography>Price: ₹{selectedItem?.price}</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Button onClick={() => quantity > 1 && setQuantity(quantity - 1)}>
              -
            </Button>
            <Typography>{quantity}</Typography>
            <Button onClick={() => setQuantity(quantity + 1)}>
              +
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6">
            Total: ₹{(selectedItem?.price || 0) * quantity}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handlePlaceOrder}
          >
            Place Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
const filteredCount = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;
  return (
    <Box>
     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
          Nearby Restaurants
        </Typography>
        <Chip 
          label={`${filteredCount} ${filteredCount === 1 ? 'Result' : 'Results'} Found`} 
          variant="outlined" 
          size="small"
          sx={{ fontWeight: 'bold', color: '#666', borderColor: '#e0e0e0' }}
        />
      </Box>
<TextField
  fullWidth
  variant="outlined"
  placeholder="Search for restaurants or cuisines..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  sx={{ 
          mb: 4, 
          bgcolor: 'white', 
          borderRadius: 2,
          '& .MuiOutlinedInput-root': {
             '&:hover fieldset': { borderColor: '#2e7d32' },
             '&.Mui-focused fieldset': { borderColor: '#2e7d32' },
          }
        }}
  InputProps={{
    startAdornment: <SearchIcon sx={{ color: 'gray', mr: 1 }} />,
  }}
/>
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
    elevation={2} 
    sx={{ 
      borderRadius: 4, 
      overflow: 'hidden', 
      transition: 'all 0.3s ease-in-out', 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      border: '1px solid #f0f0f0',
      '&:hover': { 
        transform: 'translateY(-8px)', 
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        borderColor: '#2e7d32' 
      },
      cursor: 'pointer'
    }}
   onClick={() => {
  console.log(" Restaurant selected:", rest);
  setSelectedRestaurant(rest);
}} // Changed from navigate to setSelectedRestaurant
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
  variant="outlined" // Outlined looks cleaner on a card that is already interactive
  color="success" 
  fullWidth
  sx={{ mt: 1, borderRadius: 2, fontWeight: 'bold' }}
  onClick={(e) => {
    e.stopPropagation(); // Very important: stops the Paper's click from firing twice
    setSelectedRestaurant(rest);
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
const UserOrdersView = ({orders, setOrders, userObj,showNotify, refreshOrders }) => {
 
  const [loading, setLoading] = useState(true);
  const fetchOrders = async () => {
   console.log("Fetching orders for user:", userObj.user.id);
  try {
    setLoading(true);
    const res = await axios.get(
      `http://127.0.0.1:8000/orders/user/${userObj.user.id}/orders`
    );
    console.log("Orders API response:", res.data);


   const data = res.data;

// 🔥 ALWAYS FORCE ARRAY
const ordersArray = Array.isArray(res.data.orders)
  ? res.data.orders
  : [];

// normalize items so UI can render safely
const patchedOrders = ordersArray.map(order => {
  let items = [];

  // handle string items
  if (typeof order.items === "string") {
    try {
      items = JSON.parse(order.items);
    } catch {
      items = [];
    }
  }
  // handle array items
  else if (Array.isArray(order.items)) {
    items = order.items.map(item => ({
      food_id: item.menu_id || item.food_id,
      name: item.menu?.name || item.item_name || "Unknown",
      price: item.price || 0,
      quantity: item.quantity || 1
    }));
  }

  return {
    ...order,
    items,
     total_amount: Number(order.total_amount) || 0
  };
});

setOrders(patchedOrders);


console.log("Orders received:", patchedOrders);

  } catch (err) {
    console.error(" Failed to fetch orders:", err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (userObj?.user?.id) {
    fetchOrders();
  }
}, [userObj?.user?.id, refreshOrders]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="success" /></Box>;


  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2e7d32' }}>My Order History</Typography>
      <Grid container spacing={3}>
        {orders?.map((order) => {
          const orderTotal = order.total_amount ?? 0;

    return (
          <Grid item xs={12} key={order.id}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, borderLeft: `6px solid ${order.status === 'Cancelled' ? '#d32f2f' : '#2e7d32'}` }}>
           <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
  <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: "hidden", bgcolor: "#eee" }}>
    <img
      src={order.order_image || "/food-placeholder.png"}
      alt={order.restaurant?.name || "Order"}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={(e) => (e.target.style.display = "none")}
    />
  </Box>

  <Box>
    <Typography variant="h6" fontWeight="bold">
     {order.restaurant?.name}

    </Typography>

<Typography variant="body2" color="text.secondary">
  {new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })}
</Typography>

                </Box>
                <Chip label={order.status} color={order.status === 'Cancelled' ? 'error' : 'success'} size="small" />
              </Box>

              {/* ITEM IMAGES SECTION */}
            

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
               <Typography variant="h6" color="success.main"> Total: ₹{Number(order.total_amount) || 0}</Typography>

              </Box>
            </Paper>
          </Grid>
       )
       }
       )
       }
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
     console.log(" Fetching profile for user:", userObj.user.id);

      try {
        const res = await axios.get(`http://127.0.0.1:8000/users/`);

        console.log("ProfileView: Data received from server:", res.data);
        if (!Array.isArray(res.data) && !Array.isArray(res.data?.users)) {
  console.warn("ProfileView: Users API did not return array");
  return;
}

        // Handle cases where data might be nested in res.data.user
       const targetId = userObj?.user?.id || userObj?.user?.user_id;
      const usersArray = Array.isArray(res.data)
  ? res.data
  : Array.isArray(res.data.users)
  ? res.data.users
  : [];

const latestData = usersArray.find(
  u => (u.id || u.user_id) === targetId
);
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
     console.log(" Selected profile image:", e.target.files[0]);
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
      console.log(" Updating profile with:", editData);

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
      console.log("✅ Profile updated successfully");
const updatedUser = {
  ...userObj,
  user: {
    ...userObj.user,
    ...response.data   // includes profile_picture path
  }
};

localStorage.setItem("userObj", JSON.stringify(updatedUser));

      setIsEditing(false);
      setPreviewUrl(null);
      setSelectedFile(null);
      window.dispatchEvent(new Event("storage"));

      
    } catch (err) {
      console.error("ProfileView: Update error:", err.response);
      alert(err.response?.data?.detail || "Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    console.log(" Deleting user account:", userObj.user.id);

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
           src={
  previewUrl
    ? previewUrl
    : userObj?.user?.profile_picture
    ? `http://127.0.0.1:8000/${userObj.user.profile_picture}`
    : undefined
}

              sx={{ width: 120, height: 120, bgcolor: '#1a237e', fontSize: '3rem', border: '4px solid #fff', boxShadow: 2 }}
            >
             {!previewUrl && !userObj?.user?.profile_picture && (userObj?.user?.name?.charAt(0) || "U")}
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
                <TextField fullWidth type="password" size="small" placeholder="New Password" value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} sx={{ mt: 1 }} />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <>
                <Button variant="contained" startIcon={<EditIcon />} sx={{ bgcolor: '#1a237e' }} onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              <Button
  variant="outlined"
  color="error"
  startIcon={<DeleteIcon />}
  onClick={() => setOpenDeleteDialog(true)}
>
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