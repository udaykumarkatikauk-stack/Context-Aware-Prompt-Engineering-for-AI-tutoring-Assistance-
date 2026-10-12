import React, { useState, useEffect } from 'react';
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
  Grid,
  Select,
  MenuItem,
  LinearProgress,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// --- STYLES and MAPS (No changes needed here) ---

const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 750,
  width: '100%',
  borderRadius: 16,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.common.white,
}));

const KnowledgeCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected',
})(({ theme, selected }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.grey[200]}`,
  borderRadius: 12,
  padding: theme.spacing(3),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: theme.palette.text.primary,
  textAlign: 'left',
  height: 180,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  '&:hover': {
    borderColor: selected ? theme.palette.primary.main : theme.palette.grey[400],
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transform: 'translateY(-4px)',
  },
  ...(selected && {
    boxShadow: `0 6px 16px ${theme.palette.primary.light}33`,
  }),
}));

const NextButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(to right, #5b21b6, #4c1d95)',
  color: theme.palette.common.white,
  fontWeight: 600,
  padding: theme.spacing(1.5, 4),
  borderRadius: 8,
  textTransform: 'none',
  '&:hover': {
    background: 'linear-gradient(to right, #6d28d9, #5b21b6)',
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(to right, #22c55e, #16a34a)',
  color: theme.palette.common.white,
  fontWeight: 600,
  padding: theme.spacing(1.5, 4),
  borderRadius: 8,
  textTransform: 'none',
  fontSize: '1rem',
  '&:hover': {
    background: 'linear-gradient(to right, #16a34a, #15803d)',
  },
}));

const educationMap = {
  elementary: 'Elementary School',
  middle: 'Middle School',
  high: 'High School',
  undergraduate: 'Undergraduate',
  graduate: 'Graduate School',
  professional: 'Professional/Working',
  other: 'Other',
};

const courseMap = {
  frontend: 'Frontend Development',
  backend: 'Backend Development',
  databases: 'Databases & SQL',
  dsa: 'Data Structures & Algorithms',
  oop: 'Object-Oriented Programming',
  dataScience: 'Data Science & Analytics',
  testing: 'Software Testing & QA',
  ai: 'Artificial Intelligence',
  ml: 'Machine Learning',
};


// --- MAIN COMPONENT ---

const ProfileComplete = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [formData, setFormData] = useState({
    age: '',
    education: '', 
    course: '', 
    knowledgeLevel: '', 
  });

  // State for API interaction
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Security check: ensure user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/'); 
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.age || formData.age < 5 || formData.age > 100)) return;
    if (currentStep === 2 && !formData.education) return;
    if (currentStep === 3 && !formData.course) return;
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const selectKnowledge = (level) => {
    setError('');
    setFormData({ ...formData, knowledgeLevel: level });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.knowledgeLevel) {
      setError('Please select your knowledge level.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        age: parseInt(formData.age, 10),
        current_education: educationMap[formData.education],
        course_enrolled: courseMap[formData.course],
        knowledge_level: formData.knowledgeLevel, // This is now 'Beginner', 'Intermediate', etc.
      };

      await axios.put(`${BACKEND_URL}/api/profile`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCurrentStep(totalSteps + 1); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const startLearning = () => {
    navigate('/dashboard'); // Navigate to the main dashboard
  };

  return (
    <GradientBox>
      <Container maxWidth="md">
        {/* Header Section */}
        <Box textAlign="center" mb={4}>
          <Fade in timeout={400}>
            <Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, backgroundColor: 'white', borderRadius: '50%', marginBottom: 2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', }}>
                <Typography variant="h3">🎓</Typography>
              </Box>
              <Typography variant="h4" color="white" fontWeight="bold" gutterBottom>Complete Your Profile</Typography>
              <Typography color="#ddd6fe">Help us personalize your learning experience</Typography>
            </Box>
          </Fade>
        </Box>

        {/* Progress Bar */}
        <Fade in timeout={400}>
            <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, height: 8, mb: 4, ml: -2.5, }}>
                <LinearProgress variant="determinate" value={Math.min((currentStep / totalSteps) * 100, 100)} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { background: 'linear-gradient(to right, #f0abfc, #a855f7)' }, backgroundColor: 'transparent', }}/>
            </Box>
        </Fade>

        {/* Form Card */}
        <Fade in timeout={400}>
          <StyledCard>
            <CardContent>
              {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <form id="profileForm" onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" mb={2}>What's your age?</Typography>
                    <Typography color="text.secondary" mb={4}>This helps us customize content difficulty</Typography>
                    <TextField fullWidth name="age" type="number" value={formData.age} onChange={handleInputChange} inputProps={{ min: 5, max: 100 }} required placeholder="Enter your age" variant="outlined" InputProps={{ sx: { borderRadius: 8, fontSize: '1.125rem' } }} sx={{ mb: 4 }}/>
                    <Box display="flex" justifyContent="flex-end">
                      <NextButton type="button" onClick={nextStep}>Next</NextButton>
                    </Box>
                  </Box>
                )}

                {currentStep === 2 && (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" mb={2}>Current Education Level</Typography>
                    <Typography color="text.secondary" mb={4}>Select your current education status</Typography>
                    <Select fullWidth name="education" value={formData.education} onChange={handleInputChange} required displayEmpty renderValue={(value) => value ? educationMap[value] : 'Select your education level'} variant="outlined" sx={{ mb: 4, borderRadius: 8, fontSize: '1.125rem' }}>
                      {Object.entries(educationMap).map(([key, value]) => (<MenuItem key={key} value={key}>{value}</MenuItem>))}
                    </Select>
                    <Box display="flex" justifyContent="space-between">
                      <Button type="button" onClick={prevStep} color="inherit">Back</Button>
                      <NextButton type="button" onClick={nextStep}>Next</NextButton>
                    </Box>
                  </Box>
                )}

                {currentStep === 3 && (
                   <Box>
                     <Typography variant="h5" fontWeight="bold" mb={2}>What would you like to learn?</Typography>
                     <Typography color="text.secondary" mb={4}>Choose your primary area of interest</Typography>
                     <Select fullWidth name="course" value={formData.course} onChange={handleInputChange} required displayEmpty renderValue={(value) => (value ? courseMap[value] : 'Choose Your Area of Interest')} variant="outlined" sx={{ mb: 4, borderRadius: 8, fontSize: '1.125rem' }}>
                       {Object.entries(courseMap).map(([key, value]) => (<MenuItem key={key} value={key}>{value}</MenuItem>))}
                     </Select>
                     <Box display="flex" justifyContent="space-between">
                       <Button type="button" onClick={prevStep} color="inherit">Back</Button>
                       <NextButton type="button" onClick={nextStep}>Next</NextButton>
                     </Box>
                   </Box>
                )}

                {currentStep === 4 && (
                  <Box>
                    <Typography variant="h5" fontWeight="700" mb={1}>Your Knowledge Level</Typography>
                    <Typography color="text.secondary" mb={4}>How would you rate your current knowledge in this area of interest?</Typography>
                    <Grid container spacing={2} mb={4}>
                      {[
                        // IMPORTANT: 'level' value MUST match backend enum ('Beginner', 'Intermediate', 'Expert')
                        { level: 'Beginner', emoji: '🌱', title: 'Beginner', desc: 'Just starting out or need to review basics' },
                        { level: 'Intermediate', emoji: '🌿', title: 'Intermediate', desc: 'Have some experience and want to build on it' },
                        { level: 'Expert', emoji: '🌳', title: 'Expert', desc: 'Looking for deeper concepts' },
                      ].map((item) => (
                        <Grid item xs={12} sm={4} key={item.level}>
                          <KnowledgeCard selected={formData.knowledgeLevel === item.level} onClick={() => selectKnowledge(item.level)}>
                            <Typography variant="h2" sx={{ fontSize: '2.5rem', mb: 2 }}>{item.emoji}</Typography>
                            <Typography variant="h6" fontWeight="bold" mb={1}>{item.title}</Typography>
                            <Typography color="text.secondary" variant="body2">{item.desc}</Typography>
                          </KnowledgeCard>
                        </Grid>
                      ))}
                    </Grid>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Button type="button" onClick={prevStep} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }} disabled={loading}>Back</Button>
                      <SubmitButton type="submit" disabled={loading}>{loading ? 'Saving...' : 'Complete Profile'}</SubmitButton>
                    </Box>
                  </Box>
                )}

                {currentStep === 5 && (
                  <Box textAlign="center">
                    <Box sx={{width:80,height:80,bgcolor:'success.light',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',mx:'auto',mb:3,}}><Typography variant="h2">🎉</Typography></Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>Profile Complete!</Typography>
                    <Typography color="text.secondary" mb={4} variant="h6">Your AI Tutor is now personalized and ready to help you learn!</Typography>
                    <NextButton onClick={startLearning} sx={{ px: 6, py: 2, fontSize: '1.125rem' }}>Start Learning Journey</NextButton>
                  </Box>
                )}
              </form>
            </CardContent>
          </StyledCard>
        </Fade>
      </Container>
    </GradientBox>
  );
};

export default ProfileComplete;