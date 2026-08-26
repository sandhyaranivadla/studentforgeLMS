import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1] || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      
      const payload = this.jwtService.verify(token);
      // Attach user info to socket
      (client as any).user = payload;
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // cleanup if necessary
  }

  @SubscribeMessage('joinCourse')
  handleJoinCourse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { courseId: string },
  ) {
    if (!data.courseId) return;
    client.join(`course_${data.courseId}`);
  }

  @SubscribeMessage('leaveCourse')
  handleLeaveCourse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { courseId: string },
  ) {
    if (!data.courseId) return;
    client.leave(`course_${data.courseId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { courseId: string; content: string },
  ) {
    const user = (client as any).user;
    if (!user || !data.courseId || !data.content) return;

    // Save message to DB
    const message = await this.chatService.saveMessage(
      data.courseId,
      user.sub,
      data.content,
    );

    // Broadcast to room
    this.server.to(`course_${data.courseId}`).emit('newMessage', message);
  }
}
