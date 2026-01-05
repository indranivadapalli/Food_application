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
    
    formData.append('role', currentRole);
    console.log("Sending Role:", currentRole);
    
    const endpoint = isLogin ? `/users/login` : `/users/register`;
    formData.append('email', e.target.email.value);
    formData.append('password', password);
    formData.append('role', currentRole);

    if (!isLogin) {
      if (password !== confirmPassword) {
        const matchErr = "password and confirm password should match.";
        setError(matchErr);
        console.error("Validation Error:", matchErr);
        return;
      }
      
      if (!v.len) {
        const lenErr = "password must be atleast 8 characters long.";
        setError(lenErr);
        console.error("Validation Error:", lenErr);
        return;
      }

      formData.append('confirm_password', confirmPassword);
      formData.append('name', e.target.name.value);
      formData.append('mobile', e.target.mobile.value);
      formData.append('address', e.target.address.value);
      formData.append('profile_picture', new Blob(), "user.png"); 
    }
    
    const dataDisplay = {};
    formData.forEach((value, key) => { dataDisplay[key] = value });
    console.log(`Attempting ${isLogin ? 'Login' : 'Signup'} with data:`, dataDisplay);

    try {
      const res = await api.post(endpoint, formData);
      console.log("Server Response:", res.data);

      if (res.data.status === "success") {
        const currentRole = roles[roleIdx];
        localStorage.setItem('role', currentRole);
        localStorage.setItem('currentUser', JSON.stringify(res.data.user || res.data.user_id));
        console.log("Success! Navigating to dashboard...");
        navigate(`/${currentRole}-dashboard`);
      } else {
        console.warn("Backend Error Message:", res.data.message);
        setError(res.data.message);
      }
    } catch (err) {
      console.error("Axios Error:", err.response ? err.response.data : err.message);
      setError("Server connection failed. Please check backend CORS settings.");
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 5 }}>
      <Paper elevation={3} sx={{ p: 4, width: 450, borderRadius: 4, border: '1px solid #ddd' }}>
        <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
          {isLogin ? 'login' : 'signup'}
        </Typography>
        
        <Tabs value={roleIdx} onChange={(e, val) => {
            setRoleIdx(val);
            console.log("Selected Role Index:", val);
          }} centered sx={{ mb: 2 }}>
          <Tab label="USER" /><Tab label="RESTAURANT" /><Tab label="DELIVERY" />
        </Tabs>
        {error && (
          <Box ref={errorRef} sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField fullWidth name="email" label="email" variant="outlined" required />
            
            <Box>
              <TextField 
                fullWidth 
                label="password" 
                type="password" 
                variant="outlined" 
                required 
                onChange={(e) => setPassword(e.target.value)} 
              />
              
              {!isLogin && (
                <Box sx={{ mt: 1, ml: 1 }}>
                  <Typography variant="caption" sx={{ color: v.len ? 'green' : 'gray', display: 'block' }}>● atleast 8 characters</Typography>
                  <Typography variant="caption" sx={{ color: v.upper ? 'green' : 'gray', display: 'block' }}>● atleast 1 uppercase</Typography>
                  <Typography variant="caption" sx={{ color: v.lower ? 'green' : 'gray', display: 'block' }}>● atleast 1 lowercase</Typography>
                  <Typography variant="caption" sx={{ color: v.num ? 'green' : 'gray', display: 'block' }}>● atleast 1 number</Typography>
                  <Typography variant="caption" sx={{ color: v.special ? 'green' : 'gray', display: 'block' }}>● atleast 1 special character</Typography>
                </Box>
              )}
            </Box>

            {!isLogin && (
              <>
                <TextField 
                  fullWidth 
                  label="confirm password" 
                  type="password" 
                  variant="outlined" 
                  required 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {passwordsMatch && <CheckCircleIcon sx={{ color: 'green' }} />}
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField fullWidth name="name" label="name" variant="outlined" required />
                <TextField fullWidth name="mobile" label="mobile" variant="outlined" required />
                <TextField fullWidth name="address" label="address" variant="outlined" required />
              </>
            )}

            <Button type="submit" variant="contained" sx={{ bgcolor: '#1a237e', mt: 2, py: 1.5 }}>
              {isLogin ? 'login' : 'sign up'}
            </Button>
          </Stack>
        </form>

        <Typography align="center" sx={{ mt: 2, cursor: 'pointer', color: '#1a237e' }} onClick={() => { 
            setIsLogin(!isLogin); 
            setError(''); 
            console.log("Switching mode. IsLogin:", !isLogin);
          }}>
          {isLogin ? "don't have an account/signup" : "already have an account/login"}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuthPage;