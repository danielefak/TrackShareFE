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
  is_order?: boolean;
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

export interface OrderResponse {
  id: number;
  title: string;
  date: string;
  day: number;
  month: number;
  year: number;
  value: number;
  category_id: number;
  category_name: string;
  subcategory_id: number;
  subcategory_name: string;
  is_expense: number;
  period1: string | null;
  period2: string | null;
  created_at: string | null;
  items: OrderTransactionResponse[];
}

export interface OrderTransactionResponse {
  id: number;
  account_id: number;
  account_name: string;
  value: number;
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
