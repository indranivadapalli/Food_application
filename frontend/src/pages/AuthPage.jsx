import React, { useState, useRef, useEffect } from 'react'; 
import { Box, Paper, Tabs, Tab, TextField, Button, Typography, Alert, Stack, InputAdornment } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import { api } from '../api'; 
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

  
  // Check if all password requirements are met
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
    const formData = new FormData();
    const currentRole = roles[roleIdx];
    
    let endpoint = isLogin ? "/users/login" : "/users/register";
    if (currentRole === 'delivery_person') {
        endpoint = isLogin ? "/delivery/login" : "/delivery/register";
    } else if (currentRole === 'restaurant') {
        endpoint = isLogin ? "/restaurants/login" : "/restaurants/register";
    }
    
    formData.append('email', e.target.email.value);
    formData.append('password', password);
      formData.append('role', currentRole);
    if (!isLogin) {
      
      if (password !== confirmPassword) {
        const matchErr = "Password and confirm password should match.";
        setError(matchErr);
        console.error("Validation Error:", matchErr);
        return;
      }

      if (!isPasswordValid) {
        const validationErr = "Password must meet all requirements (8+ characters, uppercase, lowercase, number, special character).";
        setError(validationErr);
        console.error("Validation Error:", validationErr);
        return;
      }

      formData.append('name', e.target.name.value);
      formData.append('mobile', e.target.mobile.value);
      formData.append('address', e.target.address.value);
      
      // Only add vehicle field for delivery person
      if (currentRole === 'delivery_person') {
          const vehicleValue = e.target.vehicle?.value || 'Bike';
          formData.append('vehicle', vehicleValue);
      }
      
      // Don't send profile_picture for delivery person, or send null
      // The backend will handle missing files properly
    }

    const dataDisplay = {};
    formData.forEach((value, key) => { dataDisplay[key] = value });
    console.log(`Attempting ${isLogin ? 'Login' : 'Signup'} with data:`, dataDisplay);

    try {
      const res = await api.post(endpoint, formData);
      console.log("Server response:", res.data);
      
      if (res.data.status === "success") {
        localStorage.setItem('role', currentRole);
        // Save the correct object based on what the backend returns
        const userData = res.data.user || res.data.delivery_partner || res.data.restaurant;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Navigate to correct dashboard
        navigate(`/${currentRole}-dashboard`);
      } else {
        setError(res.data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Connection Error:", err);
      const errorMsg = err.response?.data?.message || "Server connection failed. Ensure backend is running and CORS is enabled.";
      setError(errorMsg);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 5 }}>
      <Paper elevation={3} sx={{ p: 4, width: 450, borderRadius: 4, border: '1px solid #ddd' }}>
        <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </Typography>
        
        <Tabs value={roleIdx} onChange={(e, val) => {
            setRoleIdx(val);
            setError(''); // Clear error when switching roles
            console.log("Selected Role Index:", val, "Role:", roles[val]);
          }} centered sx={{ mb: 2 }}>
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
            <TextField 
              fullWidth 
              name="email" 
              label="Email" 
              type="email"
              variant="outlined" 
              required 
            />
            
            <Box>
              <TextField 
                fullWidth 
                label="Password" 
                type="password" 
                variant="outlined" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />
              
              {!isLogin && (
                <Box sx={{ mt: 1, ml: 1 }}>
                  <Typography variant="caption" sx={{ color: v.len ? 'green' : 'gray', display: 'block' }}>
                    ● At least 8 characters
                  </Typography>
                  <Typography variant="caption" sx={{ color: v.upper ? 'green' : 'gray', display: 'block' }}>
                    ● At least 1 uppercase letter
                  </Typography>
                  <Typography variant="caption" sx={{ color: v.lower ? 'green' : 'gray', display: 'block' }}>
                    ● At least 1 lowercase letter
                  </Typography>
                  <Typography variant="caption" sx={{ color: v.num ? 'green' : 'gray', display: 'block' }}>
                    ● At least 1 number
                  </Typography>
                  <Typography variant="caption" sx={{ color: v.special ? 'green' : 'gray', display: 'block' }}>
                    ● At least 1 special character (!@#$%^&*)
                  </Typography>
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
                <TextField 
                  fullWidth 
                  name="name" 
                  label="Name" 
                  variant="outlined" 
                  required 
                />
                <TextField 
                  fullWidth 
                  name="mobile" 
                  label="Mobile" 
                  variant="outlined" 
                  required 
                />
                <TextField 
                  fullWidth 
                  name="address" 
                  label="Address" 
                  variant="outlined" 
                  required 
                />
                
                {/* Add vehicle field for delivery person */}
                {roles[roleIdx] === 'delivery_person' && (
                  <TextField 
                    fullWidth 
                    name="vehicle" 
                    label="Vehicle (optional)" 
                    variant="outlined"
                    placeholder="e.g., Bike, Scooter, Car"
                    defaultValue="Bike"
                  />
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
            setIsLogin(!isLogin); 
            setError('');
            setPassword('');
            setConfirmPassword('');
            console.log("Switching mode. IsLogin:", !isLogin);
          }}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuthPage;