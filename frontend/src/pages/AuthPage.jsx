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

  const roles = ['user', 'restaurant', 'delivery'];

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
    
    console.log("--- Auth Attempt Started ---");
    const emailValue = e.target.email.value;
    const currentRole = roles[roleIdx];
    
    console.log("Mode:", isLogin ? "Login" : "Register");
    console.log("Role:", currentRole);
    console.log("Email:", emailValue);

    let endpoint = "";
    if (currentRole === 'restaurant') {
      endpoint = isLogin ? "/restaurants/login" : "/restaurants/register";
    } else if (currentRole === 'delivery') {
      endpoint = isLogin ? "/delivery/login" : "/delivery/register";
    } else {
      endpoint = isLogin ? "/users/login" : "/users/register";
    }
    
    console.log("Target Endpoint:", endpoint);

    try {
      let response;
      
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('email', emailValue); 
        formData.append('password', password);
        formData.append('role', currentRole);

        console.log("Sending Login Form Data:", Object.fromEntries(formData));
        response = await API.post(endpoint, formData);
      } else {
        console.log("Validating Registration Requirements...");
        console.table({ isPasswordValid, passwordsMatch });

        if (!passwordsMatch || !isPasswordValid) {
          console.error("Validation Failed: Password requirements not met");
          setError("Please ensure password requirements are met.");
          return;
        }

        const signupData = {
          email: emailValue,
          password: password,
          name: e.target.name.value,
          mobile: e.target.mobile.value,
          address: e.target.address.value,
          role: currentRole
        };
        
        if (currentRole === 'delivery') {
          signupData.vehicle = e.target.vehicle?.value || "Bike";
        }

        console.log("Sending Registration Payload:", signupData);
        response = await API.post(endpoint, signupData);
      }

      // --- LOG SUCCESS DATA ---
      console.log("Server Response Received:", response.data);
      console.log("Authentication successful, proceeding to dashboard...");
      // localStorage.setItem('userObj', response.data);
      localStorage.setItem('userObj', JSON.stringify(response.data));
      // Since you don't need token or ID, we just save the role for routing purposes
      localStorage.setItem('role', currentRole);
    
      navigate(`/${currentRole}-dashboard`);

    } catch (err) {
      console.error("--- Auth Attempt Failed ---");
      if (err.response) {
        console.error("Response Status:", err.response.status);
        console.error("Response Data:", err.response.data);
        
        const detail = err.response.data.detail;
        const msg = Array.isArray(detail) 
          ? detail.map(d => `${d.loc ? d.loc[1] : 'Error'}: ${d.msg}`).join(", ") 
          : (detail || "Auth Failed");
        
        console.error("Formatted Error Message:", msg);
        setError(msg);
      } else {
        console.error("Network or Connection Error:", err.message);
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
            console.log("Tab changed to role index:", val);
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
                {roles[roleIdx] === 'delivery' && (
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
            console.log("Switching mode to:", !isLogin ? "Login" : "Registration");
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