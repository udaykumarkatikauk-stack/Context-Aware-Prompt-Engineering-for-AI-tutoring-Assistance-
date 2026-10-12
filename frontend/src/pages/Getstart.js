// src/pages/Getstart.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Fade,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// --- STYLES ---
const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #6b46c1 0%, #553c9a 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  width: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[4],
  padding: theme.spacing(4),
  position: 'relative',
  marginLeft: theme.spacing(5),
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 64,
  height: 64,
  backgroundColor: theme.palette.common.white,
  borderRadius: '50%',
  margin: '0 auto ' + theme.spacing(2),
  boxShadow: theme.shadows[2],
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  background: '#6b46c1',
  color: theme.palette.common.white,
  fontWeight: 600,
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    background: '#553c9a',
  },
}));

// --- MAIN COMPONENT ---
const Getstart = () => {
  const [activeForm, setActiveForm] = useState('signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    otp: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState({ title: '', message: '' });
  const [resetToken, setResetToken] = useState('');

  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleInputChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchForm = (formName) => {
    setError('');
    setFormData({ ...formData, otp: '', newPassword: '' });
    setActiveForm(formName);
  };

  // 1. SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setActiveForm('signupOtp');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  // 2. VERIFY SIGNUP OTP & AUTO-LOGIN
  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Step 1: Verify the OTP
      await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
        email: formData.email,
        otp: formData.otp,
      });

      // Step 2: If OTP is correct, automatically sign in to get the token
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
        email: formData.email,
        password: formData.password, // Password is still in state from signup form
      });
      
      // Step 3: Store the token and user info
      localStorage.setItem('authToken', loginResponse.data.token);
      localStorage.setItem('user', JSON.stringify(loginResponse.data.user));

      // Step 4: Navigate to the profile completion page
      navigate('/profile-complete');

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // --- THIS IS THE CHANGE ---
      // Navigate to the chat page instead of the dashboard
      navigate('/dashboard'); 
      // --- END OF CHANGE ---

    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 4. FORGOT PASSWORD (Step 1: Send OTP)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email: formData.email });
      setActiveForm('forgotOtp');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not process request.');
    } finally {
      setLoading(false);
    }
  };

  // 5. VERIFY RESET OTP (Step 2: Get Reset Token)
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/verify-reset-otp`, {
        email: formData.email,
        otp: formData.otp,
      });
      setResetToken(response.data.resetToken);
      setActiveForm('resetPassword');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 6. RESET PASSWORD (Step 3: Submit new password with token)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
        email: formData.email,
        newPassword: formData.newPassword,
        resetToken: resetToken,
      });
      setSuccess({
        title: 'Success!',
        message: 'Your password has been reset. Please log in.',
      });
      setActiveForm('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBox>
      <Container maxWidth="sm">
        <Box textAlign="center" mb={4}>
          <Fade in timeout={400}>
            <Box sx={{ transform: 'translateX(-40px)' }}>
              <LogoContainer>
                <Typography variant="h4">🎓</Typography>
              </LogoContainer>
              <Typography variant="h4" color="white" fontWeight="bold" gutterBottom>
                AI Tutor
              </Typography>
              <Typography color="white" variant="subtitle1">
                Your personal learning companion
              </Typography>
            </Box>
          </Fade>
        </Box>
        <Fade in timeout={400}>
          <StyledCard>
            <CardContent>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* RENDER FORMS BASED ON activeForm STATE */}
              {activeForm === 'signup' && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="text.primary" mb={3} textAlign="center">
                    Create Account
                  </Typography>
                  <form onSubmit={handleSignup}>
                    <TextField fullWidth label="Full Name *" name="name" value={formData.name} onChange={handleInputChange} required margin="normal" />
                    <TextField fullWidth label="Email Address *" name="email" type="email" value={formData.email} onChange={handleInputChange} required margin="normal" />
                    <TextField fullWidth label="Password *" name="password" type="password" value={formData.password} onChange={handleInputChange} required inputProps={{ minLength: 8 }} margin="normal" helperText="Must be at least 8 characters" />
                    <SubmitButton type="submit" fullWidth sx={{ mt: 2 }} disabled={loading}>
                      GET STARTED
                    </SubmitButton>
                  </form>
                  <Box mt={2} textAlign="center">
                    <Typography color="text.secondary">
                      Already have an account?{' '}
                      <Link component="button" onClick={() => switchForm('login')} color="secondary">
                        Log In
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              )}
              {activeForm === 'signupOtp' && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" textAlign="center">Verify Your Email</Typography>
                  <Typography color="text.secondary" textAlign="center" my={2}>
                    An OTP has been sent to <strong>{formData.email}</strong>. Please enter it below.
                  </Typography>
                  <form onSubmit={handleVerifySignupOtp}>
                    <TextField fullWidth label="6-Digit OTP *" name="otp" value={formData.otp} onChange={handleInputChange} required margin="normal" inputProps={{ maxLength: 6 }} />
                    <SubmitButton type="submit" fullWidth sx={{ mt: 2 }} disabled={loading}>
                      Verify Account
                    </SubmitButton>
                  </form>
                </Box>
              )}
              {activeForm === 'login' && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="text.primary" mb={3} textAlign="center">
                    Welcome Back
                  </Typography>
                  <form onSubmit={handleLogin}>
                    <TextField fullWidth label="Email Address *" name="email" type="email" value={formData.email} onChange={handleInputChange} required margin="normal" />
                    <TextField fullWidth label="Password *" name="password" type="password" value={formData.password} onChange={handleInputChange} required margin="normal" />
                    <Box textAlign="right" mb={2}>
                      <Link component="button" onClick={() => switchForm('forgot')} color="secondary">
                        Forgot Password?
                      </Link>
                    </Box>
                    <SubmitButton type="submit" fullWidth disabled={loading}>
                      Log In
                    </SubmitButton>
                  </form>
                  <Box mt={2} textAlign="center">
                    <Typography color="text.secondary">
                      Don't have an account?{' '}
                      <Link component="button" onClick={() => switchForm('signup')} color="secondary">
                        Sign Up
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              )}
              {activeForm === 'forgot' && (
                <Box>
                  <Box mb={2}>
                    <Link component="button" onClick={() => switchForm('login')} color="secondary" sx={{ fontWeight: 'bold' }}>
                      ← Back to Login
                    </Link>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" textAlign="center">Reset Password</Typography>
                  <Typography color="text.secondary" mb={3} textAlign="center">
                    Enter your email to receive a password reset OTP.
                  </Typography>
                  <form onSubmit={handleForgotPassword}>
                    <TextField fullWidth label="Email Address *" name="email" type="email" value={formData.email} onChange={handleInputChange} required margin="normal" />
                    <SubmitButton type="submit" fullWidth sx={{ mt: 2 }} disabled={loading}>
                      Send OTP
                    </SubmitButton>
                  </form>
                </Box>
              )}
              {activeForm === 'forgotOtp' && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" textAlign="center">Enter OTP</Typography>
                  <Typography color="text.secondary" textAlign="center" my={2}>
                    An OTP has been sent to <strong>{formData.email}</strong>.
                  </Typography>
                  <form onSubmit={handleVerifyResetOtp}>
                    <TextField fullWidth label="6-Digit OTP *" name="otp" value={formData.otp} onChange={handleInputChange} required margin="normal" inputProps={{ maxLength: 6 }} />
                    <SubmitButton type="submit" fullWidth sx={{ mt: 2 }} disabled={loading}>
                      Verify OTP
                    </SubmitButton>
                  </form>
                </Box>
              )}
              {activeForm === 'resetPassword' && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" textAlign="center">Set New Password</Typography>
                  <Typography color="text.secondary" textAlign="center" my={2}>
                    OTP verified. Please enter your new password.
                  </Typography>
                  <form onSubmit={handleResetPassword}>
                    <TextField fullWidth label="New Password *" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} required margin="normal" inputProps={{ minLength: 8 }} />
                    <SubmitButton type="submit" fullWidth sx={{ mt: 2 }} disabled={loading}>
                      Reset Password
                    </SubmitButton>
                  </form>
                </Box>
              )}
              {activeForm === 'success' && (
                <Box textAlign="center">
                  <Box sx={{ width: 64, height: 64, bgcolor: 'success.light', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <Typography variant="h3">✓</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold">{success.title}</Typography>
                  <Typography color="text.secondary" mb={3}>{success.message}</Typography>
                  <Link component="button" onClick={() => switchForm('login')} color="secondary">
                    Proceed to Login
                  </Link>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Fade>
        <Box mt={3} textAlign="center" sx={{ transform: 'translateX(-45px)' }}>
          <Typography color="white" variant="caption">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Container>
    </GradientBox>
  );
};

export default Getstart;