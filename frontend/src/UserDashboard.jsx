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

const API_BASE = 'http://localhost:8000'; 

const drawerWidth = 240;

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantMenus, setRestaurantMenus] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [tempUser, setTempUser] = useState({});
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // ID usage removed here
  useEffect(() => {
    fetchGeneralOrders();
  }, []);

  const fetchGeneralOrders = async () => {
    try {
      setLoading(true);
      const ordersRes = await axios.get(`${API_BASE}/orders`);
      // Filtering by userId removed - showing all available orders
      setOrders(ordersRes.data); 
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
      const formData = new FormData();
      formData.append('name', tempUser.name);
      formData.append('email', tempUser.email);
      formData.append('mobile', tempUser.phone);
      
      await axios.post(`${API_BASE}/users/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditMode(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    }
  };

  const handleDeleteConfirm = () => {
    // ID usage removed - clearing session and redirecting
    localStorage.clear();
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
          { text: 'Orders', icon: <Receipt />, page: 'orders' },
          { text: 'Menu', icon: <RestaurantMenu />, page: 'menu' }
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={activePage === item.page}
              onClick={() => {
                setActivePage(item.page);
                setMobileOpen(false);
                if (item.page === 'orders') fetchGeneralOrders();
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
            <Typography variant="h5">{tempUser.name || 'User Profile'}</Typography>
          )}
        </Box>
        {!editMode ? (
          <>
            <Typography variant="body1" gutterBottom>Email: {tempUser.email || 'N/A'}</Typography>
            <Typography variant="body1">Phone: {tempUser.phone || 'N/A'}</Typography>
            <Box sx={{ mt: 3 }}>
              <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>Edit Profile</Button>
              <Button variant="outlined" color="error" startIcon={<Delete />} sx={{ ml: 2 }} onClick={() => setDeleteDialog(true)}>Delete Account</Button>
            </Box>
          </>
        ) : (
          <>
            <TextField fullWidth label="Email" value={tempUser.email || ''} onChange={(e) => setTempUser({ ...tempUser, email: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Phone" value={tempUser.phone || ''} onChange={(e) => setTempUser({ ...tempUser, phone: e.target.value })} sx={{ mb: 2 }} />
            <Box>
              <Button variant="contained" onClick={handleSave} sx={{ mr: 1 }}>Save Changes</Button>
              <Button onClick={() => {setEditMode(false); setTempUser({});}}>Cancel</Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderOrders = () => (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Order History</Typography>
      {orders.length === 0 ? (
        <Typography color="text.secondary">No orders found.</Typography>
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
                    <Typography variant="body2" color="text.secondary">{restaurant.address}</Typography>
                    <Chip label={`${restaurant.openingtime} - ${restaurant.closingtime}`} size="small" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
                {restaurantMenus[restaurant.id] && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Menu Items:</Typography>
                    {restaurantMenus[restaurant.id].map((item, idx) => (
                      <Chip key={idx} label={`${item.itemname} - ₹${item.price}`} size="small" sx={{ m: 0.5 }} />
                    ))}
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
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>Food Delivery Dashboard</Typography>
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawerContent}
        </Drawer>
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
        <Toolbar />
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        
        {activePage === 'dashboard' && (
          <Box>
            <Typography variant="h4">Welcome!</Typography>
            <Typography sx={{ mt: 2 }}>Select a category from the menu to get started.</Typography>
          </Box>
        )}
        {activePage === 'profile' && renderProfile()}
        {activePage === 'orders' && renderOrders()}
        {activePage === 'menu' && renderMenu()}
      </Box>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete Account</DialogTitle>
        <DialogContent>Are you sure? This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteConfirm}>Delete Permanently</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDashboard;