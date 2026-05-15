export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  order: number;
  is_main: boolean;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  order: number;
  is_expense: number;
  is_active: boolean;
  default: boolean;
  subcategories: SubCategory[];
}

export interface CategoryCreate {
  name: string;
  is_expense: number;
}

export interface SubCategoryCreate {
  name: string;
  category_id: number;
}

export interface CategoryUpdate {
  name: string;
}

export interface SubCategoryUpdate {
  name: string;
}
