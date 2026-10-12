import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Button, List, ListItem, 
  ListItemButton, ListItemText, Divider, Chip, 
  CircularProgress, Alert, Grid 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const LearningPage = () => {
  const { language, levelId } = useParams(); 
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ show: false, msg: '', severity: 'success' });
  const [firstUncompletedLesson, setFirstUncompletedLesson] = useState(null);
  
  const [quizAttemptStatus, setQuizAttemptStatus] = useState({ attempted: false, correct: false, selectedOption: null });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // --- Utility Functions for Logic ---

  // Renamed the function to match its usage in the component body
  const advanceToNextLesson = useCallback(() => {
    if (!courseData || !activeLesson) return;

    const currentModIndex = courseData.modules.findIndex(m => m.id === activeLesson.moduleId);
    const currentLessIndex = courseData.modules[currentModIndex].lessons.findIndex(l => l.id === activeLesson.id);

    // 1. Try next lesson in same module
    if (courseData.modules[currentModIndex].lessons[currentLessIndex + 1]) {
        const next = courseData.modules[currentModIndex].lessons[currentLessIndex + 1];
        setActiveLesson({ ...next, moduleId: activeLesson.moduleId });
    } 
    // 2. Try first lesson of next module
    else if (courseData.modules[currentModIndex + 1]) {
        const nextMod = courseData.modules[currentModIndex + 1];
        setActiveLesson({ ...nextMod.lessons[0], moduleId: nextMod.id });
    } 
    // 3. End of level
    else {
        setFeedback({ show: true, msg: 'Level Complete! Returning to path...', severity: 'success' });
        setTimeout(() => navigate('/learn'), 2000);
    }
  }, [courseData, activeLesson, navigate]);


  const fetchCourseContent = useCallback(async () => {
    if (!language || !levelId) {
        return navigate('/learn'); 
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${BACKEND_URL}/api/courses/content/${language}/${levelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newCourseData = res.data.course;
      const newCompletedLessons = res.data.completedLessons;
      
      setCourseData(newCourseData);
      setCompletedLessons(newCompletedLessons);
      
      let nextLessonToStart = null;
      let firstUncompleted = null;

      // Find the first uncompleted lesson to set as active and track the block
      for (const module of newCourseData.modules) {
        for (const lesson of module.lessons) {
            const isDone = newCompletedLessons.some(l => l.lessonId === lesson.id && l.moduleId === module.id);
            if (!isDone) {
                firstUncompleted = { moduleId: module.id, lessonId: lesson.id };
                if (!nextLessonToStart) {
                    nextLessonToStart = { ...lesson, moduleId: module.id };
                }
                break;
            }
        }
        if (firstUncompleted && !nextLessonToStart) continue;
        if (firstUncompleted && nextLessonToStart) break;
      }
      
      setFirstUncompletedLesson(firstUncompleted);

      if (!nextLessonToStart) {
          const lastModule = newCourseData.modules[newCourseData.modules.length - 1];
          nextLessonToStart = { ...lastModule.lessons[lastModule.lessons.length - 1], moduleId: lastModule.id };
      }

      setActiveLesson(nextLessonToStart);
      setLoading(false);

    } catch (err) {
      console.error("Error loading course:", err);
      setLoading(false);
      if (err.response?.status === 404) {
          setFeedback({ show: true, msg: `Course not found for ${language} Level ${levelId}.`, severity: 'error' });
      }
    }
  }, [language, levelId, BACKEND_URL, navigate]);

  // Reset quiz status whenever the active lesson changes
  useEffect(() => {
    setQuizAttemptStatus({ attempted: false, correct: false, selectedOption: null });
  }, [activeLesson]);


  useEffect(() => {
    fetchCourseContent();
  }, [fetchCourseContent]);


  const markLessonComplete = async () => {
    if (!activeLesson) return;

    // Quiz Check: If it's a quiz and not correct, do not proceed (optional strictness)
    if (activeLesson.type === 'quiz' && !quizAttemptStatus.correct) {
        setFeedback({ show: true, msg: 'Please select the correct answer before continuing!', severity: 'warning' });
        setTimeout(() => setFeedback(f => ({ ...f, show: false })), 5000);
        return;
    }


    const lessonData = { moduleId: activeLesson.moduleId, lessonId: activeLesson.id };
    const alreadyCompleted = completedLessons.some(
        l => l.lessonId === lessonData.lessonId && l.moduleId === lessonData.moduleId
    );

    if (alreadyCompleted) {
        setFeedback({ show: true, msg: 'This lesson is already complete. Moving to next...', severity: 'info' });
        setTimeout(() => setFeedback(f => ({ ...f, show: false })), 3000);
        return advanceToNextLesson(); // Use the correct function name
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        await axios.post(`${BACKEND_URL}/api/courses/complete-lesson`, {
            courseId: courseData._id,
            ...lessonData
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setCompletedLessons(prev => [...prev, lessonData]);
        setFirstUncompletedLesson(null); 
        
        setFeedback({ show: true, msg: 'Progress Saved! Moving to next lesson.', severity: 'success' });
        
        advanceToNextLesson(); // Use the correct function name

        setTimeout(() => setFeedback(f => ({ ...f, show: false })), 3000);

    } catch (err) {
        setFeedback({ show: true, msg: 'Failed to save progress.', severity: 'error' });
    }
  };

  const handleQuizAnswer = (selectedOption) => {
    const isCorrect = selectedOption === activeLesson.correct;
    
    setQuizAttemptStatus({
        attempted: true,
        correct: isCorrect,
        selectedOption: selectedOption
    });

    if (isCorrect) {
        setFeedback({ show: true, msg: 'Correct! Now click "Save & Next Lesson" to continue.', severity: 'success' });
    } else {
        setFeedback({ show: true, msg: 'That is not correct. Try again!', severity: 'error' });
    }
  };

  if (loading || !activeLesson) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!courseData) return <Alert severity="error">Course not found.</Alert>;

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 120px)' }}>
        
        {/* Sidebar */}
        <Paper sx={{ width: 320, overflowY: 'auto', p: 2, borderRadius: 4, bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
            {language?.toUpperCase().replace(/_/g, ' ')} | Level {levelId}
          </Typography>
          {courseData.modules.map((module) => (
            <Box key={module.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#6D53D3', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
                {module.title}
              </Typography>
              <List size="small" sx={{ mt: 1 }}>
                {module.lessons.map((lesson) => {
                  const isDone = completedLessons.some(l => l.lessonId === lesson.id && l.moduleId === module.id);
                  const isActive = activeLesson?.id === lesson.id && activeLesson?.moduleId === module.id;
                  
                  // --- SEQUENTIAL LEARNING LOGIC ---
                  let isDisabled = false;
                  // If the lesson is NOT completed and the lesson ID is higher than the first uncompleted one, disable it
                  if (!isDone && firstUncompletedLesson) {
                    // This is a simplified check that works for a mostly linear flow
                    const isBeyondUncompleted = (module.id > firstUncompletedLesson.moduleId) || 
                                               (module.id === firstUncompletedLesson.moduleId && lesson.id > firstUncompletedLesson.lessonId);
                    if (isBeyondUncompleted) {
                        isDisabled = true;
                    }
                  }
                  // --- END LOGIC ---

                  return (
                    <ListItem key={lesson.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton 
                        selected={isActive}
                        onClick={() => {
                            if (!isDisabled) {
                                setActiveLesson({ ...lesson, moduleId: module.id });
                            }
                        }}
                        disabled={isDisabled}
                        sx={{ 
                            borderRadius: 2, 
                            '&.Mui-selected': { bgcolor: 'rgba(109, 83, 211, 0.1)', color: '#6D53D3' },
                            opacity: isDisabled ? 0.5 : 1, 
                        }}
                      >
                        <ListItemText 
                          primary={lesson.title || `Lesson ${lesson.id}`} 
                          primaryTypographyProps={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}
                        />
                        {isDone && <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
              <Divider sx={{ my: 1, opacity: 0.5 }} />
            </Box>
          ))}
        </Paper>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {feedback.show && <Alert severity={feedback.severity} sx={{ borderRadius: 2 }}>{feedback.msg}</Alert>}

          <Paper sx={{ p: 5, borderRadius: 4, flexGrow: 1, overflowY: 'auto', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
            <Chip label={activeLesson.type?.toUpperCase()} color="primary" variant="outlined" size="small" sx={{ mb: 2, fontWeight: 'bold' }} />
            <Typography variant="h4" fontWeight="800" sx={{ color: '#2D3748' }} gutterBottom>
              {activeLesson.title}
            </Typography>
            
            <Box sx={{ mt: 4 }}>
              {activeLesson.type === 'info' && (
                <Typography variant="body1" sx={{ color: '#4A5568', fontSize: '1.15rem', lineHeight: 1.8 }}>
                  {activeLesson.content}
                </Typography>
              )}

              {activeLesson.type === 'quiz' && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, color: '#2D3748' }}>{activeLesson.question || activeLesson.title}</Typography>
                  <Grid container spacing={2}>
                    {activeLesson.options?.map((opt, idx) => {
                        const isCorrect = opt === activeLesson.correct;
                        const isSelected = opt === quizAttemptStatus.selectedOption;
                        
                        let buttonColor = 'outlined';
                        let buttonStyle = {};

                        if (quizAttemptStatus.attempted) {
                            if (isCorrect) {
                                buttonColor = 'success';
                                buttonStyle = { border: '2px solid #4CAF50' };
                            } else if (isSelected && !isCorrect) {
                                buttonColor = 'error';
                                buttonStyle = { border: '2px solid #F44336' };
                            }
                        }

                        return (
                            <Grid item xs={12} sm={6} key={idx}>
                                <Button 
                                    fullWidth 
                                    variant={buttonColor}
                                    sx={{ 
                                        justifyContent: 'flex-start', p: 2, borderRadius: 3, textTransform: 'none', 
                                        ...buttonStyle
                                    }}
                                    onClick={() => handleQuizAnswer(opt)}
                                    disabled={quizAttemptStatus.attempted && !isCorrect} // Disable after a correct answer or after an incorrect attempt unless correct is chosen
                                >
                                    {opt}
                                </Button>
                            </Grid>
                        );
                    })}
                  </Grid>
                </Box>
              )}

              {(activeLesson.type === 'codeChallenge' || activeLesson.type === 'code_fill_in_the_blank') && (
                <Box>
                  <Typography sx={{ mb: 3, color: '#4A5568' }}>{activeLesson.instruction || activeLesson.title}</Typography>
                  <Paper sx={{ p: 3, bgcolor: '#1a202c', color: '#e2e8f0', borderRadius: 3, fontFamily: 'monospace' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {activeLesson.starterCode || activeLesson.blocks?.join(' ')}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Typography variant="caption" color="textSecondary">Progress: {completedLessons.length} lessons completed in level</Typography>
            <Button 
              variant="contained" 
              size="large"
              sx={{ borderRadius: 3, px: 4, bgcolor: '#6D53D3' }}
              onClick={markLessonComplete}
              endIcon={<ArrowForwardIcon />}
              // Disable 'Save & Next' until a correct quiz answer is selected (or if it's not a quiz)
              disabled={activeLesson.type === 'quiz' && !quizAttemptStatus.correct && !completedLessons.some(l => l.lessonId === activeLesson.id && l.moduleId === activeLesson.moduleId)}
            >
              Save & Next Lesson
            </Button>
          </Box>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default LearningPage;