import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Button, Grid, Card, CardContent, Paper, Divider, Chip, Avatar, Snackbar, Alert 
} from '@mui/material';
import { 
  Moped, Person, ListAlt, Logout, CheckCircle, LocalShipping, QueryBuilder 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import  api  from './api';

const DeliveryDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Pending Deliveries');
  const [deliveries, setDeliveries] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  
  const [userData] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (!userData) navigate('/');
    fetchDeliveries();
  }, [userData, navigate]);

  const fetchDeliveries = async () => {
    try {
      // Fetching all orders to filter those assigned or ready for delivery
      const res = await api.get('/orders');
      if (res.data.status === "success") {
        setDeliveries(res.data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch deliveries", err);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}`, { status: newStatus });
      if (res.data.status === "success") {
        setSnack({ open: true, msg: `Order marked as ${newStatus}`, sev: 'success' });
        fetchDeliveries(); // Refresh list
      }
    } catch (err) {
      setSnack({ open: true, msg: 'Update failed', sev: 'error' });
    }
  };

  if (!userData) return null;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar Navigation */}
      <Drawer variant="permanent" sx={{ width: 240, "& .MuiDrawer-paper": { width: 240, boxSizing: 'border-box' } }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight="bold" color="#1a237e">Delivery Panel</Typography>
          <Typography variant="caption" color="textSecondary">Welcome, {userData.name}</Typography>
        </Box>
        <Divider />
        <List>
          {[
            { t: 'Pending Deliveries', i: <QueryBuilder /> },
            { t: 'My Profile', i: <Person /> }
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
          <Button fullWidth startIcon={<Logout />} color="error" variant="outlined" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        {tab === 'Pending Deliveries' && (
          <Box maxWidth="900px" mx="auto">
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Available Orders</Typography>
            <Grid container spacing={2}>
              {deliveries.filter(d => d.status !== 'Delivered').length > 0 ? (
                deliveries.filter(d => d.status !== 'Delivered').map(order => (
                  <Grid item xs={12} key={order.id}>
                    <Paper sx={{ p: 3, borderRadius: 3, borderLeft: '8px solid #1a237e' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Order #{order.id}</Typography>
                        <Chip 
                          label={order.status} 
                          color={order.status === 'Pending' ? 'warning' : 'info'} 
                          variant="outlined" 
                        />
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 1 }}><strong>Items:</strong> {order.items}</Typography>
                      <Typography variant="body2" color="text.secondary"><strong>Customer:</strong> {order.user}</Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {order.status === 'Pending' && (
                          <Button 
                            variant="contained" 
                            startIcon={<LocalShipping />} 
                            sx={{ bgcolor: '#1a237e' }}
                            onClick={() => updateStatus(order.id, 'Out for Delivery')}
                          >
                            Pick Up Order
                          </Button>
                        )}
                        {order.status === 'Out for Delivery' && (
                          <Button 
                            variant="contained" 
                            color="success" 
                            startIcon={<CheckCircle />}
                            onClick={() => updateStatus(order.id, 'Delivered')}
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Typography sx={{ p: 2 }}>No active deliveries found.</Typography>
              )}
            </Grid>
          </Box>
        )}

        {tab === 'My Profile' && (
          <Box maxWidth="600px" mx="auto">
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#1a237e' }}>
                <Moped fontSize="large" />
              </Avatar>
              <Typography variant="h5">{userData.name}</Typography>
              <Typography color="textSecondary">{userData.email}</Typography>
              <Divider sx={{ my: 3 }} />
              <Box textAlign="left">
                <Typography variant="body1"><strong>Phone:</strong> {userData.mobile}</Typography>
                <Typography variant="body1"><strong>Area:</strong> {userData.address}</Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DeliveryDashboard;