import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  private socket: Socket;
  profile = { nickname: '', fullname: '' };

  constructor(private router: Router) {
    this.socket = io('http://localhost:3000'); // Change this to your server's address if necessary
  }

  setProfile() {
    if (this.profile.nickname.trim() && this.profile.fullname.trim()) {
      localStorage.setItem('profile', JSON.stringify(this.profile));
      this.socket.emit('set-profile', this.profile);
      this.socket.on('kicked', () => {
        alert('You have been kicked from the chat.');
        localStorage.removeItem('profile'); // Ensure profile is removed
        this.router.navigate(['/']);
      });
      this.router.navigate(['/chat']);
    }
  }
}
