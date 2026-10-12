import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import DashboardLayout from '../components/DashboardLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; 
let tempMessageIdCounter = 0; 

// Simulated Encryption/Decryption Helpers
const encryptMessage = (obj) => ({ iv: 'fake', data: btoa(JSON.stringify(obj)) });
const decryptPayload = (p) => JSON.parse(atob(p.data));

const ChatClient = () => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);

  // 🔴 DELETE STATE
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------- SOCKET LISTENERS ----------
  const handleIncomingMessage = useCallback((msg) => {
    setMessages(prev => {
      const isMe = msg.senderId === socketRef.current.id;
      const tempIndex = prev.findIndex(m => m._id === msg.tempId);

      if (tempIndex !== -1) {
        const updated = [...prev];
        updated[tempIndex] = { ...msg, isSender: true };
        return updated;
      }

      if (prev.find(m => m._id === msg._id)) return prev;
      return [...prev, { ...msg, isSender: isMe }];
    });
  }, []);

  const handlePreviousMessages = useCallback((history) => {
    setMessages(history.map(msg => ({ ...msg, isSender: false })));
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on("previous-messages", handlePreviousMessages);
    socket.on("receive-message", handleIncomingMessage);

    // 🔴 DELETE LISTENER
    socket.on("messages-deleted", ({ messageIds }) => {
      setMessages(prev => prev.filter(m => !messageIds.includes(m._id)));
      setSelectionMode(false);
      setSelectedMessages(new Set());
    });

    return () => socket.disconnect();
  }, [handleIncomingMessage, handlePreviousMessages]);

  // ---------- ACTIONS ----------
  const joinRoom = () => {
    if (!roomIdInput.trim()) return;
    setMessages([]);
    setRoomId(roomIdInput.trim());
    socketRef.current.emit("join-room", roomIdInput.trim());
  };

  const sendMessage = (content) => {
    if (!content.trim()) return;

    const payload = encryptMessage({ type: 'text', content });
    const tempId = `temp_${tempMessageIdCounter++}`;

    setMessages(prev => [...prev, { 
      _id: tempId, 
      payload, 
      isSender: true, 
      isTemp: true 
    }]);

    socketRef.current.emit("send-message", { roomId, payload, tempId });
  };

  // ---------- DELETE LOGIC ----------
  const toggleSelect = (id) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  };

  const handleDelete = () => {
    if (selectedMessages.size === 0) return;

    const ids = [...selectedMessages].filter(id => !id.startsWith('temp_'));
    if (ids.length !== selectedMessages.size) {
      alert("Wait until message is sent before deleting");
      return;
    }

    socketRef.current.emit("delete-messages", {
      roomId,
      messageIds: ids
    });
  };

  // ---------- JOIN SCREEN ----------
  if (!roomId) {
    return (
      <DashboardLayout pageTitle="Secure Chat">
        <div style={joinWrapper}>
          <div style={joinCard}>
            <h2>🔐 Secure Chat</h2>
            <input
              value={roomIdInput}
              onChange={e => setRoomIdInput(e.target.value)}
              placeholder="Enter Room ID"
              style={joinInput}
            />
            <button onClick={joinRoom} style={joinButton}>Join Room</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ---------- CHAT SCREEN ----------
  return (
    <DashboardLayout pageTitle="Secure Chat">
      <div style={chatWrapper}>
        <div style={chatHeader}>Room: {roomId}</div>

        {/* 🔴 DELETE BAR */}
        {selectionMode && (
          <div style={deleteBar}>
            <span>{selectedMessages.size} selected</span>
            <button onClick={handleDelete} style={deleteButton}>Delete</button>
          </div>
        )}

        <div style={messagesContainer}>
          {messages.map(msg => {
            const { content } = decryptPayload(msg.payload);
            const selected = selectedMessages.has(msg._id);

            return (
              <div
                key={msg._id}
                style={messageRow(msg.isSender)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectionMode(true);
                  toggleSelect(msg._id);
                }}
                onClick={() => selectionMode && toggleSelect(msg._id)}
              >
                <div style={messageBubble(msg.isSender, selected)}>
                  {msg.isTemp && <div style={sendingText}>Sending…</div>}
                  {content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage(messageInput);
            setMessageInput('');
          }}
          style={inputArea}
        >
          <input
  value={messageInput}
  onChange={e => setMessageInput(e.target.value)}
  style={messageInputStyle}
  placeholder="Type a message…"
/>

          <button type="submit" style={sendButton}>Send</button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ChatClient;

/* ---------- STYLES ---------- */

const chatWrapper = {
  maxWidth: '900px',
  height: '75vh',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  overflow: 'hidden'
};

const chatHeader = {
  padding: '14px 20px',
  background: 'linear-gradient(90deg, #6D53D3, #8A6EE2)',
  color: 'white',
  fontWeight: 'bold'
};

const deleteBar = {
  padding: '10px 16px',
  background: '#FEE2E2',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const deleteButton = {
  background: 'red',
  color: 'white',
  border: 'none',
  padding: '6px 14px',
  borderRadius: '8px',
  cursor: 'pointer'
};

const messagesContainer = {
  flex: 1,
  padding: '20px',
  overflowY: 'auto',
  background: '#F3F4F6'
};

const messageRow = (me) => ({
  display: 'flex',
  justifyContent: me ? 'flex-end' : 'flex-start',
  marginBottom: '12px'
});

const messageBubble = (me, selected) => ({
  padding: '10px 14px',
  borderRadius: '14px',
  background: me ? '#DCF8C6' : '#fff',
  maxWidth: '65%',
  boxShadow: selected ? '0 0 0 2px red' : '0 2px 6px rgba(0,0,0,0.06)'
});

const sendingText = { fontSize: '10px', color: '#6B7280' };

const inputArea = {
  display: 'flex',
  padding: '14px',
  borderTop: '1px solid #E5E7EB'
};

const messageInputStyle = {
  flex: 1,
  padding: '12px',
  borderRadius: '999px',
  border: '1px solid #D1D5DB',
  marginRight: '10px'
};


const sendButton = {
  padding: '12px 20px',
  borderRadius: '999px',
  border: 'none',
  background: '#6D53D3',
  color: 'white',
  cursor: 'pointer'
};

/* JOIN */
const joinWrapper = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '60vh'
};

const joinCard = {
  background: '#fff',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  textAlign: 'center'
};

const joinInput = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  borderRadius: '10px',
  border: '1px solid #D1D5DB'
};

const joinButton = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  background: '#6D53D3',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer'
};
