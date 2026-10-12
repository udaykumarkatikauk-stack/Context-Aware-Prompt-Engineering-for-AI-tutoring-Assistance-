import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { styled } from '@mui/material/styles';

import DashboardLayout from '../components/DashboardLayout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  borderRadius: '16px',
}));

const DetailCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(4),
  borderRadius: '16px',
}));

const QuizPerformancePage = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchAttempts = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/signin'); return; }
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/quizzes/my-attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAttempts(response.data);
      } catch (err) {
        setError('Could not load quiz history.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, [navigate, BACKEND_URL]);

  // Calculate stats from the fetched attempts
  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return { total: 0, correct: 0, incorrect: 0, accuracy: 0 };
    }
    const correct = attempts.filter(a => a.isCorrect).length;
    const total = attempts.length;
    return {
      total,
      correct,
      incorrect: total - correct,
      accuracy: Math.round((correct / total) * 100),
    };
  }, [attempts]);

  const renderContent = () => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    return (
      <>
        {/* --- Summary Cards --- */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <StatCard>
              <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{stats.total}</Typography>
              <Typography color="text.secondary">Total Questions Answered</Typography>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard>
              <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 'bold' }}>{stats.correct}</Typography>
              <Typography color="text.secondary">Correct Answers</Typography>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard>
              <Typography variant="h3" sx={{ color: 'error.main', fontWeight: 'bold' }}>{stats.incorrect}</Typography>
              <Typography color="text.secondary">Incorrect Answers</Typography>
            </StatCard>
          </Grid>
        </Grid>

        {/* --- Detailed List --- */}
        <DetailCard>
          <Typography variant="h5" gutterBottom>Attempt History</Typography>
          <List>
            {attempts.map((attempt, index) => (
              <React.Fragment key={attempt._id}>
                <ListItem>
                  <ListItemIcon>
                    {attempt.isCorrect ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={attempt.question}
                    secondary={`Your answer: ${attempt.userAnswer} | Correct: ${attempt.correctAnswer}`}
                  />
                   <Typography variant="caption" color="text.secondary">
                    {new Date(attempt.askedAt).toLocaleDateString()}
                  </Typography>
                </ListItem>
                {index < attempts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DetailCard>
      </>
    );
  };

  return (
    <DashboardLayout pageTitle="Quiz Performance">
      {renderContent()}
    </DashboardLayout>
  );
};

export default QuizPerformancePage;