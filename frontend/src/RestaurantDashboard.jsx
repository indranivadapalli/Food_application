import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Button, Grid, Card, CardContent, TextField, Paper, Divider, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { 
  Storefront, ListAlt, Logout, Add, Fastfood, Inventory 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

const RestaurantDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Menu Management');
  const [myMenu, setMyMenu] = useState({});
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  
  // State for adding new items to categories defined in your backend
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'main_course' });

  const [userData, setUserData] = useState({'user': () => {

    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }});

  const SECTIONS = ["tiffins", "starters", "main_course", "soft_drinks", "desserts"];

  useEffect(() => {
    if (!userData) { navigate('/'); return; }
    fetchData();
  }, [userData, navigate]);

  const fetchData = async () => {
    try {
      // Get restaurants to find this specific owner's data
      const res = await api.get('/restaurants/');
      if (res.data.status === "success") {
        const myData = res.data.restaurants.find(r => r.name === userData.name);
        if (myData) setMyMenu(myData.menu);
      }
      
      // Get all orders and filter for this restaurant
      const orderRes = await api.get('/orders');
      if (orderRes.data.status === "success") {
        setOrders(orderRes.data.orders.filter(o => o.items.includes(userData.name)));
      }
    } catch (err) {
      console.error("Error fetching restaurant data", err);
    }
  };

  const handleAddItem = async () => {
    try {
      // API call to update the specific restaurant's menu JSON
      const res = await api.post(`/restaurants/${userData.name}/menu`, newItem);
      if (res.data.status === "success") {
        setOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to add item");
    }
  };

  if (!userData) return null;

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer variant="permanent" sx={{ width: 240, "& .MuiDrawer-paper": { width: 240, boxSizing: 'border-box' } }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight="bold" color="#1a237e">{userData.name}</Typography>
          <Typography variant="caption">Restaurant Partner</Typography>
        </Box>
        <Divider />
        <List>
          {[
            { t: 'Menu Management', i: <Inventory /> },
            { t: 'Restaurant Orders', i: <ListAlt /> }
          ].map((item) => (
            <ListItem key={item.t} disablePadding onClick={() => setTab(item.t)}>
              <ListItemButton selected={tab === item.t}>
                <ListItemIcon sx={{ color: tab === item.t ? '#1a237e' : 'inherit' }}>{item.i}</ListItemIcon>
                <ListItemText primary={item.t} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button fullWidth startIcon={<Logout />} color="error" variant="outlined" onClick={onLogout}>Logout</Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        {tab === 'Menu Management' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">Current Menu</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ bgcolor: '#1a237e' }}>
                Add New Item
              </Button>
            </Box>

            {SECTIONS.map(section => (
              <Box key={section} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize', color: '#1a237e' }}>
                  {section.replace('_', ' ')}
                </Typography>
                <Grid container spacing={2}>
                  {myMenu[section]?.map(item => (
                    <Grid item xs={12} sm={6} md={4} key={`${section}-${item.item_id}`}>
                      <Card sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography fontWeight="bold">{item.name}</Typography>
                            <Typography color="text.secondary">₹{item.price}</Typography>
                          </Box>
                          <Fastfood color="disabled" />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        )}

        {tab === 'Restaurant Orders' && (
          <Box maxWidth="800px">
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Orders for Your Kitchen</Typography>
            {orders.length > 0 ? orders.map(o => (
              <Paper key={o.id} sx={{ p: 3, mb: 2, borderRadius: 2, borderLeft: '6px solid #1a237e' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight="bold">Order #{o.id}</Typography>
                  <Chip label={o.status} color="primary" variant="outlined" />
                </Box>
                <Typography sx={{ my: 1 }}>{o.items}</Typography>
                <Typography variant="caption" color="text.secondary">Customer: {o.user}</Typography>
              </Paper>
            )) : <Typography>No orders received yet.</Typography>}
          </Box>
        )}
      </Box>

      {/* Add Item Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Menu Item</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Dish Name" margin="normal" onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
          <TextField fullWidth label="Price (₹)" type="number" margin="normal" onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select value={newItem.category} label="Category" onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
              {SECTIONS.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained" sx={{ bgcolor: '#1a237e' }}>Add to Menu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RestaurantDashboard;