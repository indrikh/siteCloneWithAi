import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = `${environment.apiUrl}/content`;
  private contentCache: { [key: string]: Observable<any> } = {};
  
  constructor(private http: HttpClient) { }
  
  getContent(section: string): Observable<any> {
    // Check if content is already cached
    if (this.contentCache[section]) {
      return this.contentCache[section];
    }
    
    // Fetch content from API
    const content$ = this.http.get<{success: boolean, content: any}>(`${this.apiUrl}/${section}`)
      .pipe(
        map(response => {
          if (response.success) {
            return response.content;
          }
          throw new Error('Failed to load content');
        }),
        catchError(error => {
          console.error(`Error loading ${section} content:`, error);
          
          // Return fallback content for error cases
          return of(this.getFallbackContent(section));
        }),
        // Cache the observable
        shareReplay(1)
      );
    
    // Store in cache
    this.contentCache[section] = content$;
    
    return content$;
  }
  
  // Provide fallback content in case API fails
  private getFallbackContent(section: string): any {
    switch (section) {
      case 'home':
        return {
          hero: {
            title: 'Explore the World of Role Play',
            subtitle: 'Join the exciting world of roleplay gaming with a thriving community',
            ctaText: 'Start Playing Now',
            ctaLink: '/download',
            backgroundImage: '/assets/images/hero-bg.jpg'
          },
          quests: [
            {
              id: 'gang',
              title: 'Path of the Gangster',
              description: 'Start from the bottom of the criminal world and build your empire',
              image: '/assets/images/quest-gang.jpg',
              link: '/quests/gang'
            },
            {
              id: 'cop',
              title: 'Path of the Law Enforcer',
              description: 'Serve and protect as a member of law enforcement',
              image: '/assets/images/quest-cop.jpg',
              link: '/quests/cop'
            }
          ],
          // Other fallback content sections...
        };
      default:
        return {};
    }
  }
  
  // Clear specific content from cache
  clearCache(section?: string): void {
    if (section) {
      delete this.contentCache[section];
    } else {
      this.contentCache = {};
    }
  }
}
