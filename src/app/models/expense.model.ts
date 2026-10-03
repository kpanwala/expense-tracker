export interface Transaction {
  id: string;
  account_email: string;
  message_id?: string;
  amount: number;
  currency: string;
  card_last4: string;
  bank_name: string;
  merchant: string;
  category: string;
  transaction_date: string;
  is_manual: boolean;
  notes?: string;
}