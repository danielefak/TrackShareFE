export interface Account {
  id: number;
  name: string;
  balance: number;
  initial_balance: number;
  account_order: number;
  is_active: boolean;
  friend_account_id: number;
}

export interface AccountCreate {
  name: string;
  balance?: number;
}

export interface AccountUpdate {
  name?: string;
  balance?: number;
}

export interface AccountReorder {
  id: number;
  previous_id: number;
}
