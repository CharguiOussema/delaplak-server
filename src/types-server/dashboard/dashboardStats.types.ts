import { ORDER_STATUS, USER_ROLES } from '../../types/consts';

export type ChartSlice = { label: string; value: number };

export type ProductStats = {
  total: number;
  totalStock: number;
  lowStockCount: number;
  byCategory: ChartSlice[];
};

export type CategoryStats = {
  total: number;
};

export type OrderStatusCount = { status: ORDER_STATUS; count: number };
export type DailyCount = { date: string; count: number };

export type OrderStats = {
  total: number;
  byStatus: OrderStatusCount[];
  totalRevenue: number;
  currency: string;
  trend: DailyCount[];
};

export type UserRoleCount = { role: USER_ROLES; count: number };

export type UserStats = {
  total: number;
  byRole: UserRoleCount[];
};

export type InvoiceStats = {
  total: number;
  totalAmount: number;
  currency: string;
};

export type LowStockProduct = {
  _id: string;
  name: { en: string; fr: string; ar: string };
  stock: number;
};

export type DashboardStats = {
  products: ProductStats;
  categories: CategoryStats;
  orders: OrderStats;
  users: UserStats;
  invoices: InvoiceStats;
  lowStockProducts: LowStockProduct[];
};
