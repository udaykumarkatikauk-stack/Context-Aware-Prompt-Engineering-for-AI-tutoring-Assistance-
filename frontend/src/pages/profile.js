import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button, // ✅ Added
} from '@mui/material';
import { styled } from '@mui/material/styles';

// --- Component Imports ---
import DashboardLayout from '../components/DashboardLayout';

// --- ICONS ---
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CakeIcon from '@mui/icons-material/Cake';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import PsychologyIcon from '@mui/icons-material/Psychology';

// --- STYLES ---
const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 700,
  margin: 'auto',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  border: '1px solid #E5E7EB',
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 100,
  height: 100,
  fontSize: '3rem',
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
}));

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signin');
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${BACKEND_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Could not load your profile. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, BACKEND_URL]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (profile) {
      return (
        <ProfileCard>
          <ProfileHeader>
            <ProfileAvatar sx={{ bgcolor: '#6D53D3' }}>
              {profile.name.charAt(0).toUpperCase()}
            </ProfileAvatar>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              {profile.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {profile.email}
            </Typography>
          </ProfileHeader>

          <Divider sx={{ mb: 3 }} />

          <List>
            <ListItem>
              <ListItemIcon><CakeIcon /></ListItemIcon>
              <ListItemText primary="Age" secondary={profile.age || 'Not provided'} />
            </ListItem>
            <ListItem>
              <ListItemIcon><SchoolIcon /></ListItemIcon>
              <ListItemText primary="Current Education" secondary={profile.current_education || 'Not provided'} />
            </ListItem>
            <ListItem>
              <ListItemIcon><ClassIcon /></ListItemIcon>
              <ListItemText primary="Course Enrolled" secondary={profile.course_enrolled || 'Not provided'} />
            </ListItem>
            <ListItem>
              <ListItemIcon><PsychologyIcon /></ListItemIcon>
              <ListItemText primary="Knowledge Level" secondary={profile.knowledge_level || 'Not provided'} />
            </ListItem>
          </List>

          {/* ✅ Add Update Profile button here */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/profile-complete')}
            >
              Update Profile
            </Button>
          </Box>
        </ProfileCard>
      );
    }

    return null;
  };

  return (
    <DashboardLayout pageTitle="My Profile">
      {renderContent()}
    </DashboardLayout>
  );
};

export default Profile;
