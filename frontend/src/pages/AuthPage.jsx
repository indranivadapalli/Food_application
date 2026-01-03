import React, { useState, useRef } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, ToggleButton, ToggleButtonGroup, List, ListItem, ListItemIcon, ListItemText, Snackbar, Alert } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, CloudUpload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api, registerUser } from '../api';

const AuthPage = ({ setIsLoggedIn, setUserRole }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('user');
  
  const fieldRefs = {
    email: useRef(null), 
    password: useRef(null), 
    name: useRef(null),
    confirmPassword: useRef(null), 
    mobile: useRef(null), 
    address: useRef(null)
  };

  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    mobile: '', 
    address: '' 
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null); 
  
  const [errors, setErrors] = useState({});
  const [openSnack, setOpenSnack] = useState(false);
  const [message, setMessage] = useState('');

  const validCriteria = {
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    num: /[0-9]/.test(formData.password),
    spec: /[!@#$%^&*]/.test(formData.password),
  };

  const validate = () => {
    let tempErrors = {};
    let firstErrorField = null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.email.trim()) {
      tempErrors.email = "Email is mandatory";
      if (!firstErrorField) firstErrorField = 'email';
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Invalid email format";
      if (!firstErrorField) firstErrorField = 'email';
    }

    if (!formData.password) {
      tempErrors.password = "Password is mandatory";
      if (!firstErrorField) firstErrorField = 'password';
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        tempErrors.name = "Full Name is mandatory";
        if (!firstErrorField) firstErrorField = 'name';
      }
      if (formData.password !== confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match";
        if (!firstErrorField) firstErrorField = 'confirmPassword';
      }
      if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
        tempErrors.mobile = "Enter a valid 10-digit mobile number";
        if (!firstErrorField) firstErrorField = 'mobile';
      }
      if (!formData.address.trim()) {
        tempErrors.address = "Address is mandatory";
        if (!firstErrorField) firstErrorField = 'address';
      }
      if (!profilePicture) {
        tempErrors.profile = "Profile picture is required";
      }
    }

    setErrors(tempErrors);
    if (firstErrorField) fieldRefs[firstErrorField].current.focus();
    return Object.keys(tempErrors).length === 0;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    console.log('login Process Started');
    console.log('Mode:', isLogin ? 'Login' : 'Signup');

    try {
      if (isLogin) {
                const data = new FormData();
        data.append('email', formData.email);

        data.append('password', formData.password);
        const res = await api.post('/users/login/', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
}); 
        const user = res.data;
        console.log('response data user ', user);

        if (user) {
          console.log('Login successful for user:', user);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', role);
          localStorage.setItem('currentUser', JSON.stringify(user));
          setIsLoggedIn(true);
          setUserRole(role);
          navigate(role === 'user' ? '/user-dashboard' : '/restaurant-dashboard');
        } else {
          console.warn('Login failed: Invalid credentials');
          setMessage("Invalid email or password!"); 
          setOpenSnack(true);
        }
      } else {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('mobile', formData.mobile);
        data.append('address', formData.address);
        data.append('password', formData.password);
        data.append('confirm_password', confirmPassword); 
        data.append('profile_picture', profilePicture); 

        console.log('Signup FormData contents:');
        data.forEach((value, key) => console.log(`${key}:`, value));

        const res = await registerUser(data);
        console.log('Registration Response:', res.data);
        
        setMessage("Signup Successful! Please Login.");
        setOpenSnack(true);
        setIsLogin(true);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      setMessage(err.response?.data?.message || "Server Error!");
      setOpenSnack(true);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 5 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="bold" color="#1a237e">
          {isLogin ? 'Login' : 'Signup'}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <ToggleButtonGroup value={role} exclusive onChange={(e, v) => v && setRole(v)}>
            <ToggleButton value="user">User</ToggleButton>
            <ToggleButton value="restaurant">Restaurant</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <form onSubmit={handleAuth} noValidate>
          {!isLogin && (
            <TextField fullWidth label="Full Name *" margin="dense" inputRef={fieldRefs.name} error={!!errors.name} helperText={errors.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />
          )}
          
          <TextField fullWidth label="Email *" margin="dense" inputRef={fieldRefs.email} error={!!errors.email} helperText={errors.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} />
          
          <TextField fullWidth label="Password *" type="password" margin="dense" inputRef={fieldRefs.password} error={!!errors.password} helperText={errors.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />

          {!isLogin && (
            <>
              <List dense sx={{ bgcolor: '#f5f5f5', borderRadius: 1, my: 1 }}>
                {[{ l: 'Uppercase', v: validCriteria.upper }, { l: 'Lowercase', v: validCriteria.lower }, { l: 'Number', v: validCriteria.num }, { l: 'Special char', v: validCriteria.spec }].map((item, i) => (
                  <ListItem key={i} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>{item.v ? <CheckCircle sx={{ color: 'green', fontSize: 18 }} /> : <RadioButtonUnchecked sx={{ fontSize: 18 }} />}</ListItemIcon>
                    <ListItemText primary={item.l} primaryTypographyProps={{ style: { color: item.v ? 'green' : 'gray', fontSize: '0.75rem' } }} />
                  </ListItem>
                ))}
              </List>

              <TextField fullWidth label="Confirm Password *" type="password" margin="dense" inputRef={fieldRefs.confirmPassword} error={!!errors.confirmPassword} helperText={errors.confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              
              <TextField fullWidth label="Mobile *" margin="dense" inputRef={fieldRefs.mobile} error={!!errors.mobile} helperText={errors.mobile} onChange={(e)=>setFormData({...formData, mobile: e.target.value})} />
              
              <TextField fullWidth label="Address *" margin="dense" multiline rows={2} inputRef={fieldRefs.address} error={!!errors.address} helperText={errors.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} />
              
              <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />} sx={{ mt: 1, mb: 1, textTransform: 'none' }} color={errors.profile ? "error" : "primary"}>
                {profilePicture ? profilePicture.name : "Upload Profile Picture *"}
                <input type="file" hidden accept="image/*" onChange={(e) => setProfilePicture(e.target.files[0])} />
              </Button>
              {errors.profile && <Typography color="error" variant="caption">{errors.profile}</Typography>}
            </>
          )}

          <Button fullWidth type="submit" variant="contained" sx={{ mt: 3, bgcolor: '#1a237e', fontWeight: 'bold' }}>
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>

          <Typography align="center" sx={{ mt: 2, cursor: 'pointer', color: '#1a237e' }} onClick={() => { setIsLogin(!isLogin); setErrors({}); }}>
            {isLogin ? "Don't have an account? Signup" : "Already have an account? Back to Login"}
          </Typography>
        </form>
      </Paper>

      <Snackbar open={openSnack} autoHideDuration={3000} onClose={() => setOpenSnack(false)}>
        <Alert severity={message.includes("Successful") ? "success" : "error"} variant="filled">{message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AuthPage;