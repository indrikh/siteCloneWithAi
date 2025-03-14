import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService } from '../../../services/chat.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @Output() closeChat = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer: ElementRef;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  
  constructor(private chatService: ChatService) { }
  
  ngOnInit(): void {
    // Subscribe to chat messages from service
    this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
    });
    
    // Subscribe to loading state
    this.chatService.isLoading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
    
    // Initial greeting
    if (this.messages.length === 0) {
      this.messages.push({
        role: 'assistant',
        content: 'Привет! Я игровой помощник. Как я могу помочь вам сегодня?',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  
  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
  
  sendMessage(): void {
    if (!this.newMessage.trim() || this.isLoading) {
      return;
    }
    
    // Add user message to the list
    const userMessage: ChatMessage = {
      role: 'user',
      content: this.newMessage,
      timestamp: new Date().toISOString()
    };
    
    // Clear input
    const message = this.newMessage;
    this.newMessage = '';
    
    // Send message to service
    this.chatService.sendMessage(message);
  }
  
  onClose(): void {
    this.closeChat.emit();
  }
  
  clearChat(): void {
    this.chatService.clearHistory();
  }
}
