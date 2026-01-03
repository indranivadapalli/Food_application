import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Button, Grid, Card, CardContent, CardMedia, Avatar, TextField, Paper, Badge, 
  IconButton, Snackbar, Alert, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Divider, Chip 
} from '@mui/material';
import { 
  RestaurantMenu, Person, ListAlt, ShoppingCart, Logout, Add, Remove, 
  CloudUpload, Search, DeleteForever, Edit, Save, Fastfood, AddShoppingCart 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

const UserDashboard = ({ orders, addOrder, onLogout, setOrders, cancelOrder }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Menu');
  const [menu, setMenu] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState('All');
  const [restaurantFilter, setRestaurantFilter] = useState('All');
  
  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    const parsedUser = savedUser ? JSON.parse(savedUser) : { name: '', email: '', mobile: '', address: '', password: '', id: '' };
    console.log("Dashboard Loaded - Current User Data:", parsedUser);
    return parsedUser;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState({ ...userData });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [profileImg, setProfileImg] = useState(null);
  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const uniqueRestaurants = ['All', ...new Set(menu.map(item => item.restaurant).filter(Boolean))];
  useEffect(() => {
    console.log("Fetching Menu and Orders from Backend...");
    
    api.get('/menu')
      .then(res => {
        console.log("Menu Data Received:", res.data);
        setMenu(res.data);
      })
      .catch(err => console.error("Error fetching menu:", err.response?.data || err.message));

    api.get('/orders')
      .then(res => { 
        console.log("All Orders Received:", res.data);
        if (setOrders) setOrders(res.data); 
      })
      .catch(err => console.error("Error fetching orders:", err.response?.data || err.message));
  }, [setOrders]); 

  const filteredItems = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filter === 'All' || item.cat === filter;
    const matchesRestaurant = restaurantFilter === 'All' || item.restaurant === restaurantFilter;
    return matchesSearch && matchesCategory && matchesRestaurant;
  });

  const handleCart = (item, type) => {
    const exist = cart.find(x => x.id === item.id);
    if (type === 'add') {
      if (exist) {
        setCart(cart.map(x => x.id === item.id ? { ...x, q: x.q + 1 } : x));
      } else {
        setCart([...cart, { ...item, q: 1 }]);
      }
      setSnack({ open: true, msg: `${item.name} added to cart!`, sev: 'success' });
    } else if (type === 'remove') {
      if (exist.q === 1) {
        setCart(cart.filter(x => x.id !== item.id));
      } else {
        setCart(cart.map(x => x.id === item.id ? { ...x, q: x.q - 1 } : x));
      }
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const totalAmount = cart.reduce((acc, curr) => acc + (Number(curr.price) * curr.q), 0);
    const orderItemsString = cart.map(i => `${i.name} (${i.restaurant || 'General'}) x${i.q}`).join(', ');
    
    const newOrder = { 
      user: userData.name,
      user_id: userData.id,
      items: orderItemsString, 
      total: totalAmount,
      status: 'Pending', 
      time: new Date().toLocaleString() 
    };

    console.log("Attempting to Place Order:", newOrder);

    try {
      const res = await api.post('/orders/', newOrder);
      console.log("Order Placed Success:", res.data);
      addOrder(res.data);
      setCart([]); 
      setTab('Orders');
      setSnack({ open: true, msg: 'Order placed successfully!', sev: 'success' });
    } catch (err) {
      console.error("Order Failed:", err.response?.data || err.message);
      setSnack({ open: true, msg: 'Failed to place order. Check backend.', sev: 'error' });
    }
  };

  const handleCancelOrder = async (orderId) => {
    console.log(`Attempting to Cancel Order ID: ${orderId}`);
    try {
        const result = await cancelOrder(orderId);
        if (result.success) {
          setSnack({ open: true, msg: 'Order cancelled successfully!', sev: 'info' });
        } else {
          setSnack({ open: true, msg: result.msg || 'Error cancelling order', sev: 'error' });
        }
    } catch (err) {
        console.error("Cancel Order Error:", err);
    }
  };

  const handleSaveProfile = async () => {
    console.log("Updating Profile for User ID:", userData.id);
    try {
      const response = await api.patch(`/users/${userData.id}`, {
        name: tempData.name, 
        email: tempData.email, 
        mobile: tempData.mobile, 
        address: tempData.address
      });
      console.log("Profile Update Success:", response.data);
      setUserData(response.data);
      localStorage.setItem('currentUser', JSON.stringify(response.data));
      setIsEditing(false);
      setSnack({ open: true, msg: 'Profile updated!', sev: 'success' });
    } catch (err) {
      console.error("Profile Update Failed:", err.response?.data || err.message);
      setSnack({ open: true, msg: 'Error updating profile', sev: 'error' });
    }
  };

  const confirmDeleteAccount = async () => {
    console.log("Deleting Account for User ID:", userData.id);
    try {
      await api.delete(`/users/${userData.id}`);
      console.log("Account Deleted Successfully");
      localStorage.clear();
      setOpenDeleteDialog(false);
      navigate('/');
      window.location.reload(); 
    } catch (err) {
      console.error("Delete Account Failed:", err.response?.data || err.message);
      setSnack({ open: true, msg: 'Failed to delete account.', sev: 'error' });
    }
  };

  const handlePasswordUpdate = async () => {
    if (pwdData.old !== userData.password) {
      setSnack({ open: true, msg: 'Old password incorrect!', sev: 'error' });
      return;
    }
    if (pwdData.new !== pwdData.confirm) {
        setSnack({ open: true, msg: 'Passwords do not match!', sev: 'error' });
        return;
    }
    console.log("Updating Password for User ID:", userData.id);
    try {
      await api.patch(`/users/${userData.id}`, { password: pwdData.new });
      setUserData({ ...userData, password: pwdData.new });
      setPwdData({ old: '', new: '', confirm: '' });
      setSnack({ open: true, msg: 'Password updated!', sev: 'success' });
    } catch (err) {
      console.error("Password Update Failed:", err.response?.data || err.message);
      setSnack({ open: true, msg: 'Update failed.', sev: 'error' });
    }
  };

  const handleImgChange = (e) => {
    if (e.target.files[0]) {
        console.log("New Profile Image Selected:", e.target.files[0].name);
        setProfileImg(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer variant="permanent" sx={{ width: 240, "& .MuiDrawer-paper": { width: 240, boxSizing: 'border-box' } }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" color="#1a237e">FOOD App</Typography>
        </Box>
        <Divider />
        <List>
          {[{ t: 'Menu', i: <RestaurantMenu /> }, { t: 'Profile', i: <Person /> }, { t: 'Orders', i: <ListAlt /> }, { t: 'Add to cart', i: <Badge badgeContent={cart.length} color="error"><ShoppingCart /></Badge> }].map((item) => (
            <ListItem key={item.t} disablePadding onClick={() => {
                console.log(`Tab Switched to: ${item.t}`);
                setTab(item.t);
            }}>
              <ListItemButton selected={tab === item.t}>
                <ListItemIcon sx={{ color: tab === item.t ? '#1a237e' : 'inherit' }}>{item.i}</ListItemIcon>
                <ListItemText primary={item.t} primaryTypographyProps={{ fontWeight: tab === item.t ? 'bold' : 'normal' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button fullWidth startIcon={<Logout />} color="error" variant="outlined" onClick={onLogout}>Logout</Button>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        {tab === 'Menu' && (
          <Box>
            <TextField fullWidth placeholder="Search for dishes..." onChange={(e) => setSearch(e.target.value)} sx={{ mb: 3, bgcolor: 'white' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#666' }}>Browse by Restaurant</Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              {uniqueRestaurants.map(resName => (
                <Button 
                  key={resName} 
                  variant={restaurantFilter === resName ? 'contained' : 'outlined'} 
                  onClick={() => setRestaurantFilter(resName)}
                  sx={{ borderRadius: 2, textTransform: 'none', minWidth: 'fit-content', bgcolor: restaurantFilter === resName ? '#e91e63' : 'transparent' }}
                >
                  {resName}
                </Button>
              ))}
            </Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#666' }}>Categories</Typography>
            <Box sx={{ mb: 3, display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              {['All', 'Starters', 'Tiffins', 'Main', 'Softdrinks', 'Dessert'].map(category => (
                <Button key={category} variant={filter === category ? 'contained' : 'outlined'} onClick={() => setFilter(category)} sx={{ borderRadius: 20 }}>{category}</Button>
              ))}
            </Box>

            <Grid container spacing={3}>
              {filteredItems.map(item => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}>
                    <Box sx={{ height: 160, position: 'relative', bgcolor: '#e0e0e0' }}>
                        {item.image ? (
                            <CardMedia component="img" height="160" image={item.image} alt={item.name} sx={{ objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/300x160?text=Food+Item'; }} />
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                                <Fastfood sx={{ fontSize: 60 }} />
                            </Box>
                        )}
                        <Chip label={item.cat} size="small" sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'white', fontWeight: 'bold' }} />
                    </Box>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">{item.name}</Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">₹{item.price}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Restaurant: <b>{item.restaurant || 'Unknown'}</b>
                      </Typography>
                      <Button fullWidth variant="contained" startIcon={<AddShoppingCart />} sx={{ mt: 2, borderRadius: 2, bgcolor: '#1a237e', textTransform: 'none' }} onClick={() => handleCart(item, 'add')}>
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {filteredItems.length === 0 && (
                <Grid item xs={12}>
                  <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>No food items found matching your filters.</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        {tab === 'Profile' && (
          <Box maxWidth="850px" mx="auto">
            <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar src={profileImg} sx={{ width: 110, height: 110, mx: 'auto', mb: 2, bgcolor: '#1a237e', fontSize: 45 }}>{!profileImg && userData.name.charAt(0)}</Avatar>
                <IconButton component="label" sx={{ position: 'absolute', bottom: 5, right: 0, bgcolor: 'white', boxShadow: 1 }}><CloudUpload color="primary" fontSize="small" /><input hidden accept="image/*" type="file" onChange={handleImgChange} /></IconButton>
              </Box>
              <Typography variant="h5" fontWeight="bold">{userData.name}</Typography>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                {!isEditing ? <Button startIcon={<Edit />} variant="contained" onClick={() => setIsEditing(true)}>Edit Profile</Button> 
                : <Box sx={{ display: 'flex', gap: 1 }}><Button startIcon={<Save />} variant="contained" color="success" onClick={handleSaveProfile}>Save</Button><Button variant="outlined" color="error" onClick={() => { setIsEditing(false); setTempData({...userData}); }}>Cancel</Button></Box>}
                <Button startIcon={<DeleteForever />} variant="contained" color="error" onClick={() => setOpenDeleteDialog(true)}>Delete Account</Button>
              </Box>
            </Paper>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="#1a237e">Personal Details</Typography>
                  <TextField fullWidth label="Full Name" value={tempData.name} margin="normal" disabled={!isEditing} onChange={(e)=>setTempData({...tempData, name: e.target.value})} />
                  <TextField fullWidth label="Email" value={tempData.email} margin="normal" disabled={!isEditing} onChange={(e)=>setTempData({...tempData, email: e.target.value})} />
                  <TextField fullWidth label="Mobile" value={tempData.mobile} margin="normal" disabled={!isEditing} onChange={(e)=>setTempData({...tempData, mobile: e.target.value})} />
                  <TextField fullWidth label="Address" value={tempData.address} margin="normal" multiline rows={3} disabled={!isEditing} onChange={(e)=>setTempData({...tempData, address: e.target.value})} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="#1a237e">Change Password</Typography>
                  <TextField fullWidth label="Current Password" type={showPwd ? "text" : "password"} margin="dense" value={pwdData.old} onChange={(e)=>setPwdData({...pwdData, old: e.target.value})} />
                  <TextField fullWidth label="New Password" type={showPwd ? "text" : "password"} margin="dense" value={pwdData.new} onChange={(e)=>setPwdData({...pwdData, new: e.target.value})} />
                  <TextField fullWidth label="Confirm Password" type={showPwd ? "text" : "password"} margin="dense" value={pwdData.confirm} onChange={(e)=>setPwdData({...pwdData, confirm: e.target.value})} />
                  <Button size="small" onClick={()=>setShowPwd(!showPwd)}>{showPwd ? "Hide" : "Show"}</Button>
                  <Button fullWidth variant="contained" sx={{ mt: 2, bgcolor: '#1a237e' }} onClick={handlePasswordUpdate}>Update Password</Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
        {tab === 'Add to cart' && (
          <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', borderRadius: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom color="#1a237e">Review Your Order</Typography>
            {cart.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <ShoppingCart sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Cart is empty!</Typography>
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => setTab('Menu')}>Browse Menu</Button>
              </Box>
            ) : (
              <Box>
                <List>
                  {cart.map(item => (
                    <ListItem key={item.id} sx={{ py: 2, bgcolor: '#fcfcfc', mb: 1, borderRadius: 2, border: '1px solid #eee' }}>
                      <Avatar variant="rounded" src={item.image} sx={{ mr: 2, width: 50, height: 50 }}>{!item.image && <Fastfood />}</Avatar>
                      <ListItemText primary={<b>{item.name}</b>} secondary={`₹${item.price}`} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => handleCart(item, 'remove')}><Remove /></IconButton>
                        <Typography fontWeight="bold">{item.q}</Typography>
                        <IconButton onClick={() => handleCart(item, 'add')}><Add /></IconButton>
                        <Typography fontWeight="bold" sx={{ ml: 2 }}>₹{item.price * item.q}</Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h5" fontWeight="bold" textAlign="right">Total: ₹{cart.reduce((acc, curr) => acc + (curr.price * curr.q), 0)}</Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}><Button fullWidth variant="outlined" onClick={() => {
                      console.log("Cart Cleared");
                      setCart([]);
                  }} color="error">Clear Cart</Button></Grid>
                  <Grid item xs={6}><Button fullWidth variant="contained" sx={{ bgcolor: '#1b5e20' }} onClick={placeOrder}>Confirm Order</Button></Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        )}

        {tab === 'Orders' && (
          <Box maxWidth="850px" mx="auto">
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Order History</Typography>
            {orders.filter(o => o.user_id === userData.id || o.user === userData.name).length === 0 ? <Typography color="text.secondary">No orders yet.</Typography> : (
              orders.filter(o => o.user_id === userData.id || o.user === userData.name).reverse().map(o => (
                <Paper key={o.id} sx={{ p: 3, mb: 2, borderRadius: 3, borderLeft: '10px solid #1a237e' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography fontWeight="bold">ID: #{o.id}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {o.status === 'Pending' && <Button size="small" color="error" variant="outlined" onClick={() => handleCancelOrder(o.id)}>Cancel</Button>}
                      <Typography color="success.main" fontWeight="bold">{o.status}</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ my: 1 }}>Items: {o.items}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption">{o.time}</Typography><Typography fontWeight="bold">₹{o.total}</Typography></Box>
                </Paper>
              ))
            )}
          </Box>
        )}
      </Box>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Delete Account?</DialogTitle>
        <DialogContent><DialogContentText>This action will permanently remove your data and cannot be undone.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button><Button onClick={confirmDeleteAccount} color="error" variant="contained">Delete</Button></DialogActions>
      </Dialog>
      
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({...snack, open: false})}><Alert severity={snack.sev} variant="filled">{snack.msg}</Alert></Snackbar>
    </Box>
  );
};

export default UserDashboard;