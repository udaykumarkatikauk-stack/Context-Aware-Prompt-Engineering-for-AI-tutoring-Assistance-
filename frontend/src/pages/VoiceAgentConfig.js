import React, { useState } from 'react';
import axios from 'axios';
import { 
    Typography, Box, Paper, TextField, Button, 
    Alert, CircularProgress, Container, Fade, InputAdornment 
} from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const VoiceAgentConfig = () => {
    // We only store the 10 digits in state
    const [testPhone, setTestPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    const triggerCall = async () => {
        // Simple validation for 10 digits
        if (!testPhone || testPhone.length !== 10) {
            setStatus({ type: 'error', message: 'Please enter a valid 10-digit phone number.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const token = localStorage.getItem('authToken');
            // Combine the prefix with the input value
            const fullPhoneNumber = `+91${testPhone}`;

            await axios.post(`${BACKEND_URL}/api/voice/trigger-call`, 
                { targetPhoneNumber: fullPhoneNumber }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStatus({ type: 'success', message: 'Calling your number now... Please pick up!' });
        } catch (err) {
            setStatus({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to trigger call. Ensure the AI server is running.' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Handler to ensure only numbers are typed and max 10 digits
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
        if (value.length <= 10) {
            setTestPhone(value);
        }
    };

    return (
        <DashboardLayout>
            <Container maxWidth="sm">
                <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    
                    <SupportAgentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    
                    <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">
                        Jairisys AI Voice Assistant
                    </Typography>
                    
                    <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ mb: 4 }}>
                        Experience our multilingual AI agent. Enter your mobile number below and our AI will call you instantly.
                    </Typography>

                    <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 4, textAlign: 'center' }}>
                        {status.message && (
                            <Fade in={!!status.message}>
                                <Alert severity={status.type} sx={{ mb: 3, borderRadius: 2 }}>
                                    {status.message}
                                </Alert>
                            </Fade>
                        )}

                        <TextField 
                            fullWidth
                            label="Phone Number"
                            placeholder="98765 43210"
                            variant="outlined"
                            value={testPhone}
                            onChange={handlePhoneChange}
                            disabled={loading}
                            sx={{ mb: 3 }}
                            InputProps={{
                                // This adds the +91 as a permanent prefix
                                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                                sx: { borderRadius: 3, fontSize: '1.1rem', fontWeight: '500' }
                            }}
                        />

                        <Button 
                            fullWidth 
                            variant="contained" 
                            size="large"
                            onClick={triggerCall} 
                            disabled={loading || testPhone.length !== 10}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PhoneInTalkIcon />}
                            sx={{ 
                                py: 1.5, 
                                borderRadius: 3, 
                                fontSize: '1.1rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)'
                            }}
                        >
                            {loading ? 'Connecting...' : 'Call Me Now'}
                        </Button>
                    </Paper>

                    <Box sx={{ mt: 4, display: 'flex', gap: 3 }}>
                        <Typography variant="caption" color="textSecondary">English Supported</Typography>
                        <Typography variant="caption" color="textSecondary">•</Typography>
                        <Typography variant="caption" color="textSecondary">తెలుగు మద్దతు ఉంది</Typography>
                    </Box>
                </Box>
            </Container>
        </DashboardLayout>
    );
};

export default VoiceAgentConfig;