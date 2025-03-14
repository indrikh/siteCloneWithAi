import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  private sessionId: string;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  
  // Public observables
  public messages$ = this.messagesSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  initSession(): void {
    // Check for existing session in localStorage
    const storedSessionId = localStorage.getItem('chat_session_id');
    if (storedSessionId) {
      this.sessionId = storedSessionId;
    } else {
      // Create new session
      this.sessionId = uuidv4();
      localStorage.setItem('chat_session_id', this.sessionId);
    }
  }
  
  loadHistory(): void {
    this.isLoadingSubject.next(true);
    
    this.http.get<{success: boolean, history: ChatMessage[]}>(`${this.apiUrl}/history/${this.sessionId}`)
      .subscribe({
        next: (response) => {
          if (response.success && response.history.length > 0) {
            this.messagesSubject.next(response.history);
          }
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          console.error('Error loading chat history:', error);
          this.isLoadingSubject.next(false);
        }
      });
  }
  
  sendMessage(message: string): void {
    // Add user message to the UI immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next([...currentMessages, userMessage]);
    
    // Show loading indicator
    this.isLoadingSubject.next(true);
    
    // Send to API
    this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/message`, {
      message,
      sessionId: this.sessionId,
      userId: localStorage.getItem('user_id') || null
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Add assistant's response
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response.message,
            timestamp: new Date().toISOString()
          };
          
          const updatedMessages = this.messagesSubject.getValue();
          this.messagesSubject.next([...updatedMessages, assistantMessage]);
        }
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isLoadingSubject.next(false);
        
        // Add error message
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.',
          timestamp: new Date().toISOString()
        };
        
        const updatedMessages = this.messagesSubject.getValue();
        this.messagesSubject.next([...updatedMessages, errorMessage]);
      }
    });
  }
  
  clearHistory(): void {
    // Clear local messages
    this.messagesSubject.next([]);
    
    // Add initial greeting
    const greeting: ChatMessage = {
      role: 'assistant',
      content: 'Чат очищен. Чем я могу помочь?',
      timestamp: new Date().toISOString()
    };
    this.messagesSubject.next([greeting]);
    
    // Clear on server
    this.http.delete<{success: boolean}>(`${this.apiUrl}/history/${this.sessionId}`)
      .subscribe({
        error: (error) => console.error('Error clearing chat history:', error)
      });
  }
}
