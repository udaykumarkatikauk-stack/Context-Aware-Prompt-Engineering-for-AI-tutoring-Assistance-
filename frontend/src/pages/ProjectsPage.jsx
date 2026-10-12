import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  InputAdornment,
  Grid,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // NEW ICON
import DashboardLayout from '../components/DashboardLayout';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Edit States
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const navigate = useNavigate(); // NEW: Hook for navigation
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const token = localStorage.getItem('authToken');

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch {
      setError('Could not load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- UPDATE TITLE FUNCTION ---
  const handleRename = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await axios.put(
        `${BACKEND_URL}/api/projects/${id}`,
        { title: editTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      alert("Failed to rename project.");
    }
  };

  const publishProject = async (id) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/projects/${id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Published 🎉\n${res.data.url}`);
      fetchProjects();
    } catch (err) {
      alert("Error publishing project");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project permanently?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProjects();
    } catch (err) {
      alert("Failed to delete project.");
    }
  };

  // --- FILTERING & STATS ---
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCreated = projects.length;
  const totalPublished = projects.filter(p => p.isPublished).length;

  if (loading) return <DashboardLayout><Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box></DashboardLayout>;

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🧩 Project Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage, search, and edit your AI-generated websites.
        </Typography>
      </Box>

      {/* STATS SECTION */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">{totalCreated}</Typography>
            <Typography variant="body2" color="text.secondary">Total Projects Created</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #dcfce7' }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">{totalPublished}</Typography>
            <Typography variant="body2" color="text.secondary">Websites Published</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* SEARCH BAR */}
      <TextField
        fullWidth
        placeholder="Search projects by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 4, bgcolor: 'white' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* PROJECT LIST */}
      <Stack spacing={3}>
        {filteredProjects.length === 0 && (
          <Typography textAlign="center" color="text.secondary" py={4}>
            {searchQuery ? "No projects match your search." : "No projects found."}
          </Typography>
        )}

        {filteredProjects.map((project) => (
          <Paper key={project._id} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                {editingId === project._id ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                    />
                    <IconButton color="success" onClick={() => handleRename(project._id)}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setEditingId(null)}>
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight="bold" variant="h6">
                      {project.title}
                    </Typography>
                    <IconButton size="small" onClick={() => {
                      setEditingId(project._id);
                      setEditTitle(project.title);
                    }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}

                <Typography color="text.secondary" mt={0.5} variant="body2">
                  Status: <span style={{ 
                    color: project.isPublished ? '#2e7d32' : '#ed6c02', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem'
                  }}>
                    {project.isPublished ? 'Live' : 'Draft'}
                  </span>
                </Typography>
              </Box>

              <IconButton color="error" onClick={() => deleteProject(project._id)}>
                <DeleteIcon />
              </IconButton>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={2}>
              {/* NEW CONTINUE EDITING OPTION */}
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<AutoFixHighIcon />}
                onClick={() => navigate('/ai-create', { state: { existingProject: project } })}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Continue Editing
              </Button>

              {!project.isPublished && (
                <Button
                  variant="outlined"
                  onClick={() => publishProject(project._id)}
                  size="small"
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Publish Now
                </Button>
              )}

              {project.isPublished && (
                <Button
                  variant="outlined"
                  onClick={() => window.open(`${BACKEND_URL}/p/${project.slug}`, '_blank')}
                  size="small"
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Visit Website
                </Button>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </DashboardLayout>
  );
};

export default ProjectsPage;