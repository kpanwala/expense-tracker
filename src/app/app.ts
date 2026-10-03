import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseStore } from './services/expense.store';
import { ExpenseChartComponent } from './components/expense-chart/expense-chart';
import { ManualEntryModalComponent } from './components/manual-entry-modal/manual-entry-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ExpenseChartComponent, ManualEntryModalComponent],
  template: `
    <div class="app-layout">
      <!-- Top Metrics & Month Filter -->
      <header class="app-header">
        <div>
          <span class="label">Total Outflow</span>
          <h1 class="total-spend">₹{{ store.totalSpend().toLocaleString('en-IN') }}</h1>
        </div>
        <select 
          class="month-select"
          [value]="store.selectedMonth()"
          (change)="store.selectedMonth.set(+$any($event.target).value)">
          <option [value]="0">January</option>
          <option [value]="1">February</option>
          <option [value]="2">March</option>
          <option [value]="3">April</option>
          <option [value]="4">May</option>
          <option [value]="5">June</option>
          <option [value]="6">July</option>
          <option [value]="7">August</option>
          <option [value]="8">September</option>
          <option [value]="9">October</option>
          <option [value]="10">November</option>
          <option [value]="11">December</option>
        </select>
      </header>

      <!-- Scrollable Card Selection Filter -->
      <nav class="cards-carousel">
        <button
          (click)="store.selectedCard.set(null)"
          [class.active]="store.selectedCard() === null"
          class="filter-pill">
          All Cards
        </button>
        @for (card of store.distinctCards(); track card) {
          <button
            (click)="store.selectedCard.set(card)"
            [class.active]="store.selectedCard() === card"
            class="filter-pill">
            ••{{ card }}
          </button>
        }
      </nav>

      <!-- Analytics Breakdown Section -->
      <section class="card-section">
        <div class="section-top">
          <span class="section-title">Breakdown</span>
          <button class="toggle-link" (click)="toggleChartMode()">
            {{ chartMode() === 'cards' ? 'View Categories' : 'View Cards' }}
          </button>
        </div>

        @defer (on viewport) {
          <app-expense-chart [data]="chartMode() === 'cards' ? store.spendByCard() : store.spendByCategory()" />
        } @placeholder {
          <div class="chart-skeleton">Loading Visual Data...</div>
        }
      </section>

      <!-- Recent Transactions List -->
      <section class="tx-section">
        <div class="section-top">
          <span class="section-title">Transactions</span>
          <span class="count-badge">{{ store.filteredTransactions().length }}</span>
        </div>

        <div class="tx-list">
          @for (tx of store.filteredTransactions(); track tx.id) {
            <article class="tx-item">
              <div class="tx-left">
                <div class="bank-avatar">
                  {{ (tx.bank_name || 'TX').substring(0, 2).toUpperCase() }}
                </div>
                <div>
                  <h4 class="merchant-name">{{ tx.merchant }}</h4>
                  <p class="meta-sub">
                    {{ tx.card_last4 ? '•• ' + tx.card_last4 : 'Manual' }} · {{ tx.category }}
                  </p>
                </div>
              </div>
              <div class="tx-right">
                <span class="amount">-₹{{ tx.amount.toLocaleString('en-IN') }}</span>
                <span class="date">{{ tx.transaction_date | date: 'dd MMM' }}</span>
              </div>
            </article>
          } @empty {
            <div class="empty-state">No transactions recorded for this period.</div>
          }
        </div>
      </section>

      <!-- Bottom Floating Action Button -->
      <button class="fab-button" (click)="showModal.set(true)" aria-label="Add manual expense">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
      </button>

      <!-- Manual Entry Modal -->
      @if (showModal()) {
        <app-manual-entry-modal (close)="showModal.set(false)" />
      }
    </div>
  `,
  styles: [`
    .app-layout {
      width: 100%;
      max-width: 440px;
      padding: 1.5rem 1rem 6rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      font-weight: 600;
    }
    .total-spend {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.03em;
      margin-top: 0.15rem;
    }
    .month-select {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      outline: none;
    }
    .cards-carousel {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .cards-carousel::-webkit-scrollbar {
      display: none;
    }
    .filter-pill {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      border-radius: 9999px;
      padding: 0.4rem 0.9rem;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-pill.active {
      background: var(--accent);
      color: var(--accent-text);
      border-color: var(--accent);
    }
    .card-section {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 1.25rem;
    }
    .section-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }
    .toggle-link {
      background: none;
      border: none;
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .chart-skeleton {
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      color: var(--text-dim);
    }
    .tx-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .count-badge {
      font-size: 0.75rem;
      color: var(--text-dim);
    }
    .tx-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .tx-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      padding: 0.85rem 1rem;
      border-radius: 16px;
    }
    .tx-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .bank-avatar {
      width: 38px;
      height: 38px;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent);
    }
    .merchant-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .meta-sub {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.15rem;
    }
    .tx-right {
      text-align: right;
    }
    .amount {
      display: block;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .date {
      display: block;
      font-size: 0.7rem;
      color: var(--text-dim);
      margin-top: 0.15rem;
    }
    .empty-state {
      text-align: center;
      padding: 2.5rem 1rem;
      border: 1px dashed var(--border-subtle);
      border-radius: 16px;
      font-size: 0.85rem;
      color: var(--text-dim);
    }
    .fab-button {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      width: 56px;
      height: 56px;
      border-radius: 18px;
      background: var(--accent);
      color: var(--accent-text);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px var(--accent-glow);
      cursor: pointer;
      z-index: 50;
      transition: transform 0.15s ease;
    }
    .fab-button:active {
      transform: scale(0.92);
    }
    .fab-button svg {
      width: 26px;
      height: 26px;
    }
  `]
})
export class AppComponent implements OnInit {
  store = inject(ExpenseStore);
  showModal = signal<boolean>(false);
  chartMode = signal<'cards' | 'category'>('cards');

  ngOnInit() {
    this.store.fetchTransactions();
  }

  toggleChartMode() {
    this.chartMode.update(m => m === 'cards' ? 'category' : 'cards');
  }
}