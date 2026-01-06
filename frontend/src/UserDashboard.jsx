import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon,
  AppBar, Toolbar, Typography, Grid, Card, CardContent, Avatar, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  CircularProgress, Alert, Divider, Chip
} from '@mui/material';
import {
  Home, Person, ShoppingCart, Receipt, Menu as MenuIcon,
  Edit, Delete, RestaurantMenu
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000'; // From API.txt[file:23]

const drawerWidth = 240;

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantMenus, setRestaurantMenus] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [tempUser, setTempUser] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // Get logged-in user ID from localStorage (set during login)
  const userId = parseInt(localStorage.getItem('userId')) || 1;

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const ordersRes = await axios.get(`${API_BASE}/orders`);
      setOrders(ordersRes.data.filter(order => order.userid == userId));
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const res = await axios.get(`${API_BASE}/restaurants`);
      setRestaurants(res.data);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const fetchMenu = async (restaurantId) => {
    try {
      const res = await axios.get(`${API_BASE}/restaurants/${restaurantId}/menu`);
      setRestaurantMenus(prev => ({ ...prev, [restaurantId]: res.data }));
    } catch (err) {
      console.error('Failed to load menu:', err);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      // Note: API.txt doesn't have user update endpoint, using register for demo
      // Replace with actual update endpoint when available
      const formData = new FormData();
      formData.append('name', tempUser.name);
      formData.append('email', tempUser.email);
      formData.append('mobile', tempUser.phone);
      // Add other fields as needed
      await axios.post(`${API_BASE}/users/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(tempUser);
      setEditMode(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    }
  };

  const handleDeleteConfirm = () => {
    // API.txt doesn't have user delete endpoint
    // Implement when backend provides it
    console.log('Delete user', userId);
    localStorage.removeItem('userId');
    window.location.href = '/login';
    setDeleteDialog(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box sx={{ width: drawerWidth }}>
      <Toolbar />
      <Divider />
      <List>
        {[
          { text: 'Dashboard', icon: <Home />, page: 'dashboard' },
          { text: 'Profile', icon: <Person />, page: 'profile' },
          { text: 'My Orders', icon: <Receipt />, page: 'orders' },
          { text: 'My Cart', icon: <ShoppingCart />, page: 'cart' },
          { text: 'Menu', icon: <RestaurantMenu />, page: 'menu' }
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={activePage === item.page}
              onClick={() => {
                setActivePage(item.page);
                setMobileOpen(false);
                if (item.page === 'orders') fetchUserOrders();
                if (item.page === 'menu') fetchRestaurants();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderProfile = () => (
    <Card sx={{ maxWidth: 400 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            {tempUser.name?.charAt(0) || 'U'}
          </Avatar>
          {editMode ? (
            <TextField
              fullWidth
              label="Name"
              value={tempUser.name || ''}
              onChange={(e) => setTempUser({ ...tempUser, name: e.target.value })}
            />
          ) : (
            <Typography variant="h5">{tempUser.name || 'User'}</Typography>
          )}
        </Box>
        {!editMode ? (
          <>
            <Typography variant="body1" gutterBottom>
              Email: {tempUser.email || 'N/A'}
            </Typography>
            <Typography variant="body1">
              Phone: {tempUser.phone || 'N/A'}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
                Edit Profile
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<Delete />} 
                sx={{ ml: 2 }} 
                onClick={() => setDeleteDialog(true)}
              >
                Delete Account
              </Button>
            </Box>
          </>
        ) : (
          <>
            <TextField
              fullWidth
              label="Email"
              value={tempUser.email || ''}
              onChange={(e) => setTempUser({ ...tempUser, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone"
              value={tempUser.phone || ''}
              onChange={(e) => setTempUser({ ...tempUser, phone: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Box>
              <Button variant="contained" onClick={handleSave} sx={{ mr: 1 }}>
                Save Changes
              </Button>
              <Button onClick={() => {setEditMode(false); setTempUser({});}}>Cancel</Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderOrders = () => (
    <Box>
      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            No orders yet
          </Typography>
          <Typography variant="body2" gutterBottom>
            Make your first order!
          </Typography>
          <Button variant="contained" size="large" onClick={() => setActivePage('menu')}>
            Browse Menu
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order) => (
            <Grid item xs={12} md={6} key={order.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Order #{order.id}</Typography>
                  <Typography>Items: {order.items}</Typography>
                  <Chip label={order.status || 'placed'} color="primary" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderCart = () => (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h6" gutterBottom color="text.secondary">
        Cart functionality coming soon
      </Typography>
      <Typography variant="body2" gutterBottom>
        No cart API available in current spec
      </Typography>
      <Button variant="contained" onClick={() => setActivePage('menu')}>
        Browse Menu
      </Button>
    </Box>
  );

  const renderMenu = () => (
    <Box>
      {loadingRestaurants ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="h4" gutterBottom>All Restaurants</Typography>
          <Grid container spacing={3}>
            {restaurants.map((restaurant) => (
              <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => fetchMenu(restaurant.id)}>
                  <CardContent>
                    <Typography variant="h6">{restaurant.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {restaurant.address}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      {restaurant.contact}
                    </Typography>
                    <Chip label={`${restaurant.openingtime} - ${restaurant.closingtime}`} size="small" />
                  </CardContent>
                </Card>
                {restaurantMenus[restaurant.id] && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" gutterBottom>Menu:</Typography>
                    <Grid container spacing={1}>
                      {restaurantMenus[restaurant.id].map((item, idx) => (
                        <Grid item xs={6} key={idx}>
                          <Chip label={`${item.itemname} - ₹${item.price}`} size="small" />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Food Delivery - User #{userId}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
        <Toolbar />
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        
        {activePage === 'dashboard' && <Typography variant="h4">Welcome to Dashboard</Typography>}
        {activePage === 'profile' && renderProfile()}
        {activePage === 'orders' && renderOrders()}
        {activePage === 'cart' && renderCart()}
        {activePage === 'menu' && renderMenu()}
      </Box>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete Account</DialogTitle>
        <DialogContent>
          Are you sure? This will permanently delete your account and all data.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteConfirm}>Delete Permanently</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDashboard;
