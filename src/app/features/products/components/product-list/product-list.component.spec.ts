import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productServiceMock: any;
  let notificationServiceMock: any;

  const mockProducts = [
    { id: '1', name: 'Product 1', description: 'Desc 1', logo: 'logo1.png', date_release: '2024-01-01', date_revision: '2025-01-01' },
    { id: '2', name: 'Product 2', description: 'Desc 2', logo: 'logo2.png', date_release: '2024-02-01', date_revision: '2025-02-01' }
  ];

  beforeEach(async () => {
    productServiceMock = {
      getProducts: jest.fn().mockReturnValue(of({ data: mockProducts })),
      deleteProduct: jest.fn().mockReturnValue(of({ message: 'Deleted' }))
    };

    notificationServiceMock = {
      showSuccess: jest.fn(),
      showError: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(productServiceMock.getProducts).toHaveBeenCalled();
    expect(component.products().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('should filter products correctly', () => {
    component.onSearch('Product 1');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].id).toBe('1');
    
    component.onSearch('Desc 2');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].id).toBe('2');
    
    component.onSearch('NonExistent');
    expect(component.filteredProducts().length).toBe(0);
  });

  it('should delete product and show success notification', () => {
    component.deleteProduct('1');
    expect(productServiceMock.deleteProduct).toHaveBeenCalledWith('1');
    expect(notificationServiceMock.showSuccess).toHaveBeenCalledWith('Deleted');
    expect(productServiceMock.getProducts).toHaveBeenCalledTimes(2); // Initial + reload
  });

  it('should handle error when deleting product', () => {
    productServiceMock.deleteProduct.mockReturnValueOnce(throwError(() => ({ error: { message: 'Error deleting' } })));
    component.deleteProduct('1');
    expect(notificationServiceMock.showError).toHaveBeenCalledWith('Error deleting');
  });
});
