import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  sendMessage(message: string) {
    this.socket.emit('message', message);
  }

  receiveMessage(callback: (message: string) => void) {
    this.socket.on('message', (message: string) => {
      callback(message);
    });
  }

  setNickname(nickname: string) {
    this.socket.emit('set-nickname', nickname);
  }

  onKicked(callback: () => void) {
    this.socket.on('kicked', callback);
  }

  kickUser(nickname: string) {
    this.socket.emit('kick', nickname);
  }
}
