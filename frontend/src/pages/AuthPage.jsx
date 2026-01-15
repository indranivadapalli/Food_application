import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Tabs, Tab, TextField, Button, Typography, Alert, Stack, InputAdornment } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import API from '../api'; 
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const navigate = useNavigate();
  const errorRef = useRef(null);
  const [roleIdx, setRoleIdx] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const roles = ['user', 'restaurant', 'delivery_person'];

  const v = {
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    num: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };

  const isPasswordValid = v.len && v.upper && v.lower && v.num && v.special;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log("=== AUTH ATTEMPT STARTED ===");
    const emailValue = e.target.email.value;
    const currentRole = roles[roleIdx];
    
    console.log("AuthPage: Mode:", isLogin ? "Login" : "Register");
    console.log("AuthPage: Role selected:", currentRole);
    console.log("AuthPage: Email:", emailValue);

    let endpoint = "";
    let dashboardRoute = "";
    
    if (currentRole === 'restaurant') {
      endpoint = isLogin ? "/restaurants/login" : "/restaurants/register";
      dashboardRoute = "restaurant-dashboard";
    } else if (currentRole === 'delivery_person') {
      endpoint = isLogin ? "/delivery/login" : "/delivery/register";
      dashboardRoute = "delivery-dashboard";
    } else {
      endpoint = isLogin ? "/users/login" : "/users/register";
      dashboardRoute = "user-dashboard";
    }
    
    console.log("AuthPage: Target Endpoint:", endpoint);
    console.log("AuthPage: Dashboard Route:", dashboardRoute);

    try {
      let response;
      
      if (isLogin) {
        console.log("AuthPage: Preparing LOGIN request");
        const formData = new URLSearchParams();
        formData.append('email', emailValue); 
        formData.append('password', password);
        
        // Only append role for user login (not for restaurant or delivery)
        if (currentRole === 'user') {
          formData.append('role', currentRole);
        }

        console.log("AuthPage: Login Form Data:");
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}: ${value}`);
        }
        
        response = await API.post(endpoint, formData);
        console.log("AuthPage: Login Response received:", response.data);
        
        if (response.data.status === 'success') {
          console.log("AuthPage: Login successful!");
          
          // Create a properly structured userObj based on role
          let userObj = {
            status: 'success',
            role: currentRole,
            email: emailValue
          };

          if (currentRole === 'restaurant') {
            console.log("AuthPage: Structuring restaurant user object");
            userObj.restaurant = response.data.restaurant;
            console.log("AuthPage: Restaurant data:", userObj.restaurant);
          } else if (currentRole === 'delivery_person') {
            console.log("AuthPage: Structuring delivery partner user object");
            userObj.delivery_partner = response.data.delivery_partner;
            console.log("AuthPage: Delivery partner data:", userObj.delivery_partner);
          } else {
            console.log("AuthPage: Structuring user object");
            userObj.user = response.data.user;
            console.log("AuthPage: User data:", userObj.user);
          }
          
          console.log("AuthPage: Final userObj to be stored:", userObj);
          localStorage.setItem('userObj', JSON.stringify(userObj));
          localStorage.setItem('role', currentRole);
          
          console.log("AuthPage: Navigating to:", `/${dashboardRoute}`);
          navigate(`/${dashboardRoute}`);
          return;
        } else {
          console.error("AuthPage: Login rejected:", response.data.message);
          setError(response.data.message || "Invalid email or password");
          return;
        }
        
      } else {
        // REGISTRATION
        console.log("AuthPage: Preparing REGISTRATION request");
        console.log("AuthPage: Validating password requirements...");
        console.table({ isPasswordValid, passwordsMatch });

        if (!passwordsMatch || !isPasswordValid) {
          console.error("AuthPage: Validation Failed - Password requirements not met");
          setError("Please ensure password requirements are met.");
          return;
        }

        const formData = new FormData();
        formData.append("name", e.target.name.value);
        formData.append("email", emailValue);
        formData.append("mobile", e.target.mobile.value);
        formData.append("address", e.target.address.value);
        formData.append("password", password);
        formData.append("confirm_password", confirmPassword);
        
        // Only append role for user registration
        if (currentRole === 'user') {
          formData.append("role", currentRole);
        }
        
        // Add vehicle for delivery registration
        if (currentRole === 'delivery_person' && e.target.vehicle) {
          formData.append("vehicle", e.target.vehicle.value);
        }
        
        console.log("AuthPage: Registration Form Data:");
        for (let pair of formData.entries()) {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }

        response = await API.post(endpoint, formData);
        console.log("AuthPage: Registration Response received:", response.data);

        if (response.data.status === "error") {
          console.error("AuthPage: Registration rejected:", response.data.message);
          setError(response.data.message || "Registration failed.");
          return;
        }

        console.log("AuthPage: Registration successful!");
        
        // Create properly structured userObj for registration
        let userObj = {
          status: 'success',
          role: currentRole,
          email: emailValue
        };

        if (currentRole === 'restaurant') {
          console.log("AuthPage: Structuring restaurant registration object");
          userObj.restaurant = response.data.restaurant || { 
            id: response.data.restaurant_id, 
            name: e.target.name.value,
            email: emailValue 
          };
          console.log("AuthPage: Restaurant data:", userObj.restaurant);
        } else if (currentRole === 'delivery_person') {
          console.log("AuthPage: Structuring delivery partner registration object");
          userObj.delivery_partner = response.data.delivery_partner || { 
            id: response.data.delivery_partner_id, 
            name: e.target.name.value,
            email: emailValue 
          };
          console.log("AuthPage: Delivery partner data:", userObj.delivery_partner);
        } else {
          console.log("AuthPage: Structuring user registration object");
          userObj.user = response.data.user || { 
            id: response.data.user_id, 
            name: e.target.name.value,
            email: emailValue 
          };
          console.log("AuthPage: User data:", userObj.user);
        }

        console.log("AuthPage: Final userObj to be stored:", userObj);
        localStorage.setItem('userObj', JSON.stringify(userObj));
        localStorage.setItem('role', currentRole);
        
        console.log("AuthPage: Navigating to:", `/${dashboardRoute}`);
        navigate(`/${dashboardRoute}`);
      }

    } catch (err) {
      console.error("=== AUTH ATTEMPT FAILED ===");
      if (err.response) {
        console.error("AuthPage: Response Status:", err.response.status);
        console.error("AuthPage: Response Data:", err.response.data);
        
        const detail = err.response.data.detail;
        const msg = Array.isArray(detail) 
          ? detail.map(d => `${d.loc ? d.loc[1] : 'Error'}: ${d.msg}`).join(", ") 
          : (detail || err.response.data.message || "Auth Failed");
        
        console.error("AuthPage: Formatted Error Message:", msg);
        setError(msg);
      } else {
        console.error("AuthPage: Network or Connection Error:", err.message);
        setError("Server connection failed.");
      }
    }
  };
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 5 }}>
      <Paper elevation={3} sx={{ p: 4, width: 450, borderRadius: 4, border: '1px solid #ddd' }}>
        <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </Typography>

        <Tabs
          value={roleIdx}
          onChange={(e, val) => {
            console.log("AuthPage: Tab changed to role index:", val, "Role:", roles[val]);
            setRoleIdx(val);
            setError('');
            setPassword('');
            setConfirmPassword('');
          }}
          centered
          sx={{ mb: 2 }}
        >
          <Tab label="USER" />
          <Tab label="RESTAURANT" />
          <Tab label="DELIVERY" />
        </Tabs>

        {error && (
          <Box ref={errorRef} sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField fullWidth name="email" label="Email" type="email" variant="outlined" required />
            
            <Box>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type="password"
                variant="outlined"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {!isLogin && (
                <Box sx={{ mt: 1, ml: 1 }}>
                  <Typography variant="caption" sx={{ color: v.len ? 'green' : 'gray', display: 'block' }}>● 8+ characters</Typography>
                  <Typography variant="caption" sx={{ color: v.upper ? 'green' : 'gray', display: 'block' }}>● 1 Uppercase</Typography>
                  <Typography variant="caption" sx={{ color: v.lower ? 'green' : 'gray', display: 'block' }}>● 1 Lowercase</Typography>
                  <Typography variant="caption" sx={{ color: v.num ? 'green' : 'gray', display: 'block' }}>● 1 Number</Typography>
                </Box>
              )}
            </Box>

            {!isLogin && (
              <>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {passwordsMatch && <CheckCircleIcon sx={{ color: 'green' }} />}
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField fullWidth name="name" label="Name" variant="outlined" required />
                <TextField fullWidth name="mobile" label="Mobile" variant="outlined" required />
                <TextField fullWidth name="address" label="Address" variant="outlined" required />
                {roles[roleIdx] === 'delivery_person' && (
                  <TextField fullWidth name="vehicle" label="Vehicle" variant="outlined" defaultValue="Bike" />
                )}
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#1a237e', mt: 2, py: 1.5 }}
              disabled={!isLogin && (!isPasswordValid || !passwordsMatch)}
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </Stack>
        </form>

        <Typography
          align="center"
          sx={{ mt: 2, cursor: 'pointer', color: '#1a237e', textDecoration: 'underline' }}
          onClick={() => {
            console.log("AuthPage: Switching mode to:", !isLogin ? "Login" : "Registration");
            setIsLogin(!isLogin);
            setError('');
            setPassword('');
            setConfirmPassword('');
          }}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuthPage;