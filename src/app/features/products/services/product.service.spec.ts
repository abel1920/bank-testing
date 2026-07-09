import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const mockProduct: Product = {
    id: 'trj-crd',
    name: 'Tarjetas de Credito',
    description: 'Tarjeta de consumo bajo la modalidad de credito',
    logo: 'https://www.visa.com.ec/dam/VCOM/regional/lac/SPA/Default/Pay%20With%20Visa/Tarjetas/visa-signature-400x225.jpg',
    date_release: '2023-02-01',
    date_revision: '2024-02-01'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya peticiones pendientes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve products via GET', () => {
    const mockResponse = { data: [mockProduct] };

    service.getProducts().subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.data[0]).toEqual(mockProduct);
    });

    const req = httpMock.expectOne('/bp/products');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create a product via POST', () => {
    service.createProduct(mockProduct).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('/bp/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockProduct);
    req.flush({ message: 'Product created successfully', data: mockProduct });
  });

  it('should update a product via PUT', () => {
    const updatedProduct = { ...mockProduct, name: 'Updated Name' };

    service.updateProduct(mockProduct.id, updatedProduct).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(`/bp/products/${mockProduct.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedProduct);
    req.flush({ message: 'Product updated successfully', data: updatedProduct });
  });

  it('should delete a product via DELETE', () => {
    service.deleteProduct(mockProduct.id).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(`/bp/products/${mockProduct.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Product deleted successfully' });
  });

  it('should verify product ID via GET', () => {
    service.verifyProductId(mockProduct.id).subscribe(exists => {
      expect(exists).toBe(true);
    });

    const req = httpMock.expectOne(`/bp/products/verification/${mockProduct.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(true);
  });
});
