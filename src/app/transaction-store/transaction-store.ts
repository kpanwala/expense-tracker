// transaction.store.ts
import { Injectable, signal, computed } from '@angular/core';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  card_last4: string;
  bank_name: string;
  merchant: string;
  category: string;
  transaction_date: string;
  is_manual: boolean;
}

@Injectable({ providedIn: 'root' })
export class TransactionStore {
  readonly transactions = signal<Transaction[]>([]);
  readonly selectedMonth = signal<number>(new Date().getMonth());
  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly selectedCard = signal<string | null>(null);

  // Filtered dataset based on UI selection
  readonly filteredTransactions = computed(() => {
    return this.transactions().filter(t => {
      const d = new Date(t.transaction_date);
      const matchMonth = d.getMonth() === this.selectedMonth() && d.getFullYear() === this.selectedYear();
      const matchCard = this.selectedCard() ? t.card_last4 === this.selectedCard() : true;
      return matchMonth && matchCard;
    });
  });

  // Monthly aggregate
  readonly totalExpense = computed(() => 
    this.filteredTransactions().reduce((sum, item) => sum + Number(item.amount), 0)
  );

  // Grouped spending per card
  readonly spendingByCard = computed(() => {
    return this.filteredTransactions().reduce((acc, t) => {
      const cardKey = t.card_last4 ? `${t.bank_name ?? 'Card'} (••${t.card_last4})` : 'Manual / Other';
      acc[cardKey] = (acc[cardKey] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
  });

  addManualExpense(expense: Omit<Transaction, 'id' | 'is_manual'>) {
    const newEntry: Transaction = {
      ...expense,
      id: crypto.randomUUID(),
      is_manual: true
    };
    this.transactions.update(prev => [newEntry, ...prev]);
  }
}