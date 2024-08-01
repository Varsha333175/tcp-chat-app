import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  private socket: Socket;
  profile = { nickname: '', fullname: '' };
  message: string = '';
  nicknameToKick: string = '';
  messages: { text: string, sender: string, type: string }[] = [];
  users: { nickname: string, fullname: string }[] = [];
  isKicked: boolean = false;
  kickedMessage: string = '';

  constructor(private router: Router) {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: false,
    }); // Change this to your server's address if necessary
  }

  ngOnInit(): void {
    const storedProfile = localStorage.getItem('profile');
    if (!storedProfile) {
      this.router.navigate(['/']);
      return;
    }

    this.profile = JSON.parse(storedProfile);
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.emit('set-profile', this.profile);
    }

    this.socket.on('message', (msg: { text: string, sender: string, type: string }) => {
      this.messages.push(msg);
    });

    this.socket.on('users', (users: { nickname: string, fullname: string }[]) => {
      this.users = users;
    });

    this.socket.on('kicked', (byUser: string) => {
      this.isKicked = true;
      this.kickedMessage = `You have been kicked out by ${byUser}`;
      this.socket.disconnect();
      localStorage.removeItem('profile'); // Ensure profile is removed
    });

    this.socket.on('disconnect', () => {
      if (!this.isKicked) {
        this.messages.push({ text: `${this.profile.nickname} left the chat`, sender: 'system', type: 'system' });
      }
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }

  sendMessage() {
    if (!this.isKicked && this.message.trim()) {
      this.socket.emit('message', { text: this.message, sender: this.profile.nickname, type: 'user' });
      this.message = '';
    }
  }

  kickUser(nickname: string) {
    if (!this.isKicked && nickname.trim()) {
      this.socket.emit('kick', nickname, this.profile.nickname);
      this.nicknameToKick = '';
    }
  }
}
