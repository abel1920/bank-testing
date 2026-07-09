import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductFormComponent } from './product-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productServiceMock: any;
  let notificationServiceMock: any;
  let routerMock: any;

  // Helper: crear el componente en modo creación (sin ID en la URL)
  function setupCreateMode() {
    return {
      snapshot: { paramMap: { get: () => null } }
    };
  }

  // Helper: crear el componente en modo edición (con ID en la URL)
  function setupEditMode(id: string) {
    return {
      snapshot: { paramMap: { get: () => id } }
    };
  }

  // Helper: rellenar el formulario con datos válidos
  function fillValidForm() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dateStr = futureDate.toISOString().split('T')[0];

    component.myForm.patchValue({
      id: 'new-id',
      name: 'Valid Product Name',
      description: 'A very valid description for testing',
      logo: 'https://logo.png',
      date_release: dateStr
    });
  }

  async function createComponent(activatedRouteMock: any) {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, ReactiveFormsModule],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    productServiceMock = {
      createProduct: jest.fn().mockReturnValue(of({})),
      updateProduct: jest.fn().mockReturnValue(of({})),
      verifyProductId: jest.fn().mockReturnValue(of(false)), // false = ID no existe
      getProducts: jest.fn().mockReturnValue(of({
        data: [
          { id: 'edit-1', name: 'Existing', description: 'A valid description', logo: 'logo.png', date_release: '2027-06-01', date_revision: '2028-06-01' }
        ]
      }))
    };

    notificationServiceMock = {
      showSuccess: jest.fn(),
      showError: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };
  });

  // ============================================
  //  MODO CREACIÓN
  // ============================================
  describe('Create Mode', () => {
    beforeEach(async () => {
      await createComponent(setupCreateMode());
    });

    it('should create the form component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize in create mode with empty form', () => {
      expect(component.isEditMode()).toBe(false);
      expect(component.myForm.get('id')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.myForm.markAllAsTouched();
      expect(component.myForm.get('id')?.hasError('required')).toBeTruthy();
      expect(component.myForm.get('name')?.hasError('required')).toBeTruthy();
      expect(component.myForm.get('description')?.hasError('required')).toBeTruthy();
      expect(component.myForm.get('logo')?.hasError('required')).toBeTruthy();
      expect(component.isValidField('id')).toBeTruthy();
    });

    it('should validate minLength on name', () => {
      component.myForm.get('name')?.setValue('abc');
      expect(component.myForm.get('name')?.hasError('minlength')).toBeTruthy();
    });

    it('should update date_revision automatically when date_release changes', () => {
      component.myForm.get('date_release')?.setValue('2024-05-15');
      expect(component.myForm.get('date_revision')?.value).toBe('2025-05-15');
    });

    it('should reject a past date_release', () => {
      component.myForm.get('date_release')?.setValue('2020-01-01');
      expect(component.myForm.get('date_release')?.hasError('pastDate')).toBeTruthy();
    });

    it('should accept today as date_release', () => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      component.myForm.get('date_release')?.setValue(`${y}-${m}-${d}`);
      expect(component.myForm.get('date_release')?.hasError('pastDate')).toBeFalsy();
    });

    it('should call createProduct on valid submit', fakeAsync(() => {
      fillValidForm();
      tick(600); // Esperar validador asíncrono del ID

      expect(component.myForm.valid).toBeTruthy();

      component.saveProduct();

      expect(productServiceMock.createProduct).toHaveBeenCalled();
      expect(notificationServiceMock.showSuccess).toHaveBeenCalledWith('Producto creado correctamente');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should show error notification if form is invalid on submit', () => {
      component.saveProduct();
      expect(notificationServiceMock.showError).toHaveBeenCalledWith('Por favor corrige los errores del formulario.');
      expect(productServiceMock.createProduct).not.toHaveBeenCalled();
    });

    it('should show error on createProduct failure', fakeAsync(() => {
      productServiceMock.createProduct.mockReturnValue(throwError(() => new Error('fail')));
      fillValidForm();
      tick(600);

      component.saveProduct();

      expect(notificationServiceMock.showError).toHaveBeenCalledWith('Error al crear el producto');
    }));

    it('should detect duplicate ID via async validator', fakeAsync(() => {
      productServiceMock.verifyProductId.mockReturnValue(of(true)); // true = ID ya existe
      component.myForm.get('id')?.setValue('existente');
      tick(600);

      expect(productServiceMock.verifyProductId).toHaveBeenCalledWith('existente');
      expect(component.myForm.get('id')?.hasError('idExists')).toBeTruthy();
    }));

    it('should reset form completely in create mode', fakeAsync(() => {
      fillValidForm();
      tick(600);

      component.resetForm();

      expect(component.myForm.get('name')?.value).toBeNull();
    }));

    it('should return correct error messages from getFieldError', () => {
      const form = component.myForm;
      form.get('name')?.setValue('');
      form.get('name')?.markAsTouched();
      expect(component.getFieldError('name')).toBe('Este campo es requerido');

      form.get('name')?.setValue('abc');
      expect(component.getFieldError('name')).toBe('Mínimo de 5 caracteres.');

      form.get('date_release')?.setValue('2020-01-01');
      expect(component.getFieldError('date_release')).toBe('La fecha debe ser igual o mayor a hoy.');
    });
  });

  // ============================================
  //  MODO EDICIÓN
  // ============================================
  describe('Edit Mode', () => {
    beforeEach(async () => {
      await createComponent(setupEditMode('edit-1'));
    });

    it('should initialize in edit mode', () => {
      expect(component.isEditMode()).toBe(true);
    });

    it('should disable the ID field in edit mode', () => {
      expect(component.myForm.get('id')?.disabled).toBeTruthy();
    });

    it('should load and patch existing product data', () => {
      expect(productServiceMock.getProducts).toHaveBeenCalled();
      expect(component.myForm.getRawValue().id).toBe('edit-1');
      expect(component.myForm.get('name')?.value).toBe('Existing');
    });

    it('should call updateProduct on valid submit', fakeAsync(() => {
      // Los datos ya están parcheados del producto existente (con fechas futuras)
      // Actualizamos el nombre
      component.myForm.get('name')?.setValue('Updated Name');
      component.myForm.get('description')?.setValue('Updated description text');
      component.myForm.get('date_release')?.setValue('2027-08-01');
      tick(600);

      component.saveProduct();

      expect(productServiceMock.updateProduct).toHaveBeenCalledWith('edit-1', expect.objectContaining({ name: 'Updated Name' }));
      expect(notificationServiceMock.showSuccess).toHaveBeenCalledWith('Producto actualizado correctamente');
    }));

    it('should show error on updateProduct failure', fakeAsync(() => {
      productServiceMock.updateProduct.mockReturnValue(throwError(() => new Error('fail')));
      component.myForm.get('name')?.setValue('Updated');
      component.myForm.get('description')?.setValue('Updated description text');
      component.myForm.get('date_release')?.setValue('2027-08-01');
      tick(600);

      component.saveProduct();

      expect(notificationServiceMock.showError).toHaveBeenCalledWith('Error al actualizar el producto');
    }));

    it('should reset only editable fields in edit mode', () => {
      component.myForm.get('name')?.setValue('Changed');
      component.resetForm();
      expect(component.myForm.getRawValue().id).toBe('edit-1'); // ID se mantiene
      expect(component.myForm.get('name')?.value).toBeNull();
    });
  });
});
