import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Divider } from '@mui/material';
import { api } from './api';

const UserDashboard = ({ onLogout }) => {
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    // FIX: Calling /restaurants/ instead of /menu
    api.get('/restaurants/')
      .then(res => {
        if (res.data.status === "success") {
          const items = [];
          res.data.restaurants.forEach(r => {
            Object.keys(r.menu||{}).forEach(cat => {
              r.menu[cat].forEach(item => {
                items.push({ ...item, r_id: r.id, category: cat });
              });
            });
          });
          setMenu(items);
        }
      });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#1a237e' }}>Menu Items</Typography>
      <Grid container spacing={2}>
        {menu.map((item) => (
          // FIX: Unique key combination
          <Grid key={`${item.r_id}-${item.item_id}`} item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography color="primary">₹{item.price}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserDashboard;