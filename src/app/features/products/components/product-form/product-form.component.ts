import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil, map, catchError, of, switchMap, timer } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  isSaving = signal(false);
  isEditMode = signal(false);

  myForm: FormGroup = this.fb.group({
    id: ['',
      [Validators.required, Validators.minLength(3), Validators.maxLength(10)],
      // Validador asíncrono para verificar si el ID existe
      [this.idAsyncValidator.bind(this)]
    ],
    name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
    logo: ['', Validators.required],
    date_release: ['', [Validators.required, this.dateReleaseValidator]],
    date_revision: [{ value: '', disabled: true }]
  });

  ngOnInit() {
    this.checkEditMode();
    this.setupDateRevisionLogic();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.myForm.get('id')?.disable(); // En edición no se puede cambiar el ID
      //consulta a la endpoint
      this.productService.getProducts().subscribe(res => {
        const product = res.data.find(p => p.id === id);
        if (product) {
          // Extraer si viene con hora
          const dateRelease = product.date_release ? new Date(product.date_release).toISOString().split('T')[0] : '';
          const dateRevision = product.date_revision ? new Date(product.date_revision).toISOString().split('T')[0] : '';

          this.myForm.patchValue({
            id: product.id,
            name: product.name,
            description: product.description,
            logo: product.logo,
            date_release: dateRelease,
            date_revision: dateRevision
          });
        }
      });
    }
  }

  private setupDateRevisionLogic() {
    this.myForm
      .get('date_release')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const releaseControl = this.myForm.get('date_release');
        const revisionControl = this.myForm.get('date_revision');

        if (!releaseControl || !revisionControl || !value) return;

        const releaseDate = new Date(value);
        if (isNaN(releaseDate.getTime())) return;

        const nextYear = new Date(releaseDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const yearValue = nextYear.toISOString().split('T')[0];

        revisionControl.setValue(yearValue, { emitEvent: false });
      });
  }

  saveProduct() {
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      this.notificationService.showError('Por favor corrige los errores del formulario.');
      return;
    }

    this.isSaving.set(true);
    const rawValue = this.myForm.getRawValue(); // Incluye campos disabled como el ID en modo edición
    const product: Product = {
      id: rawValue.id,
      name: rawValue.name,
      description: rawValue.description,
      logo: rawValue.logo,
      date_release: rawValue.date_release,
      date_revision: rawValue.date_revision
    };

    if (this.isEditMode()) {
      this.productService.updateProduct(product.id, product).subscribe({
        next: () => {
          this.notificationService.showSuccess('Producto actualizado correctamente');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.notificationService.showError('Error al actualizar el producto');
          this.isSaving.set(false);
        }
      });
    } else {
      this.productService.createProduct(product).subscribe({
        next: () => {
          this.notificationService.showSuccess('Producto creado correctamente');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.notificationService.showError('Error al crear el producto');
          this.isSaving.set(false);
        }
      });
    }
  }

  resetForm() {
    if (this.isEditMode()) {
      // En modo edición solo reseteamos los campos editables
      const idValue = this.myForm.getRawValue().id;
      this.myForm.reset({ id: idValue });
    } else {
      this.myForm.reset();
    }
  }

  isValidField(fieldName: string): boolean {
    const field = this.myForm.get(fieldName);
    return !!field?.errors && field.touched;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.myForm.get(fieldName);
    const errors = field?.errors ?? {};

    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength']) return `Mínimo de ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `Máximo de ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['pastDate']) return 'La fecha debe ser igual o mayor a hoy.';
    if (errors['idExists']) return 'Este ID ya existe. Prueba con otro.';

    return null;
  }

  // Validación de fecha (síncrona)
  private dateReleaseValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const [year, month, day] = control.value.split('-').map(Number);
    const releaseDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return releaseDate < today ? { pastDate: true } : null;
  }

  // Validación asíncrona del ID usando debounceTime (timer)
  private idAsyncValidator(control: AbstractControl) {
    if (!control.value || this.isEditMode()) {
      return of(null);
    }
    return timer(500).pipe(
      switchMap(() => this.productService.verifyProductId(control.value)),
      map(exists => (exists ? { idExists: true } : null)),
      catchError(() => of(null))
    );
  }
}
