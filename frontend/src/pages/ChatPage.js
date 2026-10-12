// src/pages/ChatPage.js

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; 
// --- NEW IMPORTS FOR CODE HIGHLIGHTING ---
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import {
  Box,
  TextField,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { v4 as uuidv4 } from 'uuid';

// --- ICONS ---
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';


// --- STYLES ---
const ChatContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#F9FAFB',
});

const StyledAppBar = styled(AppBar)({
  background: 'linear-gradient(90deg, #6D53D3 0%, #8A6EE2 100%)',
  boxShadow: 'none',
  minHeight: '88px',
  justifyContent: 'center',
});

const MessageWindow = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '24px',
});

const MessageRow = styled(Box)(({ owner }) => ({
  display: 'flex',
  justifyContent: owner === 'user' ? 'flex-end' : 'flex-start',
  marginBottom: '16px',
}));

const TutorAvatar = styled(Avatar)({
  backgroundColor: '#8A6EE2',
  width: 40,
  height: 40,
  marginRight: '12px',
});

const MessageBubble = styled(Paper)(({ theme, owner }) => ({
  padding: '16px 22px',
  maxWidth: '85%', 
  backgroundColor: owner === 'user' ? '#6D53D3' : '#FFFFFF',
  color: owner === 'user' ? theme.palette.common.white : theme.palette.text.primary,
  boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
  border: owner === 'user' ? 'none' : '1px solid #E5E7EB',
  borderRadius: owner === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
}));

const MarkdownContent = styled(Box)(({ owner, theme }) => ({
  fontSize: '1.1rem',
  lineHeight: 1.5,
  width: '100%',
  '& p': {
    margin: '8px 0',
  },
  '& ul, & ol': {
    paddingLeft: '20px',
    marginTop: '8px',
    marginBottom: 0,
  },
  '& li': {
    marginBottom: '4px',
  },
  '& strong': {
      color: owner === 'user' ? 'inherit' : '#374151',
  },
  '& pre': {
  background: '#1e1e1e !important',
  padding: '0 !important',
  margin: '16px 0 !important',
  borderRadius: '8px',
},
  '& code': {
    fontFamily: '"Fira Code", "Cascadia Code", "Source Code Pro", monospace !important',
  }
}));

const Timestamp = styled(Typography)({
  fontSize: '0.8rem',
  color: '#9E9E9E',
  marginTop: '8px',
  textAlign: 'left'
});

const UserTimestamp = styled(Timestamp)({
    color: 'rgba(255, 255, 255, 0.7)',
});

const InputArea = styled(Paper)({
  display: 'flex',
  alignItems: 'center',
  padding: '18px 24px',
  backgroundColor: '#ffffff',
  borderRadius: 0,
  boxShadow: '0px -2px 10px rgba(0,0,0,0.05)',
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '28px',
    backgroundColor: '#F3F4F6',
    '& fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: '1px solid #6D53D3',
    },
  },
  '& .MuiInputBase-input': {
    padding: '16px 24px',
    fontSize: '1.1rem'
  }
});

const SendButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: '#8A6EE2',
  color: theme.palette.common.white,
  marginLeft: '16px',
  width: '56px',
  height: '56px',
  '&:hover': {
    backgroundColor: '#6D53D3',
  },
  '&.Mui-disabled': {
      backgroundColor: '#D1C4E9',
  }
}));

// --- PERPLEXITY STYLES ---
const SourcesContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #E5E7EB'
});

const SourceChip = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '6px 12px',
  backgroundColor: '#F3F4F6',
  borderRadius: '20px',
  color: '#374151',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#E5E7EB',
    color: '#6D53D3'
  }
}));

const VideosContainer = styled(Box)({
  display: 'flex',
  gap: '12px',
  marginTop: '12px',
  overflowX: 'auto',
  paddingBottom: '8px',
  '&::-webkit-scrollbar': { height: '6px' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#D1D5DB', borderRadius: '4px' }
});

const VideoCard = styled('a')({
  minWidth: '200px',
  maxWidth: '200px',
  borderRadius: '12px',
  overflow: 'hidden',
  textDecoration: 'none',
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  display: 'block',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: '#6D53D3'
  }
});

// --- SETTINGS MODAL STYLES ---
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    padding: '16px',
    width: '380px',
    boxShadow: '0px 10px 25px rgba(0,0,0,0.1)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)({
  fontWeight: 'bold',
  padding: '8px 16px 16px 16px',
  fontSize: '1.25rem'
});

const StyledDialogContent = styled(DialogContent)({
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 16px',
  gap: '8px',
});

const StyledFormControlLabel = styled(FormControlLabel)({
  justifyContent: 'space-between',
  marginLeft: 0,
  '& .MuiFormControlLabel-label': {
      fontSize: '1rem',
      color: '#4B5563',
  },
  '& .MuiCheckbox-root': {
      color: '#D1D5DB',
      '&.Mui-checked': {
        color: '#6D53D3',
      },
  },
});

const StyledDialogActions = styled(DialogActions)({
  padding: '24px 16px 8px 16px',
  gap: '12px',
});

const CancelButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  color: theme.palette.text.secondary,
  textTransform: 'none',
  padding: '8px 24px',
  flexGrow: 1,
  fontWeight: 600,
}));

const SaveButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  background: 'linear-gradient(90deg, #6D53D3 0%, #8A6EE2 100%)',
  color: theme.palette.common.white,
  textTransform: 'none',
  padding: '8px 24px',
  flexGrow: 1,
  fontWeight: 600,
  boxShadow: '0px 4px 12px rgba(109, 83, 211, 0.3)',
}));

// --- CODE BLOCK COMPONENT WITH FIX ---
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
   <Box sx={{ 
  position: 'relative', 
  my: 2, 
  borderRadius: '10px', 
  overflow: 'hidden', 
  border: '1px solid #2a2a2a',
  backgroundColor: '#1e1e1e'
}}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        bgcolor: '#2d2d2d', 
        px: 2, py: 0.8, 
        borderBottom: '1px solid #444' 
      }}>
        <Typography variant="caption" sx={{ color: '#eee', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {language || 'code'}
        </Typography>
        <Tooltip title={copied ? "Copied!" : "Copy code"} arrow placement="left">
          <Button 
            size="small" 
            startIcon={<ContentCopyIcon sx={{ fontSize: '14px' }} />}
            onClick={handleCopy}
            sx={{ color: '#aaa', fontSize: '12px', textTransform: 'none', minWidth: 0, '&:hover': { color: '#fff' } }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </Tooltip>
      </Box>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
      customStyle={{ 
  margin: 0,
        padding: '20px',
        fontSize: '0.95rem',
        borderRadius: 0,
        background: '#1e1e1e',
        color: '#d4d4d4',
        lineHeight: '1.6'
      }}
      >
        {value}
      </SyntaxHighlighter>
    </Box>
  );
};


// --- MAIN COMPONENT ---
const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    soundNotifications: true,
    showTypingIndicators: true,
    autoScroll: true,
  });
  const [tempSettings, setTempSettings] = useState(settings);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const notificationSound = useMemo(() => 
    new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3'),
    []
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (settings.autoScroll) {
        scrollToBottom();
    }
  }, [messages, settings.autoScroll]);

  useEffect(() => {
    const fetchHistory = async () => {
      const initialMessages = [{
            id: 'initial-welcome-message',
            sender: 'tutor',
            text: "Hi there! I'm your AI Tutor assistant. I'm here to help you learn and understand any subject. What would you like to explore today?",
            timestamp: 'Just now'
        }];

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/get-started');
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/chat/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
            const formattedHistory = response.data.map(msg => ({
              id: msg._id || uuidv4(),
              sender: msg.role === 'user' ? 'user' : 'tutor',
              text: msg.parts[0]?.text || 'No content',
              videos: msg.videos || [],
              sources: msg.sources || [],
              timestamp: msg.timestamp 
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setMessages(formattedHistory);
        } else {
            setMessages(initialMessages);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
        setError('Could not load chat history. Please try again.');
        setMessages(initialMessages);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [navigate, BACKEND_URL]);

  const playNotificationSound = () => {
    if (settings.soundNotifications) {
      const playPromise = notificationSound.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              console.error("Error playing notification sound:", error);
          });
      }
    }
  };

 const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const token = localStorage.getItem('authToken');
    const userMessage = { 
        id: uuidv4(), 
        sender: 'user', 
        text: input, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/chat`,
        { message: messageToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const tutorMessage = { 
          id: uuidv4(), 
          sender: 'tutor', 
          text: response.data.reply,
          sources: response.data.sources, 
          videos: response.data.videos,   
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };

      let quizMessage = null;
      if (response.data.quiz) {
          quizMessage = {
              id: uuidv4(),
              sender: 'tutor',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quiz: {
                  ...response.data.quiz,
                  status: 'unanswered',
                  userAnswerIndex: null,      
                  correctAnswerIndex: null,   
                  feedback: ''
              }
          };
      }
      
      setMessages(prev => quizMessage ? [...prev, tutorMessage, quizMessage] : [...prev, tutorMessage]);
      playNotificationSound();

    } catch (err) {
      const errorMessage = {
        id: uuidv4(),
        sender: 'tutor',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

   const handleAnswerSubmit = async (quizId, selectedIndex, messageId) => {
      const token = localStorage.getItem('authToken');

      setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
              return { ...msg, quiz: { ...msg.quiz, status: 'submitting' } };
          }
          return msg;
      }));
      
      try {
          const response = await axios.post(`${BACKEND_URL}/api/chat/submit-answer`,
              { quizId, selectedIndex: Number(selectedIndex) }, 
              { headers: { Authorization: `Bearer ${token}` } }
          );

          setMessages(prev => prev.map(msg => {
              if (msg.id === messageId) {
                  return {
                      ...msg,
                      quiz: {
                          ...msg.quiz,
                          status: 'answered',
                          userAnswerIndex: selectedIndex,
                          correctAnswerIndex: response.data.correctAnswerIndex,
                          isCorrect: response.data.isCorrect,
                          feedback: response.data.feedback,
                      }
                  };
              }
              return msg;
          }));

      } catch (err) {
          console.error("Failed to submit answer:", err);
      }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to delete your entire chat history?")) return;
    const token = localStorage.getItem('authToken');
    try {
      // 1. Call the backend to delete data from DB
      await axios.delete(`${BACKEND_URL}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Clear UI state
      setMessages([{
          id: 'initial-welcome-message',
          sender: 'tutor',
          text: "Hi! How can I help you learn something new today?",
          timestamp: 'Just now'
      }]);
    } catch (error) {
      console.error("Failed to delete chat history:", error);
      alert("Could not clear history. Please try again.");
    }
  };

  const handleOpenSettings = () => {
    setTempSettings(settings);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => setIsSettingsOpen(false);

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    setIsSettingsOpen(false);
  };
  
  const handleSettingChange = (event) => {
    setTempSettings({
      ...tempSettings,
      [event.target.name]: event.target.checked,
    });
  };

   const QuizComponent = ({ quizData, messageId }) => {
      const { id: quizId, question, options, status, userAnswerIndex, correctAnswerIndex, feedback, isCorrect } = quizData;
      
      const getOptionStyle = (index) => {
          if (status !== 'answered') return {};
          if (index === correctAnswerIndex) {
              return { backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32', border: '1px solid #2e7d32' };
          }
          if (index === userAnswerIndex && index !== correctAnswerIndex) {
              return { backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#d32f2f', border: '1px solid #d32f2f' };
          }
          return { opacity: 0.6 };
      };

      return (
          <Box sx={{ width: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1.1rem' }}>
                  Quiz Time!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontSize: '1.05rem' }}>
                  {question}
              </Typography>
              <List sx={{ p: 0 }}>
                  {options.map((option, index) => (
                      <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                          <ListItemButton
                              sx={{ borderRadius: '8px', border: '1px solid #E0E0E0', ...getOptionStyle(index) }}
                              disabled={status !== 'unanswered'}
                              onClick={() => handleAnswerSubmit(quizId, index, messageId)} 
                          >
                              {option}
                              {status === 'answered' && index === correctAnswerIndex && <ListItemIcon sx={{minWidth: 0, ml: 'auto'}}><CheckCircleIcon color="success" /></ListItemIcon>}
                              {status === 'answered' && index === userAnswerIndex && index !== correctAnswerIndex && <ListItemIcon sx={{minWidth: 0, ml: 'auto'}}><CancelIcon color="error" /></ListItemIcon>}
                          </ListItemButton>
                      </ListItem>
                  ))}
              </List>
              {status === 'answered' && (
                  <Typography sx={{ mt: 2, fontWeight: 'bold', color: isCorrect ? '#2e7d32' : '#d32f2f' }}>
                      {feedback}
                  </Typography>
              )}
          </Box>
      );
  };

  return (
    <ChatContainer>
      <StyledAppBar position="static">
        <Toolbar sx={{ minHeight: '88px' }}>
          <IconButton edge="start" color="inherit" aria-label="back" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon sx={{ fontSize: 28 }} />
          </IconButton>
          <Avatar sx={{ width: 48, height: 48, ml: 2, mr: 2, bgcolor: '#6D53D3' }}>
            🤖
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div" sx={{ lineHeight: 1.2, fontWeight: 'bold' }}>
              AI Tutor
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Online • Ready to help
            </Typography>
          </Box>
          <IconButton color="inherit" aria-label="clear chat" onClick={handleClearChat}>
            <DeleteOutlineIcon sx={{ fontSize: 28 }} />
          </IconButton>
          <IconButton color="inherit" aria-label="settings" onClick={handleOpenSettings}>
            <SettingsIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Toolbar>
      </StyledAppBar>
      
      <MessageWindow>
          {messages.map((msg) => (
            <MessageRow key={msg.id} owner={msg.sender}>
              {msg.sender === 'tutor' && (
                <TutorAvatar>
                    🤖
                </TutorAvatar>
              )}
              <MessageBubble owner={msg.sender}>
                {msg.quiz ? (
                    <QuizComponent quizData={msg.quiz} messageId={msg.id} />
                ) : (
                    <MarkdownContent owner={msg.sender}>
                        <ReactMarkdown
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const language = match ? match[1] : '';
                                    
                                    return !inline ? (
                                        <CodeBlock 
                                          language={language} 
                                          value={String(children).replace(/\n$/, '')} 
                                        />
                                    ) : (
                                        <code 
                                          style={{ 
                                            backgroundColor: '#e0e0e0', 
                                            padding: '2px 4px', 
                                            borderRadius: '4px',
                                            color: '#d32f2f' 
                                          }} 
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </MarkdownContent>
                )}

                {/* --- PERPLEXITY YOUTUBE VIDEOS --- */}
                {msg.videos && msg.videos.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PlayCircleOutlineIcon fontSize="small" /> Related Videos
                        </Typography>
                        <VideosContainer>
                            {msg.videos.map((vid, idx) => (
                                <VideoCard key={idx} href={vid.url} target="_blank" rel="noopener noreferrer">
                                    <Box sx={{ position: 'relative' }}>
                                        <img src={vid.thumbnail} alt={vid.title} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                                        <Box sx={{ position: 'absolute', bottom: 4, right: 4, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 0.5, borderRadius: 1, fontSize: '0.7rem' }}>
                                            {vid.duration}
                                        </Box>
                                    </Box>
                                    <Typography sx={{ p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {vid.title}
                                    </Typography>
                                </VideoCard>
                            ))}
                        </VideosContainer>
                    </Box>
                )}

                {/* --- PERPLEXITY SOURCES --- */}
                {msg.sources && msg.sources.length > 0 && (
                    <SourcesContainer>
                        <Typography variant="subtitle2" sx={{ color: '#6B7280', width: '100%', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LinkIcon fontSize="small" /> Sources
                        </Typography>
                        {msg.sources.map((source, idx) => (
                            <SourceChip key={idx} href={source.url} target="_blank" rel="noopener noreferrer">
                                {source.name || source.title}
                            </SourceChip>
                        ))}
                    </SourcesContainer>
                )}
                
                {msg.sender === 'user' ? <UserTimestamp>{msg.timestamp}</UserTimestamp> : <Timestamp>{msg.timestamp}</Timestamp>}
              </MessageBubble>
            </MessageRow>
          ))}
          {isLoading && settings.showTypingIndicators && (
            <MessageRow owner="tutor">
              <TutorAvatar>
                🤖
              </TutorAvatar>
              <MessageBubble owner="tutor">
                <CircularProgress size={20} sx={{color: '#6D53D3'}} />
              </MessageBubble>
            </MessageRow>
          )}
          {error && (
            <Typography color="error" sx={{ textAlign: 'center', p: 2 }}>
              {error}
            </Typography>
          )}
          <div ref={messagesEndRef} />
      </MessageWindow>

      <InputArea component="form" onSubmit={handleSendMessage}>
          <StyledTextField
            fullWidth
            variant="outlined"
            placeholder="Ask me anything about your studies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            inputProps={{ 'aria-label': 'Type your message' }}
          />
          <SendButton
            type="submit"
            aria-label="Send message"
            disabled={isLoading || !input.trim()}
          >
            <MenuBookOutlinedIcon sx={{ fontSize: 28 }} />
          </SendButton>
      </InputArea>
      
      <StyledDialog open={isSettingsOpen} onClose={handleCloseSettings}>
        <StyledDialogTitle>Chat Settings</StyledDialogTitle>
        <StyledDialogContent>
          <StyledFormControlLabel
            labelPlacement="start"
            control={<Checkbox checked={tempSettings.soundNotifications} onChange={handleSettingChange} name="soundNotifications" />}
            label="Sound notifications"
          />
          <StyledFormControlLabel
            labelPlacement="start"
            control={<Checkbox checked={tempSettings.showTypingIndicators} onChange={handleSettingChange} name="showTypingIndicators" />}
            label="Show typing indicators"
          />
          <StyledFormControlLabel
            labelPlacement="start"
            control={<Checkbox checked={tempSettings.autoScroll} onChange={handleSettingChange} name="autoScroll" />}
            label="Auto-scroll to new messages"
          />
        </StyledDialogContent>
        <StyledDialogActions>
          <CancelButton onClick={handleCloseSettings}>Cancel</CancelButton>
          <SaveButton onClick={handleSaveSettings}>Save</SaveButton>
        </StyledDialogActions>
      </StyledDialog>

    </ChatContainer>
  );
};

export default ChatPage;