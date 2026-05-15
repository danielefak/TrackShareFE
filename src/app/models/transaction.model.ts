export interface MultiTransactionCreate {
  title: string;
  date: string;
  period1?: string;
  period2?: string;
  category_id: number;
  subcategory_id: number;
  is_expense: number;
  account_id: number;
  value: number;
  items?: { account_id: number; value: number }[];
}

export interface TransactionItemCreate {
  account_id: number;
  value: number;
}

export interface MultiTransactionCreated {
  id: number;
}

export interface MultiTransactionUpdate {
  title: string;
  date: string;
  period1?: string;
  period2?: string;
  category_id: number;
  subcategory_id: number;
  is_expense: number;
  items: { account_id: number; value: number }[];
}

export interface MultiTransactionDetailResponse {
  id: number;
  title: string;
  date: string;
  period1: string;
  period2: string;
  category_id: number;
  subcategory_id: number;
  is_expense: number;
  transactions: { account_name: string; value: number; account_id: number }[];
}
