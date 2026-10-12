import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper, Stack, CircularProgress,
  Alert, Fade, IconButton, Tooltip, Dialog, AppBar, Toolbar, Slide, Skeleton
} from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';

// Icons
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AiWebsiteCreator = () => {
  const [prompt, setPrompt] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [openFullView, setOpenFullView] = useState(false);

  // NEW: State to track if we are editing an existing project
  const [activeProjectId, setActiveProjectId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation(); // NEW: Hook to catch data from Project Manager
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const token = localStorage.getItem('authToken');

  // --- NEW: EFFECT TO LOAD PROJECT FROM NAVIGATION STATE ---
  useEffect(() => {
    if (location.state?.existingProject) {
      const project = location.state.existingProject;
      setActiveProjectId(project._id);
      setPreviewData(project.content); // Load the existing HTML into preview
      setInitialPrompt(project.title); // Set the title for the publish flow
    }
  }, [location]);

  // --- HELPER: ENHANCE PROMPT FOR ACCURACY ---
  const getEnhancedPrompt = (userPrompt, isEdit) => {
    if (isEdit) return userPrompt; 
    
    return `Act as a Senior UI/UX Designer. Create a premium, highly detailed website for: "${userPrompt}". 
    The design must include:
    - A stunning Hero section with a clear value proposition.
    - Full responsiveness (mobile-friendly).
    - Modern components (Cards, Glassmorphism, Gradients).
    - Use high-quality imagery from Unsplash.
    - Professional typography (Inter/Poppins) and generous whitespace.
    - Smooth AOS animations on every section.
    - A functional-looking contact footer.`;
  };

  const handleAiAction = async (isEdit = false) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');

    const finalPrompt = getEnhancedPrompt(prompt, isEdit);
    if (!isEdit) setInitialPrompt(prompt);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/ai/generate-website`,
        { 
          prompt: finalPrompt, 
          existingHtml: isEdit ? previewData.html : null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.html) {
        setPreviewData(res.data);
        setPrompt(''); 
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (err) {
      console.error(err);
      setError('The AI Designer encountered an error. Please try a more descriptive prompt.');
    } finally {
      setLoading(false);
    }
  };

  const saveAndPublish = async () => {
    if (!previewData) return;
    setPublishing(true);
    try {
      let projectId = activeProjectId;

      // 1. If not editing an existing project, create a new one first
      if (!projectId) {
        const projectRes = await axios.post(`${BACKEND_URL}/api/projects`, 
          { title: initialPrompt || "AI Generated Site" }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        projectId = projectRes.data._id;
        setActiveProjectId(projectId);
      }

      // 2. Update the project with the latest HTML
      await axios.put(`${BACKEND_URL}/api/projects/${projectId}`, 
        { content: previewData }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Publish the project
      const publishRes = await axios.post(`${BACKEND_URL}/api/projects/${projectId}/publish`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(activeProjectId ? "Project Updated Successfully! 🚀" : `Website Live! 🚀 URL: ${publishRes.data.url}`);
      navigate('/projects'); 

    } catch (err) {
      alert('Failed to publish project. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 5 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#1e293b' }}>
            AI Design Studio
          </Typography>
          <Box sx={{ px: 1.5, py: 0.5, bgcolor: '#e0e7ff', color: '#4338ca', borderRadius: 2, fontSize: '0.75rem', fontWeight: 'bold' }}>
            {activeProjectId ? "EDIT MODE" : "PRO v3.1"}
          </Box>
        </Stack>

        <Paper sx={{ 
          p: 4, borderRadius: 6, mb: 4, 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
          background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)'
        }}>
          <Typography variant="h6" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
            {previewData ? <HistoryEduIcon sx={{ color: '#8b5cf6' }}/> : <AutoFixHighIcon sx={{ color: '#6366f1' }}/>}
            {previewData ? (activeProjectId ? `Editing: ${initialPrompt}` : "Request Design Changes") : "What can I build for you today?"}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder={previewData 
              ? "Example: Change the theme to Dark Mode, add a Pricing section, or change the main font to Serif..." 
              : "Example: A high-end landing page for a Luxury Watch brand with a dark gold theme..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'white' }
            }}
          />

          <Stack direction="row" spacing={2}>
            {!previewData ? (
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                onClick={() => handleAiAction(false)} 
                disabled={loading || !prompt}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RocketLaunchIcon />}
                sx={{ 
                  py: 2, borderRadius: 4, fontWeight: 800, fontSize: '1.1rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                }}
              >
                {loading ? "Architecting your site..." : "Generate Masterpiece"}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                onClick={() => handleAiAction(true)} 
                disabled={loading || !prompt}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                sx={{ 
                  py: 2, borderRadius: 4, fontWeight: 800, bgcolor: '#1e293b',
                  '&:hover': { bgcolor: '#0f172a' }
                }}
              >
                {loading ? "Updating Code..." : "Apply Smart Edits"}
              </Button>
            )}
          </Stack>
          
          {error && (
            <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mt: 2, borderRadius: 3 }}>
              {error}
            </Alert>
          )}
        </Paper>

        {/* --- PREVIEW AREA --- */}
        {(loading || previewData) && (
          <Fade in timeout={800}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                <Typography variant="h6" fontWeight="800" color="#475569">Live Preview</Typography>
                {previewData && !loading && (
                  <Stack direction="row" spacing={1.5}>
                    <Tooltip title="Fullscreen">
                      <IconButton onClick={() => setOpenFullView(true)} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                        <FullscreenIcon />
                      </IconButton>
                    </Tooltip>
                    <Button 
                      variant="outlined" 
                      onClick={() => { setPreviewData(null); setInitialPrompt(''); setActiveProjectId(null); }}
                      sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={saveAndPublish} 
                      disabled={publishing}
                      sx={{ borderRadius: 3, fontWeight: 700, px: 4, textTransform: 'none' }}
                    >
                      {publishing ? 'Saving Changes...' : (activeProjectId ? 'Update Site' : 'Launch Website')}
                    </Button>
                  </Stack>
                )}
              </Stack>

              <Box sx={{ 
                border: '12px solid #0f172a', 
                borderRadius: 8, 
                overflow: 'hidden', 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
                bgcolor: 'white',
                minHeight: '600px',
                position: 'relative'
              }}>
                {loading ? (
                  <Box sx={{ p: 4 }}>
                    <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 2, borderRadius: 2 }} />
                    <Skeleton variant="rectangular" width="100%" height={400} sx={{ mb: 2, borderRadius: 4 }} />
                    <Stack direction="row" spacing={2}>
                      <Skeleton variant="circular" width={60} height={60} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="60%" />
                        <Skeleton width="40%" />
                      </Box>
                    </Stack>
                  </Box>
                ) : (
                <iframe
                  key={previewData?.html ? `v-${previewData.html.length}-${Date.now()}` : 'empty'}
                  title="AI Website Preview"
                  srcDoc={previewData?.html}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  style={{ 
                    width: '100%', 
                    height: '700px', 
                    border: 'none',
                    overflow: 'auto' 
                  }}
                />
                )}
              </Box>
            </Box>
          </Fade>
        )}
      </Box>

      {/* --- FULL PAGE DIALOG --- */}
      <Dialog
        fullScreen
        open={openFullView}
        onClose={() => setOpenFullView(false)}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative', background: '#0f172a', boxShadow: 'none' }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1, fontWeight: 800 }} variant="h6">
              Design Review Mode
            </Typography>
            <Button autoFocus color="inherit" onClick={() => setOpenFullView(false)} startIcon={<CloseIcon />}>
              Close Preview
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {previewData && (
            <iframe
              title="Full Preview"
              srcDoc={previewData.html}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </Box>
      </Dialog>
    </DashboardLayout>
  );
};

export default AiWebsiteCreator;