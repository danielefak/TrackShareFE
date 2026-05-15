import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'no_button_dialog',
  template: `
    <h1 mat-dialog-title>{{ data.title }}</h1>
    <div mat-dialog-content>
      <p>{{ data.text }}</p>
    </div>
    <div mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }
  
    h1 {
      color: var(--mat-sys-error);
      text-align: center;
    }
    div[mat-dialog-content] {
      padding: 20px;
      font-size: 16px;
    }
    div[mat-dialog-actions] {
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class NoButtonDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NoButtonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; text: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}