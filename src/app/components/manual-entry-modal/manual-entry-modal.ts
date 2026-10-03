import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseStore } from '../../services/expense.store'

@Component({
  selector: 'app-manual-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="modal-sheet" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add Expense</h2>
          <button type="button" class="close-btn" (click)="close.emit()">✕</button>
        </div>

        <form (ngSubmit)="submitExpense()" class="modal-form">
          <div class="field-group">
            <label>Amount (₹)</label>
            <input type="number" [(ngModel)]="amount" name="amount" placeholder="0.00" required />
          </div>

          <div class="field-group">
            <label>Merchant / Place</label>
            <input type="text" [(ngModel)]="merchant" name="merchant" placeholder="e.g. Swiggy, Petrol" required />
          </div>

          <div class="row">
            <div class="field-group flex-1">
              <label>Category</label>
              <select [(ngModel)]="category" name="category">
                <option value="Food & Dining">Food & Dining</option>
                <option value="Groceries">Groceries</option>
                <option value="Shopping">Shopping</option>
                <option value="Travel">Travel</option>
                <option value="Bills">Bills</option>
                <option value="General">General</option>
              </select>
            </div>
            <div class="field-group flex-1">
              <label>Last 4 Digits</label>
              <input type="text" [(ngModel)]="cardDigits" name="cardDigits" placeholder="e.g. 4021 (or blank)" />
            </div>
          </div>

          <div class="field-group">
            <label>Date</label>
            <input type="date" [(ngModel)]="date" name="date" required />
          </div>

          <div class="actions">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!amount || !merchant">Save</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    @media (min-width: 640px) {
      .modal-backdrop {
        align-items: center;
        padding: 1rem;
      }
    }
    .modal-sheet {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      width: 100%;
      max-width: 420px;
      border-radius: 24px 24px 0 0;
      padding: 1.5rem;
      box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.5);
    }
    @media (min-width: 640px) {
      .modal-sheet {
        border-radius: 20px;
      }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .modal-header h2 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .field-group label {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .field-group input, .field-group select {
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      color: var(--text-main);
      font-size: 0.9rem;
      outline: none;
    }
    .field-group input:focus, .field-group select:focus {
      border-color: var(--accent);
    }
    .row {
      display: flex;
      gap: 0.75rem;
    }
    .flex-1 {
      flex: 1;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .btn {
      flex: 1;
      padding: 0.85rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
    }
    .btn-secondary {
      background: var(--border-subtle);
      color: var(--text-muted);
    }
    .btn-primary {
      background: var(--accent);
      color: var(--accent-text);
    }
    .btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class ManualEntryModalComponent {
  close = output<void>();
  private store = inject(ExpenseStore);

  amount: number | null = null;
  merchant = '';
  category = 'Food & Dining';
  cardDigits = '';
  date: string = new Date().toISOString().substring(0, 10);

  async submitExpense() {
    if (!this.amount || !this.merchant) return;

    await this.store.addManualExpense({
      amount: Number(this.amount),
      merchant: this.merchant,
      category: this.category,
      card_last4: this.cardDigits.replace(/\D/g, '').slice(-4),
      bank_name: this.cardDigits ? 'Card' : 'Cash',
      transaction_date: new Date(this.date).toISOString()
    });

    this.close.emit();
  }
}