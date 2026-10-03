import { Injectable, signal, computed, inject } from '@angular/core';
import { Transaction } from '../models/expense.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseStore {
  private supabase = inject(SupabaseService);

  readonly transactions = signal<Transaction[]>([]);
  readonly selectedMonth = signal<number>(new Date().getMonth());
  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly selectedCard = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly filteredTransactions = computed(() => {
    const month = this.selectedMonth();
    const year = this.selectedYear();
    const card = this.selectedCard();

    return this.transactions().filter(tx => {
      const d = new Date(tx.transaction_date);
      const matchesMonth = d.getMonth() === month && d.getFullYear() === year;
      const matchesCard = card ? tx.card_last4 === card : true;
      return matchesMonth && matchesCard;
    });
  });

  readonly totalSpend = computed(() =>
    this.filteredTransactions().reduce((sum, item) => sum + Number(item.amount), 0)
  );

  readonly spendByCard = computed(() => {
    return this.filteredTransactions().reduce((acc, t) => {
      const label = t.card_last4 ? `${t.bank_name || 'Card'} (••${t.card_last4})` : 'Cash / Manual';
      acc[label] = (acc[label] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
  });

  readonly spendByCategory = computed(() => {
    return this.filteredTransactions().reduce((acc, t) => {
      const cat = t.category || 'General';
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
  });

  readonly distinctCards = computed(() => {
    const set = new Set<string>();
    for (const t of this.transactions()) {
      if (t.card_last4) set.add(t.card_last4);
    }
    return Array.from(set);
  });

  async fetchTransactions() {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      if (data) this.transactions.set(data as Transaction[]);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addManualExpense(payload: {
    amount: number;
    merchant: string;
    category: string;
    card_last4?: string;
    bank_name?: string;
    transaction_date: string;
  }) {
    const newTx = {
      ...payload,
      currency: 'INR',
      is_manual: true,
      account_email: 'manual_entry'
    };

    const { data, error } = await this.supabase.client
      .from('transactions')
      .insert([newTx])
      .select()
      .single();

    if (error) {
      console.error('Error inserting transaction:', error);
      return;
    }

    if (data) {
      this.transactions.update(prev => [data as Transaction, ...prev]);
    }
  }
}