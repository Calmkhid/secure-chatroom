const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();

const User = require('./models/User');
const { encryptMessage, decryptMessage } = require('./utils/encryption');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middlewares
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

// Basic login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    req.session.user = user;
    res.redirect('/');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Socket.io chat
io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('chat-message', ({ room, msg }) => {
    const encrypted = encryptMessage(msg);
    io.to(room).emit('chat-message', encrypted);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
