import { Component, OnInit } from '@angular/core';
import { ContentService } from '../../../services/content.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  homeContent: any;
  loading = true;
  error = false;
  
  constructor(private contentService: ContentService) { }
  
  ngOnInit(): void {
    this.loadContent();
  }
  
  loadContent(): void {
    this.contentService.getContent('home').subscribe({
      next: (data) => {
        this.homeContent = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading home content:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}
