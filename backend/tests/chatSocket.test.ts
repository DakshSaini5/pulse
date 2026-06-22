import { Server as SocketIOServer } from 'socket.io';
import { setupChatSocket } from '../src/services/chatSocket';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';

describe('Chat WebSocket API', () => {
  let io: SocketIOServer;
  let serverSocket: any;
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer);
    setupChatSocket(io);
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  it('should hit rate limiter when sending more than 40 messages in 15 minutes', (done) => {
    let responsesReceived = 0;
    
    clientSocket.on('chat:response', (data: any) => {
      if (data.isError && data.text === 'You have 0 chat attempts left for this window. Please wait 15 minutes before sending more messages.') {
        clientSocket.off('chat:response');
        done();
      }
    });

    for (let i = 0; i < 41; i++) {
      clientSocket.emit('chat:message', `test message ${i}`);
    }
  }, 10000);
});
