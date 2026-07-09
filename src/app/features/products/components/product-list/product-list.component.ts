import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {

  private readonly productService = inject(ProductService)
  //Servicio de notificaciones
  private readonly notificationService = inject(NotificationService);


  products = signal<Product[]>([])
  searchProduct = signal<string>('')
  isLoading = signal<boolean>(true) //Skeleton Loading
  submitMessage = signal('');
  ngOnInit(): void {
    this.loadProducts()
  }

  loadProducts() {
    this.isLoading.set(true)
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products.set(response.data)
        this.isLoading.set(false)
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.isLoading.set(false);
      }
    })
  }

  onSearch(value: string) {
    this.searchProduct.set(value)
  }

  filteredProducts = computed(() => {
    const filter = this.searchProduct().trim().toLowerCase()
    if (!filter) return this.products()

    return this.products().filter(product =>
      product.name.toLowerCase().includes(filter) ||
      product.description.toLowerCase().includes(filter)
    )
  })

  pageSize = signal<number>(5);

  onChangePageSize(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize.set(Number(select.value));
  }

  paginatedProducts = computed(() => {
    return this.filteredProducts().slice(0, this.pageSize());
  })


  deleteProduct(id: string) {
    this.productService.deleteProduct(id).subscribe({
      next: (res) => {
        this.notificationService.showSuccess(res.message ?? 'Producto eliminado correctamente.');
        this.loadProducts();
      },
      error: (err) => {
        console.error(err);
        const message = err?.error?.message ?? 'No se pudo eliminar el producto.';
        this.notificationService.showError(message);
      }
    });
  }

}
