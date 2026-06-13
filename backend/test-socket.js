const io = require('socket.io-client');
const socket = io('http://localhost:5000', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('chat:message', 'heyy how are you');
});

socket.on('chat:response:start', (data) => console.log('start', data));
socket.on('chat:response:chunk', (data) => console.log('chunk', data));
socket.on('chat:response:end', (data) => console.log('end', data));
socket.on('chat:response', (data) => console.log('response', data));

socket.on('disconnect', () => console.log('Disconnected'));
