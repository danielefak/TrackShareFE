export interface FriendAccount {
  id: number;
  name: string;
  balance: number;
  initial_balance: number;
  account_order: number;
  is_active: boolean;
  friend_account_id: number;
  friend_name: string;
}

export interface FriendAddRequest {
  name: string;
  email: string;
  key: string;
  balance: number;
}
