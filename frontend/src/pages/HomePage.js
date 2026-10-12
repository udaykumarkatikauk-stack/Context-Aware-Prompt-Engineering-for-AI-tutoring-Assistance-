// src/pages/HomePage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Link,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

// ---------- Styled Components ----------
const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

const GradientText = styled(Typography)(() => ({
  background: 'linear-gradient(90deg, #f9a8d4, #c084fc, #818cf8)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 800,
  letterSpacing: '0.5px',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  textAlign: 'center',
  transition: 'all 0.4s ease',
  boxShadow: theme.shadows[2],
  '&:hover': {
    transform: 'translateY(-10px) scale(1.03)',
    boxShadow: theme.shadows[6],
  },
}));

const PulseButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  color: '#6d28d9',
  fontWeight: 700,
  padding: theme.spacing(2, 5),
  borderRadius: 999,
  fontSize: '1.1rem',
  animation: 'pulse 2s infinite',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
    transform: 'scale(1.05)',
  },
}));

const FloatEmoji = styled(Box)(() => ({
  animation: 'float 3s ease-in-out infinite',
}));

// ---------- Animations ----------
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

// ---------- Main Component ----------
const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => navigate('/get-started');
  const handleSignIn = () => navigate('/get-started');

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // Inject CSS keyframes once
  useEffect(() => {
    if (!document.getElementById('home-page-animations')) {
      const styles = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(125, 90, 255, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(125, 90, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(125, 90, 255, 0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `;
      const styleSheet = document.createElement('style');
      styleSheet.id = 'home-page-animations';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }, []);

  return (
    <>
      {/* Navigation */}
      <Box sx={{ bgcolor: 'white', boxShadow: 1, position: 'sticky', top: 0, zIndex: 1000 }}>
        <Container
          maxWidth="lg"
          sx={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <GradientText variant="h4">🎓 AI Tutor</GradientText>
          <Box display="flex" gap={2}>
            <Button onClick={() => scrollToSection('features')} color="inherit">
              Features
            </Button>
            <Button onClick={() => scrollToSection('about')} color="inherit">
              About
            </Button>
            <Button variant="contained" color="secondary" onClick={handleSignIn}>
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <GradientBox>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <motion.div variants={fadeInUp} initial="hidden" animate="show">
            <FloatEmoji sx={{ mb: 4 }}>
              <Typography variant="h1" sx={{ fontSize: '5rem' }}>
                🤖
              </Typography>
            </FloatEmoji>

            <GradientText
              variant="h2"
              sx={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                mb: 2,
              }}
            >
              Meet Your AI Tutor
            </GradientText>

            <Typography
              variant="h6"
              color="#e0e7ff"
              sx={{
                maxWidth: 800,
                mx: 'auto',
                mb: 4,
                fontSize: '1.25rem',
                lineHeight: 1.7,
              }}
            >
              Personalized learning powered by artificial intelligence. Get instant help,
              adaptive lessons, and achieve your learning goals faster than ever.
            </Typography>

            <PulseButton onClick={handleGetStarted}>🚀 Get Started Free</PulseButton>

            <Typography color="#ddd6fe" mt={2}>
              Start Learning • Improve Faster • Achieve More
            </Typography>
          </motion.div>
        </Container>
      </GradientBox>

      {/* Features Section */}
      <Box id="features" sx={{ py: 10, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <Typography
              variant="h3"
              fontWeight="bold"
              textAlign="center"
              mb={3}
              sx={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
              }}
            >
              Why Choose <GradientText variant="inherit">AI Tutor?</GradientText>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              textAlign="center"
              mb={10}
              maxWidth={720}
              mx="auto"
            >
              Experience the future of personalized education with our advanced AI assistant.
            </Typography>

            <Grid container spacing={4}>
              {[
                { icon: '⚡', title: 'Instant Answers', desc: 'Get immediate help with any question. Our AI understands context and provides detailed explanations 24/7.', color: '#bfdbfe' },
                { icon: '🎯', title: 'Personalized Learning', desc: 'Adaptive curriculum that adjusts to your pace, learning style, and knowledge level.', color: '#d1fae5' },
                { icon: '📊', title: 'Progress Tracking', desc: 'Monitor your learning journey with detailed analytics and celebrate achievements.', color: '#e9d5ff' },
                { icon: '🧠', title: 'Smart Explanations', desc: 'Complex concepts broken down into simple, understandable steps with visuals.', color: '#fefcbf' },
                { icon: '🌍', title: 'All Subjects', desc: 'From math and science to languages and arts - comprehensive academic support.', color: '#fee2e2' },
                { icon: '💡', title: 'Interactive Learning', desc: 'Engage with quizzes, practice problems, and interactive exercises.', color: '#e0e7ff' },
              ].map((f, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
                    <FeatureCard>
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          bgcolor: f.color,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                        }}
                      >
                        <Typography variant="h3">{f.icon}</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold" mb={2}>
                        {f.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
                        {f.desc}
                      </Typography>
                    </FeatureCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* CTA Section */}
      <GradientBox sx={{ py: 10, textAlign: 'center' }}>
        <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <Container maxWidth="md">
            <GradientText
              variant="h3"
              sx={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                mb: 2,
              }}
            >
              Transform Your Learning Today
            </GradientText>
            <Typography variant="h6" color="#ddd6fe" mb={4}>
              Don’t let difficult subjects hold you back. Get the personalized help you need to
              succeed.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
              }}
            >
              <PulseButton onClick={handleGetStarted}>Get Started Free</PulseButton>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => scrollToSection('features')}
                sx={{ borderWidth: 2, px: 4, py: 2, borderRadius: 999 }}
              >
                Learn More
              </Button>
            </Box>
            <Typography color="#ddd6fe" mt={3}>
              ✨ Free trial • No commitment • Cancel anytime
            </Typography>
          </Container>
        </motion.div>
      </GradientBox>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', py: 6, color: 'white' }}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <GradientText variant="h4" mb={1}>
              🎓 AI Tutor
            </GradientText>
            <Typography color="grey.400" mb={3}>
              Empowering learners worldwide with AI-powered education
            </Typography>
            <Box display="flex" justifyContent="center" gap={4} mb={3}>
              {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Help Center'].map((item, i) => (
                <Link key={i} href="#" color="grey.400" underline="hover">
                  {item}
                </Link>
              ))}
            </Box>
            <Typography color="grey.500">
              © {new Date().getFullYear()} AI Tutor. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;
