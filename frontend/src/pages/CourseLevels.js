import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button, LinearProgress, Divider, CircularProgress, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const CourseLevels = () => {
    // Levels is now an object grouped by language: { htmlcssjs: [...], prompt_engineering: [...] }
    const [courses, setCourses] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchAllLevels = async () => {
            const token = localStorage.getItem('authToken');
            try {
                // Hitting the correct backend route to get all courses
                const res = await axios.get(`${BACKEND_URL}/api/courses/all-levels-status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching all course levels:", err);
                setLoading(false);
            }
        };
        fetchAllLevels();
    }, [BACKEND_URL]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    }
    
    const availableLanguages = Object.keys(courses);

    if (availableLanguages.length === 0) {
        return (
            <DashboardLayout>
                <Alert severity="warning">
                    No courses found in the database. Please contact support or check the seeding script.
                </Alert>
            </DashboardLayout>
        );
    }

    // Utility function to make language names user-friendly
    const formatLanguageName = (lang) => {
        if (lang === 'htmlcssjs') return 'HTML / CSS / JS';
        if (lang === 'prompt_engineering') return 'PROMPT ENGINEERING';
        return lang.replace(/_/g, ' ').toUpperCase();
    };
    
    // Utility function to clean up the level title
    const formatLevelTitle = (title, language, level) => {
        // Simple case: if the title is the raw 'lang Level X', just display 'Level X'
        if (title.toLowerCase().includes(language)) {
            return `Level ${level}`;
        }
        return title;
    };


    return (
        <DashboardLayout>
            <Typography variant="h4" fontWeight="bold" gutterBottom>All Available Courses</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                Explore all courses and levels to expand your skills.
            </Typography>

            {availableLanguages.map((language, langIndex) => (
                <Box key={language} sx={{ mb: 6 }}>
                    <Typography 
                        variant="h5" 
                        fontWeight="bold" 
                        sx={{ mb: 3, color: '#6D53D3' }}
                    >
                        {formatLanguageName(language)}
                    </Typography>
                    
                    <Grid container spacing={3}>
                        {courses[language].map((lvl) => (
                            <Grid item xs={12} md={4} key={lvl.level}>
                                <Paper sx={{ 
                                    p: 3, 
                                    borderRadius: 4, 
                                    opacity: lvl.status === 'locked' ? 0.7 : 1,
                                    border: lvl.status === 'unlocked' ? '2px solid #6D53D3' : 'none'
                                }}>
                                    
                                    {lvl.status === 'completed' && (
                                        <CheckCircleIcon color="success" sx={{ float: 'right', fontSize: 24 }} />
                                    )}

                                    <Typography variant="overline" color="textSecondary" fontWeight="bold">
                                        LEVEL {lvl.level}
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                                        {formatLevelTitle(lvl.title, language, lvl.level)}
                                    </Typography>
                                    
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>Progress: {lvl.percentage}%</Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={lvl.percentage} 
                                            sx={{ height: 8, borderRadius: 5 }} 
                                            color={lvl.status === 'completed' ? 'success' : 'primary'}
                                        />
                                    </Box>

                                   <Button 
                                        fullWidth 
                                        variant="contained" 
                                        disabled={lvl.status === 'locked'}
                                        startIcon={lvl.status === 'locked' ? <LockIcon /> : <PlayArrowIcon />}
                                        // CORRECTED NAVIGATION: Uses 'language' from outer scope
                                        onClick={() => navigate(`/learn/${language}/${lvl.level}`)} 
                                        sx={{ bgcolor: lvl.status === 'locked' ? '#ccc' : '#6D53D3' }}
                                    >
                                        {lvl.status === 'locked' ? "Locked" : (lvl.status === 'completed' ? "Review Level" : "Start/Continue")}
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                    {langIndex < availableLanguages.length - 1 && <Divider sx={{ my: 4 }} />}
                </Box>
            ))}
        </DashboardLayout>
    );
};

export default CourseLevels;