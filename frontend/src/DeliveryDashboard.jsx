import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline, Avatar, TextField, Paper, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, Button, ListItemText, Divider, Container, Grid, Chip, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashIcon, Edit as EditIcon, Delete as DeleteIcon, Assignment as AssignmentIcon, 
  AccountCircle, ExitToApp, Restaurant as RestaurantIcon, Phone as PhoneIcon, LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;
const API_BASE_URL = "http://127.0.0.1:8000";

const resolveImageUrl = (url) => {
  console.log("DeliveryDashboard: resolveImageUrl called with:", url);
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;
  const fullUrl = `${API_BASE_URL}/${cleanPath}`;
  console.log("DeliveryDashboard: resolveImageUrl resolved to:", fullUrl);
  return fullUrl;
};

const DeliveryDashboard = () => {
  console.log("=== DeliveryDashboard: Component Rendering ===");
  const [activeTab, setActiveTab] = useState('Dashboard');
  const navigate = useNavigate();
  
  const [userObj, setUserObj] = useState(() => {
    const saved = localStorage.getItem('userObj');
    console.log("DeliveryDashboard: Initializing userObj from localStorage:", saved);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      console.log("DeliveryDashboard: Parsed userObj:", parsed);
      return parsed.status === 'success' ? parsed : null;
    } catch (error) {
      console.error("DeliveryDashboard: Failed to parse userObj:", error);
      return null;
    }
  });

  const displayHeaderName = userObj?.delivery_partner?.name || userObj?.name || "Delivery Partner";
  console.log("DeliveryDashboard: Display header name:", displayHeaderName);

  useEffect(() => {
    console.log("DeliveryDashboard: useEffect - Checking authentication");
    if (!userObj) {
      console.log("DeliveryDashboard: No userObj found, redirecting to login");
      navigate('/login');
      return;
    }
    if (userObj.role !== 'delivery_person') {
      console.log("DeliveryDashboard: Invalid role, access denied");
      alert("Access Denied");
      navigate('/');
    }
  }, [userObj, navigate]);

  if (!userObj) {
    console.log("DeliveryDashboard: userObj is null, rendering nothing");
    return null;
  }

  const handleLogout = () => {
    console.log("DeliveryDashboard: Logout initiated");
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashIcon /> },
    { text: 'My Deliveries', icon: <AssignmentIcon /> },
    { text: 'Profile', icon: <AccountCircle /> },
    { text: 'Add Delivery Person', icon: <PersonIcon /> }
  ];

  const renderContent = () => {
    console.log("DeliveryDashboard: Rendering content for tab:", activeTab);
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardHome userObj={userObj} />;
      case 'My Deliveries':
        return <MyDeliveriesView userObj={userObj} />;
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
                    console.log("DeliveryDashboard: Tab clicked:", item.text);
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
  console.log("=== DashboardHome: Component Rendering ===");
  console.log("DashboardHome: userObj received:", userObj);
  
  const [allDeliveryPersons, setAllDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("DashboardHome: useEffect - Fetching all delivery partners");
    const fetchAllDeliveryPersons = async () => {
      console.log("DashboardHome: API Call - GET /delivery/");
      try {
        const response = await axios.get(`${API_BASE_URL}/delivery/`);
        console.log("DashboardHome: API Response:", response.data);

        const deliveryPersons = (response.data.delivery_persons || []).map(p => {
          const processed = {
            id: p.id,
            name: p.name,
            email: p.email,
            mobile: p.mobile,
            vehicle: p.vehicle,
            address: p.address,
            isAvailable: p.is_available,
            profile_picture: p.profile_picture
          };
          console.log("DashboardHome: Processed delivery partner:", processed);
          return processed;
        });

        setAllDeliveryPersons(deliveryPersons);
        console.log("DashboardHome: Total delivery partners loaded:", deliveryPersons.length);
      } catch (err) {
        console.error("DashboardHome: Fetch error:", err);
        console.error("DashboardHome: Error details:", err.response?.data);
        setAllDeliveryPersons([]);
      } finally {
        setLoading(false);
        console.log("DashboardHome: Fetch completed");
      }
    };
    fetchAllDeliveryPersons();
  }, []);

  if (loading) {
    console.log("DashboardHome: Rendering loading spinner");
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

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
          allDeliveryPersons.map((person, index) => {
            console.log("DashboardHome: Rendering delivery partner:", person.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={person.id || index}>
                <Paper elevation={2} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #1a237e' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      src={resolveImageUrl(person.profile_picture)}
                      sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}
                    >
                      {person.name?.charAt(0) || 'D'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {person.name || 'Delivery Partner'}
                      </Typography>
                      <Chip 
                        label={person.isAvailable ? 'Available' : 'On Delivery'} 
                        size="small" 
                        color={person.isAvailable ? 'success' : 'warning'}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>ID:</strong> {person.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Mobile:</strong> {person.mobile || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Vehicle:</strong> {person.vehicle || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Location:</strong> {person.address || 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
            );
          })
        )}
      </Grid>
    </Box>
  );
};

// --- MY DELIVERIES VIEW COMPONENT ---
// --- MY DELIVERIES VIEW COMPONENT - FIXED ---
const MyDeliveriesView = ({ userObj }) => {
  console.log("=== MyDeliveriesView: Component Rendering ===");
  console.log("MyDeliveriesView: userObj received:", userObj);
  
  const [myOrders, setMyOrders] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const partnerId = userObj?.delivery_partner?.id || userObj?.id;
  console.log("MyDeliveriesView: Resolved Partner ID:", partnerId);

  const fetchMyOrders = async () => {
    console.log("MyDeliveriesView: fetchMyOrders called");
    if (!partnerId) {
      console.log("MyDeliveriesView: No partner ID found, stopping fetch");
      setLoading(false);
      return;
    }

    console.log("MyDeliveriesView: Starting data fetch for partner ID:", partnerId);
    try {
      // Step 1: Fetch all restaurants
      console.log("MyDeliveriesView: Step 1 - Fetching all restaurants");
      const restaurantsResponse = await axios.get(`${API_BASE_URL}/restaurants/`);
      console.log("MyDeliveriesView: Restaurants response:", restaurantsResponse.data);
      
      const restaurants = restaurantsResponse.data.restaurants || [];
      setAllRestaurants(restaurants);
      console.log("MyDeliveriesView: Total restaurants found:", restaurants.length);

      // Step 2: Fetch orders from each restaurant
      console.log("MyDeliveriesView: Step 2 - Fetching orders from each restaurant");
      let allOrders = [];
      
      for (const restaurant of restaurants) {
        console.log(`MyDeliveriesView: Fetching orders for restaurant ID: ${restaurant.id} (${restaurant.name})`);
        try {
          const ordersResponse = await axios.get(`${API_BASE_URL}/orders/restaurant/${restaurant.id}`);
          console.log(`MyDeliveriesView: Orders from ${restaurant.name}:`, ordersResponse.data);
          
          if (ordersResponse.data.orders) {
            allOrders = [...allOrders, ...ordersResponse.data.orders];
            console.log(`MyDeliveriesView: Added ${ordersResponse.data.orders.length} orders from ${restaurant.name}`);
          }
        } catch (err) {
          console.error(`MyDeliveriesView: Failed to fetch orders from restaurant ${restaurant.id}:`, err);
        }
      }

      console.log("MyDeliveriesView: Total orders fetched from all restaurants:", allOrders.length);

      // Step 3: Filter orders assigned to this delivery partner
      console.log("MyDeliveriesView: Step 3 - Filtering orders for partner ID:", partnerId);
      const myAssignedOrders = allOrders.filter(order => {
        const isAssigned = order.delivery_partner_id === partnerId;
        if (isAssigned) {
          console.log(`MyDeliveriesView: Order ${order.order_id} is assigned to partner ${partnerId}`);
        }
        return isAssigned;
      });

      console.log("MyDeliveriesView: Total orders assigned to this partner:", myAssignedOrders.length);

      // Step 4: Format the orders
      console.log("MyDeliveriesView: Step 4 - Formatting orders");
      const formattedOrders = myAssignedOrders.map(o => {
        const formatted = {
          id: o.order_id,
          status: o.status,
          totalAmount: o.total_amount,
          createdAt: o.created_at,
          date: o.date,
          orderImage: o.order_image,
          deliveryPartnerId: o.delivery_partner_id,
          
          // Restaurant info
          restaurantId: o.restaurant?.id,
          restaurantName: o.restaurant?.name || 'Unknown Restaurant',
          restaurantAddress: o.restaurant?.address || 'N/A',
          
          // User/Customer info
          userId: o.user?.id,
          userName: o.user?.name || 'Customer',
          userAddress: o.user?.address || 'N/A',
          userMobile: o.user?.mobile || 'N/A',
          
          // Order items
          items: o.items?.map(item => ({
            id: item.menu_id,
            name: item.menu_item_name,
            quantity: item.quantity,
            menu_item_pic: item.menu_item_pic
          })) || []
        };
        
        console.log("MyDeliveriesView: Formatted order:", formatted);
        return formatted;
      });

      setMyOrders(formattedOrders);
      console.log("MyDeliveriesView: Successfully set orders in state");

    } catch (err) {
      console.error("MyDeliveriesView: Fatal fetch error:", err);
      console.error("MyDeliveriesView: Error details:", err.response?.data);
      setMyOrders([]);
    } finally {
      setLoading(false);
      console.log("MyDeliveriesView: Fetch process completed");
    }
  };

  useEffect(() => {
    console.log("MyDeliveriesView: useEffect triggered - Initial fetch");
    fetchMyOrders();
  }, [partnerId]);

  const handleMarkDelivered = async (orderId) => {
    console.log("MyDeliveriesView: handleMarkDelivered called for order:", orderId);
    
    if (!window.confirm("Mark this order as delivered?")) {
      console.log("MyDeliveriesView: Delivery confirmation cancelled by user");
      return;
    }

    setActionLoading(true);
    console.log("MyDeliveriesView: Setting order status to DELIVERED");
    
    try {
      console.log(`MyDeliveriesView: Sending PUT request to /orders/${orderId}/status`);
      const response = await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        null,
        { params: { status: 'DELIVERED' } }
      );
      console.log("MyDeliveriesView: Status update response:", response.data);

      console.log("MyDeliveriesView: Refreshing orders list after delivery");
      await fetchMyOrders();
      
      console.log("MyDeliveriesView: Order marked as delivered successfully");
      alert("Order marked as delivered!");
      
    } catch (err) {
      console.error("MyDeliveriesView: Failed to update status:", err);
      console.error("MyDeliveriesView: Error response:", err.response?.data);
      alert("Failed to update status. Please try again.");
    } finally {
      setActionLoading(false);
      console.log("MyDeliveriesView: Action completed");
    }
  };

  if (loading) {
    console.log("MyDeliveriesView: Rendering loading state");
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Loading your deliveries...
          </Typography>
        </Box>
      </Box>
    );
  }

  const activeOrders = myOrders.filter(o => o.status !== 'DELIVERED');
  const completedOrders = myOrders.filter(o => o.status === 'DELIVERED');
  
  console.log("MyDeliveriesView: Active orders count:", activeOrders.length);
  console.log("MyDeliveriesView: Completed orders count:", completedOrders.length);
  console.log("MyDeliveriesView: Active orders:", activeOrders);
  console.log("MyDeliveriesView: Completed orders:", completedOrders);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>
        My Deliveries
      </Typography>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, bgcolor: '#fff5f5', borderLeft: '4px solid #d32f2f' }}>
            <Typography variant="h6" color="#d32f2f" fontWeight="bold">
              {activeOrders.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Deliveries
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, bgcolor: '#f1f8e9', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {completedOrders.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed Deliveries
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Active Deliveries */}
      <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f', fontWeight: 'bold' }}>
        Active Deliveries
      </Typography>
      
      {activeOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4, bgcolor: '#fff5f5' }}>
          <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            No active deliveries assigned to you at the moment.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Orders will appear here once a restaurant assigns them to you.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {activeOrders.map((order, index) => {
            console.log(`MyDeliveriesView: Rendering active order ${index + 1}:`, order.id);
            return (
              <Grid item xs={12} key={order.id}>
                <Paper elevation={3} sx={{ p: 3, borderLeft: '6px solid #d32f2f', position: 'relative' }}>
                  
                  {/* Order Badge */}
                  <Chip 
                    label={`Order ${index + 1} of ${activeOrders.length}`} 
                    size="small" 
                    sx={{ position: 'absolute', top: 10, right: 10, bgcolor: '#1a237e', color: 'white' }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <Typography variant="h6">Order #{order.id}</Typography>
                        <Chip label={order.status} color="warning" size="small" />
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Restaurant Info */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1a237e' }}>
                        📦 Pickup From:
                      </Typography>
                      <Box sx={{ mb: 2, pl: 2, bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <RestaurantIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="body2" fontWeight="bold">{order.restaurantName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">{order.restaurantAddress}</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Customer Info */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1a237e' }}>
                        🏠 Deliver To:
                      </Typography>
                      <Box sx={{ pl: 2, bgcolor: '#e8f5e9', p: 1.5, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <AccountCircle sx={{ mr: 1, fontSize: 18, color: 'success.main' }} />
                          <Typography variant="body2" fontWeight="bold">{order.userName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <LocationIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">{order.userAddress}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="500">{order.userMobile}</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Order Items */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1a237e' }}>
                        🍽️ Items:
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => {
                            console.log(`MyDeliveriesView: Rendering item ${idx + 1} for order ${order.id}:`, item);
                            return (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                                <Avatar 
                                  src={resolveImageUrl(item.menu_item_pic)}
                                  variant="rounded" 
                                  sx={{ width: 40, height: 40 }}
                                />
                                <Typography variant="body2">
                                  <strong>{item.quantity}x</strong> {item.name}
                                </Typography>
                              </Box>
                            );
                          })
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No items listed
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4} sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Amount
                        </Typography>
                        <Typography variant="h4" color="primary" fontWeight="bold">
                          ₹{order.totalAmount}
                        </Typography>
                        
                        {order.date && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Order Date: {new Date(order.date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="success" 
                        fullWidth
                        size="large"
                        sx={{ mt: 3 }}
                        disabled={actionLoading}
                        onClick={() => {
                          console.log("MyDeliveriesView: Mark Delivered button clicked for order:", order.id);
                          handleMarkDelivered(order.id);
                        }}
                      >
                        {actionLoading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "✓ Mark as Delivered"
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Completed Deliveries */}
      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>
        Completed Deliveries
      </Typography>
      
      {completedOrders.length === 0 ? (
        <Typography variant="body2" sx={{ ml: 2, color: 'gray', fontStyle: 'italic' }}>
          No completed deliveries yet.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {completedOrders.map((order, index) => {
            console.log(`MyDeliveriesView: Rendering completed order ${index + 1}:`, order.id);
            return (
              <Grid item xs={12} key={order.id}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', borderLeft: '4px solid #4caf50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        Order #{order.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.userName} • {order.userAddress}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          icon={<RestaurantIcon />} 
                          label={order.restaurantName} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        ₹{order.totalAmount}
                      </Typography>
                      <Chip label="✓ Delivered" size="small" color="success" sx={{ mt: 1 }} />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

// --- PROFILE VIEW COMPONENT ---
const ProfileView = ({ userObj, setUserObj }) => {
  console.log("=== ProfileView: Component Rendering ===");
  console.log("ProfileView: userObj received:", userObj);
  
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const profile = userObj?.delivery_partner || {};
  console.log("ProfileView: Resolved profile:", profile);

  const [editData, setEditData] = useState({
    name: profile.name || '',
    mobile: profile.mobile || '',
    address: profile.address || '',
    vehicle: profile.vehicle || '',
    newPassword: ''
  });

  useEffect(() => {
    console.log("ProfileView: useEffect - Fetching latest profile");
    const fetchLatestProfile = async () => {
      if (!profile.id) {
        console.log("ProfileView: No profile ID found");
        return;
      }

      console.log("ProfileView: Fetching profile for delivery partner ID:", profile.id);
      try {
        const res = await axios.get(`${API_BASE_URL}/delivery/${profile.id}`);
        console.log("ProfileView: Profile response:", res.data);
        
        const latestData = res.data.delivery_partner || res.data;

        setEditData({
          name: latestData.name || '',
          mobile: latestData.mobile || '',
          address: latestData.address || '',
          vehicle: latestData.vehicle || '',
          newPassword: ''
        });
        console.log("ProfileView: Profile data updated in state");

        const updatedUser = {
          ...userObj,
          delivery_partner: {
            ...userObj.delivery_partner,
            ...latestData
          }
        };
        localStorage.setItem('userObj', JSON.stringify(updatedUser));
        console.log("ProfileView: localStorage updated");
      } catch (err) {
        console.error("ProfileView: Failed to sync profile:", err);
      }
    };

    fetchLatestProfile();
  }, [profile.id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("ProfileView: Image file selected:", file.name);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    console.log("ProfileView: handleUpdateProfile called");
    console.log("ProfileView: Update data:", editData);
    
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('mobile', editData.mobile);
      formData.append('address', editData.address);
      formData.append('vehicle', editData.vehicle);
      
      if (editData.newPassword) {
        console.log("ProfileView: Including new password in update");
        formData.append('password', editData.newPassword);
      }
      if (selectedFile) {
        console.log("ProfileView: Including new image in update");
        formData.append('delivery_person_profile', selectedFile);
      }

      console.log("ProfileView: Submitting update to API");
      const response = await axios.put(
        `${API_BASE_URL}/delivery/${profile.id}/update`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log("ProfileView: Update response:", response.data);
      alert("Profile updated successfully!");
      setIsEditing(false);
      setPreviewUrl(null);
      window.location.reload();
      
    } catch (err) {
      console.error("ProfileView: Update error:", err);
      console.error("ProfileView: Error details:", err.response?.data);
      alert(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    console.log("ProfileView: handleDeleteAccount called");
    const confirmDelete = window.confirm("Are you sure? This will permanently delete your account.");
    if (confirmDelete) {
      console.log("ProfileView: User confirmed deletion");
      try {
        await axios.delete(`${API_BASE_URL}/delivery/${profile.id}`);
        console.log("ProfileView: Account deleted successfully");
        localStorage.clear();
        alert("Account deleted.");
        navigate('/login');
      } catch (err) {
        console.error("ProfileView: Delete error:", err);
        alert("Could not delete account.");
      }
    } else {
      console.log("ProfileView: Deletion cancelled");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>
        My Profile
      </Typography>
      
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar 
              src={previewUrl || (profile.delivery_person_profile 
                ? `${API_BASE_URL}/${profile.delivery_person_profile}` 
                : "")}
              sx={{ width: 120, height: 120, bgcolor: '#1a237e', fontSize: '3rem', border: '4px solid #fff', boxShadow: 2 }}
            >
              {!previewUrl && !profile.delivery_person_profile && (profile.name?.charAt(0) || "D")}
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
              <Typography variant="h5" fontWeight="bold">{editData.name || "Delivery Partner"}</Typography>
              <Typography color="text.secondary">{userObj?.email || profile.email || "Email not found"}</Typography>
              <Chip 
                label={profile.is_available ? "Available" : "On Delivery"} 
                color={profile.is_available ? "success" : "warning"} 
                size="small" 
                sx={{ mt: 1 }} 
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">MOBILE NUMBER</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.mobile} onChange={(e) => {
                  console.log("ProfileView: Mobile changed to:", e.target.value);
                  setEditData({...editData, mobile: e.target.value});
                }} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.mobile || "Not Provided"}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">VEHICLE TYPE</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" value={editData.vehicle} onChange={(e) => {
                  console.log("ProfileView: Vehicle changed to:", e.target.value);
                  setEditData({...editData, vehicle: e.target.value});
                }} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.vehicle || "Not Provided"}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="gray">AVAILABILITY</Typography>
              <Typography variant="body1" fontWeight="500">
                {profile.is_available ? "Available for Deliveries" : "Currently on Delivery"}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="gray">ADDRESS</Typography>
              {isEditing ? (
                <TextField fullWidth size="small" multiline rows={2} value={editData.address} onChange={(e) => {
                  console.log("ProfileView: Address changed to:", e.target.value);
                  setEditData({...editData, address: e.target.value});
                }} />
              ) : (
                <Typography variant="body1" fontWeight="500">{editData.address || "No Address on file"}</Typography>
              )}
            </Grid>

            {isEditing && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="primary">UPDATE PASSWORD</Typography>
                <TextField fullWidth type="password" size="small" placeholder="New Password" value={editData.newPassword} onChange={(e) => {
                  console.log("ProfileView: New password entered");
                  setEditData({...editData, newPassword: e.target.value});
                }} sx={{ mt: 1 }} />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <>
                <Button variant="contained" startIcon={<EditIcon />} sx={{ bgcolor: '#1a237e' }} onClick={() => {
                  console.log("ProfileView: Edit mode enabled");
                  setIsEditing(true);
                }}>
                  Edit Profile
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" color="success" onClick={handleUpdateProfile}>Save Changes</Button>
                <Button variant="text" color="inherit" onClick={() => {
                  console.log("ProfileView: Edit cancelled");
                  setIsEditing(false);
                  setPreviewUrl(null);
                }}>
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

// --- ADD DELIVERY PERSON COMPONENT ---
const AddDeliveryPerson = () => {
  console.log("=== AddDeliveryPerson: Component Rendering ===");
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    vehicle: 'Bike',
    address: ''
  });
  const [image, setImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`AddDeliveryPerson: Form field changed - ${name}: ${value}`);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("AddDeliveryPerson: Form submission started");
    console.log("AddDeliveryPerson: Form data:", formData);
    
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('mobile', formData.mobile);
      payload.append('password', formData.password);
      payload.append('vehicle', formData.vehicle);
      payload.append('address', formData.address);
      
      if (image) {
        console.log("AddDeliveryPerson: Appending image file:", image.name);
        payload.append('delivery_person_profile', image);
      }

      console.log("AddDeliveryPerson: Submitting to API...");
      const response = await axios.post(`${API_BASE_URL}/delivery/add`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("AddDeliveryPerson: API response:", response.data);
      alert("Delivery person added successfully!");
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: '',
        vehicle: 'Bike',
        address: ''
      });
      setImage(null);
      setSelectedFileName("");
      console.log("AddDeliveryPerson: Form reset completed");
      
    } catch (err) {
      console.error("AddDeliveryPerson: Submission error:", err);
      console.error("AddDeliveryPerson: Error details:", err.response?.data);
      alert(err.response?.data?.message || "Failed to add delivery person");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
          Add New Delivery Person
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Full Name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Email" 
                type="email"
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Mobile Number" 
                name="mobile" 
                value={formData.mobile} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                type="password" 
                label="Password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Vehicle Type" 
                name="vehicle" 
                value={formData.vehicle} 
                onChange={handleChange}
                placeholder="e.g., Bike, Scooter, Car"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Address" 
                name="address" 
                value={formData.address} 
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button component="label" variant="outlined" fullWidth>
                Upload Profile Image
                <input 
                  hidden 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImage(file);
                      setSelectedFileName(file.name);
                      console.log("AddDeliveryPerson: File selected:", file.name);
                    }
                  }} 
                />
              </Button>
              {selectedFileName && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Selected file: {selectedFileName}
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ bgcolor: '#1a237e', py: 1.5, fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Add Delivery Person"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default DeliveryDashboard;