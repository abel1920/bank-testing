import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show a success notification', () => {
    service.showSuccess('Producto creado');
    expect(service.notification()).toEqual({ message: 'Producto creado', type: 'success' });
  });

  it('should show an error notification', () => {
    service.showError('Algo salió mal');
    expect(service.notification()).toEqual({ message: 'Algo salió mal', type: 'error' });
  });

  it('should show an info notification', () => {
    service.show('Info message', 'info');
    expect(service.notification()).toEqual({ message: 'Info message', type: 'info' });
  });

  it('should clear notification', () => {
    service.showSuccess('Test');
    expect(service.notification()).not.toBeNull();

    service.clear();
    expect(service.notification()).toBeNull();
  });

  it('should auto-clear after 3 seconds', fakeAsync(() => {
    service.showSuccess('Temporal');
    expect(service.notification()).not.toBeNull();

    tick(3000);
    expect(service.notification()).toBeNull();
  }));
});
