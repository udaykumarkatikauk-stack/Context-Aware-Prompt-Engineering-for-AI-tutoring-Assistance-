import React, { useState } from 'react';
import axios from 'axios';
import { 
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    Box, Paper, Typography, Button, CircularProgress, Alert, Table, 
    TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Grid, Card, CardContent, Divider 
} from '@mui/material';

// Icons for the UI
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScienceIcon from '@mui/icons-material/Science';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const EvaluationPage = () => {
    const [evalData, setEvalData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    const runAccuracyTest = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken'); 
            if (!token) {
                setError("Authentication session expired. Please log in again.");
                setLoading(false);
                return;
            }

            const response = await axios.get(`${BACKEND_URL}/api/admin/run-accuracy-test`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Expected data format from backend:
            // Array of { id: "Question...", baseline: 65.2, proposed: 92.1 }
            setEvalData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Internal Server Error: Failed to generate evaluation data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summary Stats for IEEE Paper
    const calculateAverages = () => {
        if (!evalData || evalData.length === 0) return { baseline: 0, proposed: 0, lift: 0 };
        const avgBaseline = evalData.reduce((acc, curr) => acc + parseFloat(curr.baseline), 0) / evalData.length;
        const avgProposed = evalData.reduce((acc, curr) => acc + parseFloat(curr.proposed), 0) / evalData.length;
        return {
            baseline: avgBaseline.toFixed(2),
            proposed: avgProposed.toFixed(2),
            lift: (avgProposed - avgBaseline).toFixed(2)
        };
    };

    const stats = calculateAverages();

    return (
        <Box sx={{ p: 3 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScienceIcon fontSize="large" color="primary" /> System Evaluation Metrics
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Comparative Analysis: Baseline LLM vs. Proposed RAG Architecture (Cosine Similarity)
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                    onClick={runAccuracyTest}
                    disabled={loading}
                    sx={{ 
                        bgcolor: '#6D53D3', 
                        px: 4, 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#5a42b8' } 
                    }}
                >
                    {loading ? "Evaluating Model..." : "Run Accuracy Test"}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {!evalData && !loading && (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #ccc', bgcolor: 'transparent' }}>
                    <Typography variant="h6" color="textSecondary">
                        No evaluation data available. Click the button above to begin the comparative test.
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        This process will query the LLM both with and without RAG to measure performance gains.
                    </Typography>
                </Paper>
            )}

            {evalData && (
                <Grid container spacing={3}>
                    {/* Summary Stats Cards */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="overline" fontWeight="bold" color="textSecondary">Mean Baseline (No RAG)</Typography>
                                <Typography variant="h3" fontWeight="800" color="#9e9e9e">{stats.baseline}%</Typography>
                                <Typography variant="body2" color="textSecondary">Standard Llama 3.3 Accuracy</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(109, 83, 211, 0.15)', border: '1px solid #6D53D3' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="overline" fontWeight="bold" color="#6D53D3">Mean Proposed (RAG)</Typography>
                                <Typography variant="h3" fontWeight="800" color="#6D53D3">{stats.proposed}%</Typography>
                                <Typography variant="body2" color="textSecondary">Knowledge Base Augmented</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, bgcolor: '#E8F5E9' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="overline" fontWeight="bold" color="#2E7D32">Performance Gain</Typography>
                                <Typography variant="h3" fontWeight="800" color="#2E7D32">+{stats.lift}%</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                    <TrendingUpIcon fontSize="small" color="success" />
                                    <Typography variant="body2" fontWeight="bold" color="#2E7D32 textSecondary">Improvement via Context</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* IEEE COMPARISON CHART */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, borderRadius: 4 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Comparative Accuracy Results (Per Test Instance)
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                                The following chart displays the semantic similarity score for each test case. 
                                The purple bar (Proposed) represents the accuracy of your RAG-enabled bot.
                            </Typography>
                            <Box sx={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart data={evalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="id" hide />
                                        <YAxis domain={[0, 100]} label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip cursor={{fill: '#f5f5f5'}} />
                                        <Legend verticalAlign="top" height={36}/>
                                        <Bar dataKey="baseline" name="Baseline (LLM Only)" fill="#BDBDBD" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="proposed" name="Proposed (RAG System)" fill="#6D53D3" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* DATA TABLE FOR EXCEL EXPORT */}
                    <Grid item xs={12}>
                        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #eee' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Test Case Question</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Baseline Score</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Proposed Score</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>Accuracy Delta</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {evalData.map((row, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ fontSize: '0.85rem' }}>{row.id}</TableCell>
                                            <TableCell align="center" sx={{ color: '#757575' }}>{row.baseline}%</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#6D53D3' }}>{row.proposed}%</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                                                +{(row.proposed - row.baseline).toFixed(1)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default EvaluationPage;