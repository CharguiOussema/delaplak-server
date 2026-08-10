import { ProductModel } from '../models/product.model';
import { CategoryModel } from '../models/category.model';
import { OrderModel } from '../models/order.model';
import { UserModel } from '../models/user.model';
import { InvoiceModel } from '../models/invoice.model';
import { ORDER_STATUS, USER_ROLES } from '../types/consts';
import {
  DASHBOARD_CATEGORY_LIMIT,
  DASHBOARD_LOW_STOCK_LIMIT,
  DASHBOARD_TREND_DAYS,
  LOW_STOCK_THRESHOLD,
} from '../constants/dashboard.const';
import {
  DashboardStats,
  DailyCount,
  LowStockProduct,
  ProductStats,
  CategoryStats,
  OrderStats,
  UserStats,
  InvoiceStats,
} from '../types-server/dashboard/dashboardStats.types';

// Every order/invoice on this single-vendor platform is created with one fixed currency
// (Product.currency defaults to 'TND' too, see product.model.ts) — no per-currency grouping needed.
const DEFAULT_CURRENCY = 'TND';

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getProductStats(): Promise<ProductStats> {
  const [total, stockAgg, lowStockCount, byCategoryAgg] = await Promise.all([
    ProductModel.countDocuments({ isDeleted: false }),
    ProductModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, totalStock: { $sum: '$stock' } } }]),
    ProductModel.countDocuments({ isDeleted: false, stock: { $lte: LOW_STOCK_THRESHOLD } }),
    ProductModel.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: DASHBOARD_CATEGORY_LIMIT },
      { $lookup: { from: CategoryModel.collection.name, localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, label: '$category.name.en', value: '$count' } },
    ]),
  ]);

  return {
    total,
    totalStock: stockAgg[0]?.totalStock ?? 0,
    lowStockCount,
    byCategory: byCategoryAgg,
  };
}

async function getLowStockProducts(): Promise<LowStockProduct[]> {
  return ProductModel.find({ isDeleted: false, stock: { $lte: LOW_STOCK_THRESHOLD } })
    .sort({ stock: 1 })
    .limit(DASHBOARD_LOW_STOCK_LIMIT)
    .select('name stock')
    .lean() as unknown as LowStockProduct[];
}

async function getCategoryStats(): Promise<CategoryStats> {
  const total = await CategoryModel.countDocuments({ isDeleted: false });
  return { total };
}

async function getOrderStats(): Promise<OrderStats> {
  const since = new Date();
  since.setDate(since.getDate() - (DASHBOARD_TREND_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [total, byStatusAgg, revenueAgg, trendAgg] = await Promise.all([
    OrderModel.countDocuments({ isDeleted: false }),
    OrderModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    OrderModel.aggregate([
      { $match: { isDeleted: false, status: ORDER_STATUS.CONFIRMED } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    OrderModel.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const countByStatus = new Map<string, number>(byStatusAgg.map((s) => [s._id, s.count]));
  const byStatus = Object.values(ORDER_STATUS).map((status) => ({ status, count: countByStatus.get(status) ?? 0 }));

  const countByDate = new Map<string, number>(trendAgg.map((t) => [t._id, t.count]));
  const trend: DailyCount[] = Array.from({ length: DASHBOARD_TREND_DAYS }, (_, i) => {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const date = toDateKey(day);
    return { date, count: countByDate.get(date) ?? 0 };
  });

  return {
    total,
    byStatus,
    totalRevenue: revenueAgg[0]?.total ?? 0,
    currency: DEFAULT_CURRENCY,
    trend,
  };
}

async function getUserStats(): Promise<UserStats> {
  const [total, byRoleAgg] = await Promise.all([
    UserModel.countDocuments({ isDeleted: false }),
    UserModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  const countByRole = new Map<string, number>(byRoleAgg.map((r) => [r._id, r.count]));
  const byRole = Object.values(USER_ROLES).map((role) => ({ role, count: countByRole.get(role) ?? 0 }));

  return { total, byRole };
}

async function getInvoiceStats(): Promise<InvoiceStats> {
  const [total, amountAgg] = await Promise.all([
    InvoiceModel.countDocuments({ isDeleted: false }),
    InvoiceModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
  ]);

  return { total, totalAmount: amountAgg[0]?.total ?? 0, currency: DEFAULT_CURRENCY };
}

export async function getStats(): Promise<DashboardStats> {
  const [products, categories, orders, users, invoices, lowStockProducts] = await Promise.all([
    getProductStats(),
    getCategoryStats(),
    getOrderStats(),
    getUserStats(),
    getInvoiceStats(),
    getLowStockProducts(),
  ]);

  return { products, categories, orders, users, invoices, lowStockProducts };
}
