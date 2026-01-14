import { Component } from '@angular/core';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  imports: [MainLayoutComponent],
  template: '<app-main-layout></app-main-layout>',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'pharmacie-frontend';
}
