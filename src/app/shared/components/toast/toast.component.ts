import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (notificationService.notification(); as notification) {
      <div class="toast-container" [ngClass]="notification.type">
        <p>{{ notification.message }}</p>
        <button class="close-btn" (click)="notificationService.clear()">×</button>
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out forwards;
    }
    .toast-container p {
      margin: 0;
      font-weight: 500;
      color: #fff;
    }
    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      margin-left: 16px;
    }
    .success {
      background-color: #2e7d32;
    }
    .error {
      background-color: #d32f2f;
    }
    .info {
      background-color: #0288d1;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  notificationService = inject(NotificationService);
}
