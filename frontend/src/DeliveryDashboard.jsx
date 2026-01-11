import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline, Avatar, TextField, Paper, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, Button, ListItemText, Divider, Container, Grid, Chip, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashIcon, Edit as EditIcon, Delete as DeleteIcon, Assignment as AssignmentIcon, 
  AccountCircle, ExitToApp, Restaurant as RestaurantIcon, Phone as PhoneIcon, LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;
const API_BASE_URL = "http://127.0.0.1:8000";

const DeliveryDashboard = () => {
  console.log("LOG: Rendering DeliveryDashboard Main Container");
  const [activeTab, setActiveTab] = useState('Dashboard');
  const navigate = useNavigate();
  
  const [userObj, setUserObj] = useState(() => {
    const saved = localStorage.getItem('userObj');
    console.log("LOG: Initializing userObj from localStorage:", saved);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.status === 'success' || parsed.id ? parsed : null;
    } catch (error) {
      console.error("LOG ERROR: Failed to parse userObj:", error);
      return null;
    }
  });

  const displayHeaderName =
    userObj?.delivery_partner?.name ||
    userObj?.name ||
    "Delivery Partner";

  useEffect(() => {
    console.log("LOG: Auth Security Check - userObj state:", userObj);
    if (!userObj) {
      console.warn("LOG: No user found, redirecting to login");
      navigate('/login');
      return;
    }
    if (!userObj.delivery_partner && !userObj.is_delivery_person) {
      console.error("LOG: Access Denied. User is not a delivery partner.");
      alert("Access Denied");
      navigate('/');
    }
  }, [userObj, navigate]);

  if (!userObj) return null;

  const handleLogout = () => {
    console.log("LOG: Logout button clicked. Clearing localStorage.");
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashIcon /> },
    { text: 'Assigned Orders', icon: <AssignmentIcon /> },
    { text: 'Profile', icon: <AccountCircle /> },
     { text: 'Add Delivery Person', icon: <EditIcon /> } 
  ];

  const renderContent = () => {
    console.log("LOG: Rendering Content for Tab ->", activeTab);
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardHome userObj={userObj} />;
      case 'Assigned Orders':
        return <AssignedOrdersView userObj={userObj} />;
      case 'Profile':
        return <ProfileView userObj={userObj} setUserObj={setUserObj} />;
      case 'Add Delivery Person':
  return <AddDeliveryPerson />;

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
            Delivery Partner Panel
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountCircle />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {displayHeaderName}
            </Typography>
          </Box>
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
                    console.log("LOG: Navigation Tab Changed to:", item.text);
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

// --- DASHBOARD HOME COMPONENT ---
const DashboardHome = ({ userObj }) => {
  const [allDeliveryPersons, setAllDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllDeliveryPersons = async () => {
      console.log("LOG: DashboardHome -> API Call: Fetching all delivery partners");
      try {
        const response = await axios.get(`${API_BASE_URL}/delivery/`);
        const data = response.data;
        console.log("LOG: DashboardHome -> Raw API Data:", data);

        const deliveryPersons = (data.delivery_persons || data || []).map(p => ({
          id: p.id,
          name: p.name,
          mobile: p.mobile,
          vehicle: p.vehicle || p.vehicle,
          address: p.address,
          isAvailable: p.is_available
        }));

        setAllDeliveryPersons(deliveryPersons);
        console.log("LOG: DashboardHome -> Processed delivery partners count:", deliveryPersons.length);
      } catch (err) {
        console.error("LOG ERROR: DashboardHome -> Fetch failure", err);
        setAllDeliveryPersons([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllDeliveryPersons();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        All Delivery Partners
      </Typography>

      <Grid container spacing={3}>
        {allDeliveryPersons.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}>
              <Typography color="text.secondary">No delivery partners found</Typography>
            </Paper>
          </Grid>
        ) : (
          allDeliveryPersons.map((person, index) => (
            <Grid item xs={12} sm={6} md={4} key={person.id || index}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #1a237e' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
                    {person.name?.charAt(0) || 'D'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                      {person.name || 'Delivery Partner'}
                    </Typography>
                    <Chip 
                      label={person.isAvailable ? 'Available' : 'Unavailable'} 
                      size="small" 
                      color={person.isAvailable ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">ID: {person.id}</Typography>
                <Typography variant="body2" color="text.secondary">Mobile: {person.mobile || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary">Vehicle: {person.vehicle || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary">Location: {person.address || 'N/A'}</Typography>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

// --- ASSIGNED ORDERS VIEW COMPONENT ---
const AssignedOrdersView = ({ userObj }) => {
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      const partnerId = userObj.delivery_partner?.id || userObj.id;
      console.log("LOG: AssignedOrdersView -> Fetching orders for Partner ID:", partnerId);
      try {
        const response = await axios.get(`${API_BASE_URL}/delivery/${partnerId}`);
        setAssignedOrders(response.data.assigned_orders || []);
        console.log("LOG: AssignedOrdersView -> Orders received:", response.data.assigned_orders?.length || 0);
      } catch (err) {
        console.error("LOG ERROR: AssignedOrdersView -> Fetch failure", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedOrders();
  }, [userObj]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    console.log(`LOG: AssignedOrdersView -> Updating Order ${orderId} to status: ${newStatus}`);
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
      setAssignedOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      console.log("LOG: AssignedOrdersView -> Status update successful in UI and DB");
      alert(`Order status updated to ${newStatus}!`);
    } catch (err) {
      console.error("LOG ERROR: AssignedOrdersView -> Update failure", err);
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  const activeOrders = assignedOrders.filter(o => o.status !== 'Delivered');
  const completedOrders = assignedOrders.filter(o => o.status === 'Delivered');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>
        My Assigned Orders
      </Typography>

      <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f', fontWeight: 'bold' }}>Active Deliveries</Typography>
      {activeOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4, bgcolor: '#fff5f5' }}>
          <Typography color="text.secondary">No active deliveries</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {activeOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Paper elevation={3} sx={{ p: 3, borderLeft: '6px solid #d32f2f' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Typography variant="h6">Order #{order.id}</Typography>
                      <Chip label={order.status || 'Pending'} color="warning" size="small" />
                    </Box>
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <RestaurantIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body1">{order.restaurant_name}</Typography>
                    </Box>
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body1">{order.delivery_address}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body1">{order.customer_mobile}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" color="primary" fontWeight="bold">₹{order.total_amount || '0.00'}</Typography>
                    <Button 
                      variant="contained" color="success" sx={{ mt: 2 }}
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                    >
                      {actionLoading ? <CircularProgress size={20} /> : "Mark Delivered"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>Completed Deliveries</Typography>
      <Grid container spacing={2}>
        {completedOrders.map((order) => (
          <Grid item xs={12} key={order.id}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#f9f9f9' }}>
              <Box>
                <Typography variant="body1" fontWeight="bold">Order #{order.id}</Typography>
                <Typography variant="caption">{order.delivery_address}</Typography>
              </Box>
              <Typography variant="body1" fontWeight="bold" color="success.main">₹{order.total_amount}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// --- PROFILE VIEW COMPONENT ---
const ProfileView = ({ userObj }) => {
   console.log("LOG: ProfileView rendered");
  console.log("LOG: ProfileView received userObj:", userObj);
  const profile = userObj?.delivery_partner || userObj || {};
 console.log("LOG: ProfileView resolved profile object:", profile);
  const InfoRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', mb: 2 }}>
      <Typography sx={{ width: 180, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 500 }}>
        {value || 'N/A'}
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}
      >
        My Profile
      </Typography>

      <Paper
        elevation={3}
        sx={{ p: 4, maxWidth: 800, mx: 'auto', borderRadius: 3 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar
            src={
              profile.delivery_pic
                ? `${API_BASE_URL}/${profile.delivery_pic}`
                : ""
            }
            sx={{ width: 100, height: 100, bgcolor: '#1a237e' }}
          >
            {profile.name?.charAt(0) || 'U'}
          </Avatar>

          <Box>
            <Typography variant="h5" fontWeight="bold">
              {profile.name || 'N/A'}
            </Typography>
            <Typography color="text.secondary">
              {userObj?.email || profile.email || 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Details */}
        <InfoRow label="Mobile Number" value={profile.mobile} />
        <InfoRow label="Vehicle Type" value={profile.vehicle} />
        <InfoRow label="Availability" value={profile.is_available ? 'Available' : 'Unavailable'} />
      </Paper>
    </Box>
  );
};

const AddDeliveryPerson = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    vehicle: '',
    address: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        payload.append(key, value)
      );
      if (image) payload.append('delivery_person_profile', image);

      await axios.post(`${API_BASE_URL}/delivery/add`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("Delivery person added successfully!");
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: '',
        vehicle: '',
        address: ''
      });
      setImage(null);
    } catch (err) {
      console.error("Add delivery person error:", err);
      alert("Failed to add delivery person");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Add Delivery Person
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth type="password" label="Password" name="password" value={formData.password} onChange={handleChange} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Vehicle" name="vehicle" value={formData.vehicle} onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <Button component="label" variant="outlined">
            Upload Profile Image
            <input hidden type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={22} /> : "Add Delivery Person"}
        </Button>
      </Box>
    </Paper>
  );
};

export default DeliveryDashboard;