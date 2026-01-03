import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Button, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem, Paper, 
  TextField, IconButton, Avatar, Grid, Divider, Snackbar, Alert, Dialog, DialogTitle, 
  DialogActions, FormControl, InputLabel, TableContainer, Chip 
} from '@mui/material';
import { 
  ListAlt, AddCircle, AccountCircle, Logout, Delete, Edit, Save,
  CurrencyRupee, ShoppingBag, DeleteForever, 
  Fastfood, Storefront, LocalDrink
} from '@mui/icons-material';
import { api } from './api';

const RestaurantDashboard = ({ orders, updateStatus, onLogout }) => {
  const [tab, setTab] = useState('Manage Orders');
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', cat: 'Main', image: '' });
  const [editingItemId, setEditingItemId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  
  const [adminData, setAdminData] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    const parsed = saved ? JSON.parse(saved) : { name: 'Restaurant Admin', email: '', mobile: '', address: '', password: '', id: 'admin' };
    console.log("Restaurant Admin Data Loaded:", parsed);
    return parsed;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState({ ...adminData });
  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  useEffect(() => {
    console.log("Fetching menu items for restaurant:", adminData.name);
    fetchMenu();
  }, [adminData.name]);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      console.log("Full Menu from API:", res.data);
      const myItems = res.data.filter(item => item.restaurant === adminData.name);
      setMenuItems(myItems);
    } catch (err) { 
      console.error("Failed to fetch menu:", err.response?.data || err.message); 
    }
  };
  const myOrders = orders.filter(o => {
    if (!o.items) return false;
    const adminName = adminData.name.toLowerCase().trim();
    const orderItems = o.items.toLowerCase();
    return orderItems.includes(adminName);
  });

  const isNewUser = menuItems.length === 0;

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.price) {
      setSnack({ open: true, msg: 'Please fill name and price', sev: 'warning' });
      return;
    }

    const itemData = { ...newItem, price: Number(newItem.price), restaurant: adminData.name };
    console.log("Attempting to save item:", itemData);

    try {
      if (editingItemId) {
        await api.put(`/menu/${editingItemId}`, itemData);
        setSnack({ open: true, msg: 'Item updated!', sev: 'success' });
      } else {
        const res = await api.post('/menu', { ...itemData, id: Date.now().toString() });
        console.log("New Item Added:", res.data);
        setMenuItems([...menuItems, res.data]);
        setSnack({ open: true, msg: 'New item added!', sev: 'success' });
      }
      setNewItem({ name: '', price: '', cat: 'Main', image: '' });
      setEditingItemId(null);
      fetchMenu();
    } catch (err) { 
      console.error("Save Item Error:", err.response?.data || err.message);
      setSnack({ open: true, msg: 'Operation failed', sev: 'error' }); 
    }
  };

  const handleEditClick = (item) => {
    setEditingItemId(item.id);
    setNewItem({ name: item.name, price: item.price, cat: item.cat, image: item.image || '' });
    setTab('Add New Items');
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/menu/${id}`);
      setMenuItems(menuItems.filter(item => item.id !== id));
      setSnack({ open: true, msg: 'Item removed', sev: 'info' });
    } catch (err) { 
      console.error("Delete Failed:", err);
      setSnack({ open: true, msg: 'Delete failed', sev: 'error' }); 
    }
  };

  const handleSaveProfile = async () => {
    console.log("Updating Restaurant Profile for ID:", adminData.id);
    try {
      const response = await api.patch(`/users/${adminData.id}`, { ...tempData });
      console.log("Profile Update Success:", response.data);
      setAdminData(response.data);
      localStorage.setItem('currentUser', JSON.stringify(response.data));
      setIsEditing(false);
      setSnack({ open: true, msg: 'Profile updated!', sev: 'success' });
    } catch (err) { 
      console.error("Profile update failed:", err.response?.data || err.message);
      setSnack({ open: true, msg: 'Update failed', sev: 'error' }); 
    }
  };

  const handlePasswordUpdate = async () => {
    if (pwdData.old !== adminData.password) { setSnack({ open: true, msg: 'Old password incorrect!', sev: 'error' }); return; }
    if (pwdData.new !== pwdData.confirm) { setSnack({ open: true, msg: 'Passwords do not match!', sev: 'error' }); return; }
    
    console.log("Updating Password for ID:", adminData.id);
    try {
      await api.patch(`/users/${adminData.id}`, { password: pwdData.new });
      setAdminData({ ...adminData, password: pwdData.new });
      setPwdData({ old: '', new: '', confirm: '' });
      setSnack({ open: true, msg: 'Password updated!', sev: 'success' });
    } catch (err) { 
      console.error("Password Update failed:", err);
      setSnack({ open: true, msg: 'Update failed.', sev: 'error' }); 
    }
  };

  const calculateTotalRevenue = () => {
    return myOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + Number(o.total || 0), 0);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer variant="permanent" sx={{ width: 260, "& .MuiDrawer-paper": { width: 260, bgcolor: '#1a237e', color: 'white' } }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold">FOOD App</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{adminData.name}'s Portal</Typography>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ px: 1, mt: 2 }}>
          {[{ t: 'Manage Orders', i: <ListAlt /> }, { t: 'Add New Items', i: <AddCircle /> }, { t: 'Profile', i: <AccountCircle /> }].map(x => (
            <ListItem key={x.t} disablePadding onClick={() => { console.log("Tab:", x.t); setTab(x.t); }}>
              <ListItemButton selected={tab === x.t} sx={{ borderRadius: 2, mb: 1, "&.Mui-selected": { bgcolor: '#3949ab' } }}>
                <ListItemIcon sx={{ color: 'white' }}>{x.i}</ListItemIcon>
                <ListItemText primary={x.t} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button fullWidth variant="contained" color="error" startIcon={<Logout />} onClick={onLogout}>Logout</Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4, bgcolor: '#f0f2f5', minHeight: '100vh' }}>  
        {tab === 'Manage Orders' && (
          isNewUser ? (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
              <Paper sx={{ p: 6, maxWidth: 600, mx: 'auto', borderRadius: 4, border: '2px dashed #ccc' }}>
                <Storefront sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                <Typography variant="h4" fontWeight="bold">Welcome, {adminData.name}!</Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>Add your menu to start receiving customer orders.</Typography>
                <Button variant="contained" size="large" onClick={() => setTab('Add New Items')} sx={{ bgcolor: '#1a237e' }}>Add First Dish</Button>
              </Paper>
            </Box>
          ) : (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, color: '#1a237e' }}>Order Tracking</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}><Paper sx={{ p: 3, display: 'flex', gap: 2, borderRadius: 3 }}><Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}><CurrencyRupee /></Avatar><Box><Typography variant="caption">Revenue</Typography><Typography variant="h5" fontWeight="bold">₹{calculateTotalRevenue()}</Typography></Box></Paper></Grid>
                <Grid item xs={12} md={6}><Paper sx={{ p: 3, display: 'flex', gap: 2, borderRadius: 3 }}><Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}><ShoppingBag /></Avatar><Box><Typography variant="caption">New Orders</Typography><Typography variant="h5" fontWeight="bold">{myOrders.filter(o => o.status !== 'Delivered').length}</Typography></Box></Paper></Grid>
              </Grid>
              <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f8f9fa' }}><TableRow><TableCell><b>ID</b></TableCell><TableCell><b>Order Details</b></TableCell><TableCell><b>Total</b></TableCell><TableCell><b>Status</b></TableCell><TableCell align="center"><b>Action</b></TableCell></TableRow></TableHead>
                  <TableBody>
                    {myOrders.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{py:3}}>Waiting for incoming orders...</TableCell></TableRow> :
                      [...myOrders].reverse().map(o => (
                        <TableRow key={o.id} hover>
                          <TableCell>#ORD-{o.id.toString().slice(-5)}</TableCell>
                          <TableCell><Typography fontWeight="bold">{o.user}</Typography><Typography variant="caption">{o.items}</Typography></TableCell>
                          <TableCell>₹{o.total}</TableCell>
                          <TableCell><Chip label={o.status} size="small" color={o.status === 'Delivered' ? 'success' : 'warning'} /></TableCell>
                          <TableCell align="center">
                            <Select size="small" value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} sx={{ minWidth: 120 }}>
                              <MenuItem value="Pending">🕒 Pending</MenuItem><MenuItem value="Preparing">👨‍🍳 Preparing</MenuItem><MenuItem value="Delivered">✅ Delivered</MenuItem>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )
        )}

        {tab === 'Add New Items' && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{editingItemId ? "Edit Dish" : "Add Dish"}</Typography>
                <TextField fullWidth label="Dish Name" margin="normal" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
                <TextField fullWidth label="Price (₹)" type="number" margin="normal" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
                <TextField fullWidth label="Image URL" margin="normal" value={newItem.image} onChange={(e) => setNewItem({...newItem, image: e.target.value})} />
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category" value={newItem.cat} onChange={(e) => setNewItem({...newItem, cat: e.target.value})}>
                    {['Starters', 'Tiffins', 'Main', 'Softdrinks', 'Dessert'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button fullWidth variant="contained" sx={{ mt: 3, py: 1.5, bgcolor: '#1a237e' }} onClick={handleSaveItem}>{editingItemId ? "Update" : "Save"}</Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, borderRadius: 3, maxHeight: '75vh', overflowY: 'auto' }}>
                <Typography variant="h6" fontWeight="bold">Menu List ({menuItems.length})</Typography>
                <Divider sx={{ my: 2 }} />
                {menuItems.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Avatar variant="rounded" src={item.image} sx={{ width: 60, height: 60 }}>
                      {item.cat === 'Softdrinks' ? <LocalDrink /> : <Fastfood />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}><Typography fontWeight="bold">{item.name}</Typography><Typography variant="caption" color="primary">{item.cat} • ₹{item.price}</Typography></Box>
                    <Box><IconButton color="primary" onClick={() => handleEditClick(item)}><Edit /></IconButton><IconButton color="error" onClick={() => handleDeleteItem(item.id)}><Delete /></IconButton></Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        )}

        {tab === 'Profile' && (
          <Box maxWidth="850px" mx="auto">
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, mb: 3 }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: '#1a237e', fontSize: 40 }}>{adminData.name.charAt(0)}</Avatar>
              <Typography variant="h5" fontWeight="bold">{adminData.name}</Typography>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                {!isEditing ? <Button startIcon={<Edit />} variant="contained" onClick={() => setIsEditing(true)}>Edit Profile</Button> 
                : <><Button startIcon={<Save />} variant="contained" color="success" onClick={handleSaveProfile}>Save Changes</Button><Button variant="outlined" onClick={() => { setIsEditing(false); setTempData({...adminData}); }}>Cancel</Button></>}
                <Button startIcon={<DeleteForever />} variant="contained" color="error" onClick={() => setOpenDeleteDialog(true)}>Delete Account</Button>
              </Box>
            </Paper>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="#1a237e">Restaurant Details</Typography>
                  <TextField fullWidth label="Name" value={tempData.name} disabled={!isEditing} margin="normal" onChange={(e)=>setTempData({...tempData, name: e.target.value})} />
                  <TextField fullWidth label="Email" value={tempData.email} disabled={!isEditing} margin="normal" onChange={(e)=>setTempData({...tempData, email: e.target.value})} />
                  <TextField fullWidth label="Mobile" value={tempData.mobile} disabled={!isEditing} margin="normal" onChange={(e)=>setTempData({...tempData, mobile: e.target.value})} />
                  <TextField fullWidth label="Address" value={tempData.address} disabled={!isEditing} margin="normal" multiline rows={3} onChange={(e)=>setTempData({...tempData, address: e.target.value})} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="#1a237e">Security</Typography>
                  <TextField fullWidth label="Current Password" type="password" margin="normal" value={pwdData.old} onChange={(e)=>setPwdData({...pwdData, old: e.target.value})} />
                  <TextField fullWidth label="New Password" type="password" margin="normal" value={pwdData.new} onChange={(e)=>setPwdData({...pwdData, new: e.target.value})} />
                  <TextField fullWidth label="Confirm Password" type="password" margin="normal" value={pwdData.confirm} onChange={(e)=>setPwdData({...pwdData, confirm: e.target.value})} />
                  <Button fullWidth variant="contained" sx={{ mt: 2, bgcolor: '#1a237e' }} onClick={handlePasswordUpdate}>Update Password</Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({...snack, open: false})}><Alert severity={snack.sev} variant="filled">{snack.msg}</Alert></Snackbar>
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}><DialogTitle>Delete Account?</DialogTitle><DialogActions><Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button><Button onClick={async () => { console.log("Deleting..."); await api.delete(`/users/${adminData.id}`); onLogout(); }} color="error" variant="contained">Confirm Delete</Button></DialogActions></Dialog>
    </Box>
  );
};

export default RestaurantDashboard;