import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, Drawer, AppBar, Toolbar, Typography, Avatar, Divider, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';

// --- Icons ---
import Logout from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatIcon from '@mui/icons-material/Chat';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuBookIcon from '@mui/icons-material/MenuBook'; 
import LockIcon from '@mui/icons-material/Lock';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';


const drawerWidth = 280;

const DashboardLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Courses', icon: <MenuBookIcon />, path: '/learn' }, 
    { text: 'AI Website Creator', icon: <AutoAwesomeIcon />, path: '/ai-create' },
    { text: 'My Projects', icon: <FolderIcon />, path: '/projects' },
    { text: 'AI Tutor Chat', icon: <ChatIcon />, path: '/chat' },
    { text: 'Quiz Performance', icon: <EqualizerIcon />, path: '/quiz-performance' },
     { text: 'Secure Chat', icon: <LockIcon />, path: '/secure-chat' }, 
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Voice AI Agent', icon: <PhoneInTalkIcon />, path: '/voice-agent' }, 
    { text: 'System Evaluation', icon: <EqualizerIcon />, path: '/admin/evaluation' }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return navigate('/get-started');
      try {
        const res = await axios.get(`${BACKEND_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch {
        localStorage.removeItem('authToken');
        navigate('/get-started');
      }
    };
    fetchUser();
  }, [navigate, BACKEND_URL]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            background: 'linear-gradient(180deg, #6D53D3, #8A6EE2)',
            color: 'white',
          },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}><SchoolIcon /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">AI Tutor</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Learning Platform</Typography>
          </Box>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <List sx={{ p: 2 }}>
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{ borderRadius: 2, mb: 1, '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.15)' } }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ color: 'inherit' }}><Logout /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#F9FAFB', p: 4, minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;