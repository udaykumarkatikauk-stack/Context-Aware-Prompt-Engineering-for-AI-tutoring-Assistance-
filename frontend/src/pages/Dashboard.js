import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  Divider,
  CardActionArea
} from '@mui/material';
import { styled } from '@mui/material/styles';

// --- Component Imports ---
import DashboardLayout from '../components/DashboardLayout'; // Import our new Layout

// --- ICONS ---
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// --- STYLES ---
const StatCard = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: '1px solid #E5E7EB',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.07)',
  }
}));

const CardHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
});

const IconAvatar = styled(Avatar)(({ bgcolor }) => ({
  backgroundColor: bgcolor || '#8A6EE2',
  marginRight: '16px',
}));

function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signin');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const statsPromise = axios.get(`${BACKEND_URL}/api/profile/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const historyPromise = axios.get(`${BACKEND_URL}/api/chat/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const [statsResponse, historyResponse] = await Promise.all([statsPromise, historyPromise]);
        setStats(statsResponse.data);
        setHistory(historyResponse.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Could not load your progress data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate, BACKEND_URL]);

  const getImprovementColor = (points) => {
    if (points > 5) return 'success.main';
    if (points < -5) return 'error.main';
    return 'text.secondary';
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
    }
    return (
      <Grid container spacing={4}>
        {/* Card 1: AI Tutor (Clickable) */}
        <Grid item xs={12} sm={6}>
            <StatCard sx={{ p: 0 }}>
              <CardActionArea 
                onClick={() => navigate('/chat')}
                sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}
              >
                <IconAvatar bgcolor="#6D53D3" sx={{ width: 56, height: 56, mb: 2 }}>
                  <SmartToyIcon fontSize="large" />
                </IconAvatar>
                <Typography variant="h5" component="p" sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                  Start a Lesson
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Click to chat with your AI Tutor
                </Typography>
              </CardActionArea>
            </StatCard>
        </Grid>
        
        {stats && (
            // Card 2: Quiz Performance
            <Grid item xs={12} sm={6}>
              <StatCard sx={{p: 3}}>
                <CardHeader>
                  <IconAvatar bgcolor="#22C55E">
                    <CheckCircleOutlineIcon />
                  </IconAvatar>
                  <Typography variant="h6" color="text.secondary">Quiz Performance</Typography>
                </CardHeader>
                <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                  {stats.quizStats.accuracy}%
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                  Accuracy
                </Typography>
                <LinearProgressWithLabel variant="determinate" value={stats.quizStats.accuracy} color="success" />
              </StatCard>
            </Grid>
        )}
        
        {stats && (
            // Card 3: Learning Trend
            <Grid item xs={12} sm={6}>
              <StatCard sx={{p: 3}}>
                <CardHeader>
                  <IconAvatar bgcolor="#3B82F6">
                    <TrendingUpIcon />
                  </IconAvatar>
                  <Typography variant="h6" color="text.secondary">Learning Trend</Typography>
                </CardHeader>
                <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', color: getImprovementColor(stats.learningImprovement.percentage_points) }}>
                  {stats.learningImprovement.percentage_points >= 0 ? '+' : ''}
                  {stats.learningImprovement.percentage_points}%
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                  Improvement
                </Typography>
              </StatCard>
            </Grid>
        )}

        {stats && (
            // Card 4: Time Spent Learning
            <Grid item xs={12} sm={6}>
              <StatCard sx={{p: 3}}>
                <CardHeader>
                  <IconAvatar bgcolor="#8B5CF6">
                    <QueryStatsIcon />
                  </IconAvatar>
                  <Typography variant="h6" color="text.secondary">Engagement</Typography>
                </CardHeader>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: '#6D28D9' }}>
                    {stats.engagementDuration}
                  </Typography>
                </Box>
              </StatCard>
            </Grid>
        )}
        
        {/* Card 5: Chat History Card (Full Width) */}
        <Grid item xs={12}>
          <StatCard sx={{p: 3}}>
             <CardHeader>
                <IconAvatar bgcolor="#EF4444">
                  <HistoryIcon />
                </IconAvatar>
                <Typography variant="h6" color="text.secondary">Recent History</Typography>
              </CardHeader>
              <Box sx={{ maxHeight: '300px', overflowY: 'auto', pr: 2 }}>
                {history.length > 0 ? history.slice(-5).map((msg, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      {msg.role === 'user' ? 'You' : 'AI Tutor'}
                    </Typography>
                    <Box sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>
                      <ReactMarkdown>{msg.parts[0]?.text || '...'}</ReactMarkdown>
                    </Box>
                    {index < history.slice(-5).length - 1 && <Divider sx={{ my: 1.5 }} />}
                  </Box>
                )) : <Typography color="text.secondary">No conversation history yet.</Typography>}
              </Box>
          </StatCard>
        </Grid>
      </Grid>
    );
  };

  return (
    <DashboardLayout pageTitle="Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;