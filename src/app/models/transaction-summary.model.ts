export interface Transaction {
  id: number;
  title: string;
  balance: number;
  transaction_year: number;
  transaction_month: number;
  transaction_day: number;
  category_name: string;
  subcategory_name: string;
}

export interface TransactionItem {
  title: string;
  balance: number;
  category_name: string;
  subcategory_name: string;
  id: number;
  mt_date: string;
  period1: string;
  period2: string;
}

export interface DailySummary {
  balance: number;
  items: TransactionItem[];
  date?: Date;
}

export interface MonthlySummary {
  pos: number;
  neg: number;
  total: number;
  days: { [day: number]: DailySummary };
}

export interface SummaryResponse {
  positive: number;
  negative: number;
  total: number;
  total_count: number;
  data: { [month: string]: MonthlySummary };
}

export interface TransactionFilters {
  startDate: string;
  endDate: string;
  categoryIds: number[];
  subcategoryIds: number[];
  accountIds?: number[];
  search: string;
  isExpense?: number;
}

export interface ChartMonthData {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
}

export interface SubcategoryBreakdown {
  name: string;
  value: number;
  category_name: string;
}

export interface ChartResponse {
  months: ChartMonthData[];
  category_breakdown: CategoryBreakdown[];
  subcategory_breakdown: SubcategoryBreakdown[];
  income_breakdown: CategoryBreakdown[];
  income_subcategory_breakdown: SubcategoryBreakdown[];
  balance_evolution: number[];
}

export interface AttentionItem {
  mt_id: number;
  title: string;
  date: string;
  is_expense: number;
  balance: number;
  category_name: string;
  subcategory_name: string;
  issue: string;
}

export interface NotificationItem {
  id: number;
  name: string;
  date: string;
  object_id: number;
  object_type: string;
  is_active: boolean;
  friend_id: number;
  user_name: string;
  title?: string;
  total?: number;
  object_name?: string;
  mt_id?: number;
}

export interface LogItem {
  id: number;
  name: string;
  date: string;
  object_id: number;
  object_type: string;
  notify: boolean;
  is_active: boolean;
  user_name: string;
  title?: string;
  total?: number;
  object_name?: string;
  mt_id?: number;
}

export interface MultiTransactionDetail {
  id: number;
  title: string;
  date: string;
  period1: string;
  period2: string;
  category_id: number;
  subcategory_id: number;
  is_expense: number;
  total: number;
  transactions: { account_name: string; value: number; account_id: number }[];
}
