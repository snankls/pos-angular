import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { NgSelectComponent } from '@ng-select/ng-select';
import { environment } from '../../../environments/environment';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, CommonModule, FormsModule, NgSelectComponent],
  templateUrl: './import-export.component.html'
})
export class ImportExportComponent implements OnInit {
  private API_URL = environment.API_URL;
  private DOWNLOAD_CSV_URL = environment.LIVE_URL;

  // Common state
  isLoading = false;
  selectedFile: File | null = null;
  selectedExportType: string = '';

  // Import feedback
  importFormErrors: any = {};
  importErrorMessage = '';
  importSuccessMessage = '';

  // Export feedback
  exportFormErrors: any = {};
  exportErrorMessage = '';
  exportSuccessMessage = '';

  // Modal
  selectedDoc: string = '';
  modalTitle: string = '';
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  activeModal: NgbModalRef | null = null;

  constructor(private http: HttpClient, private modalService: NgbModal) {}

  ngOnInit(): void {}

  // 📥 File select handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // 📘 Show documentation modal
  documentationCSV(type: string): void {
    this.selectedDoc = type;
    this.modalTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Documentation`;
    this.activeModal = this.modalService.open(this.modalTemplate, { size: 'lg' });
  }

  // 📦 Download CSV Template
  downloadCSV(type: string): void {
    const apiUrl = `${this.DOWNLOAD_CSV_URL}/csv/download/${type}`;
    const link = document.createElement('a');
    link.href = apiUrl;
    link.download = `${type}.csv`;
    link.click();
  }

  // 🧾 IMPORT CSV
  onImportSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.importFormErrors = {};
    this.importErrorMessage = '';
    this.importSuccessMessage = '';

    if (!this.selectedFile) {
      this.isLoading = false;
      this.importErrorMessage = 'Please select a CSV file before importing.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${this.API_URL}/imports`, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.importSuccessMessage = response.message || 'File imported successfully!';
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 422 && error.error.errors) {
          this.importFormErrors = error.error.errors;
        } else {
          this.importErrorMessage = error.error.message || 'An unexpected error occurred during import.';
        }
      }
    });
  }

  // 📤 EXPORT CSV
  onExportSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.exportFormErrors = {};
    this.exportErrorMessage = '';
    this.exportSuccessMessage = '';

    if (!this.selectedExportType) {
      this.isLoading = false;
      this.exportErrorMessage = 'Please select a type to export.';
      return;
    }

    this.http.get(`${this.API_URL}/exports/${this.selectedExportType}`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;

        // Create a download link
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = `${this.selectedExportType}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.exportSuccessMessage = `Exported ${this.selectedExportType} data successfully!`;
      },
      error: (error) => {
        this.isLoading = false;
        this.exportErrorMessage = error.error?.message || 'An unexpected error occurred during export.';
      }
    });
  }
}
