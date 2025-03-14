import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Majestic RP Clone';
  showChat = false;
  
  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}
  
  ngOnInit(): void {
    // Check if user is already logged in (token in cookie)
    this.authService.checkAuthStatus();
    
    // Initialize chat service
    this.chatService.initSession();
  }
  
  toggleChat(): void {
    this.showChat = !this.showChat;
    if (this.showChat) {
      this.chatService.loadHistory();
    }
  }
}
