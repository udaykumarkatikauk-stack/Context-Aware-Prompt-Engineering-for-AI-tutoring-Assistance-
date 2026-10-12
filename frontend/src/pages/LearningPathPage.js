import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';

const LearningPathPage = () => {
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get(`${BACKEND_URL}/api/learning-path`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPath(res.data);
      } catch {
        setError('Could not load learning path.');
      } finally {
        setLoading(false);
      }
    };
    fetchPath();
  }, [BACKEND_URL]);

  const getChipColor = (status) => {
    if (status === 'completed') return 'success';
    if (status === 'unlocked') return 'primary';
    return 'default';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error">{error}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        📍 My Learning Path
      </Typography>

      <Typography color="text.secondary" mb={4}>
        Subject: <strong>{path.subject}</strong>
      </Typography>

      <Stack spacing={3}>
        {path.modules.map((module, index) => (
          <Paper
            key={index}
            sx={{
              p: 3,
              borderRadius: 3,
              borderLeft: `6px solid ${
                module.status === 'completed'
                  ? '#22C55E'
                  : module.status === 'unlocked'
                  ? '#6D53D3'
                  : '#CBD5E1'
              }`,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight="bold">
                {index + 1}. {module.title}
              </Typography>
              <Chip
                label={module.status.toUpperCase()}
                color={getChipColor(module.status)}
                variant={module.status === 'locked' ? 'outlined' : 'filled'}
              />
            </Box>

            <Typography mt={1} color="text.secondary">
              Attempts: {module.attempts} | Accuracy: {module.accuracy}%
            </Typography>
          </Paper>
        ))}
      </Stack>
    </DashboardLayout>
  );
};

export default LearningPathPage;
