import { apiGet } from './client';

export interface DashboardStats {
  total_interviews: number;
  dimensions: Record<string, number>;
  top_strength: string;
  top_weakness: string;
}

export interface TrendData {
  date: string;
  company: string;
  role: string;
  type: string;
  average_score: number;
}

export interface DashboardTrends {
  trends: TrendData[];
}

export function getDashboardStats(userId?: number): Promise<DashboardStats> {
  const url = userId ? `/dashboard/stats?user_id=${userId}` : '/dashboard/stats';
  return apiGet<DashboardStats>(url);
}

export function getDashboardTrends(userId?: number): Promise<DashboardTrends> {
  const url = userId ? `/dashboard/trends?user_id=${userId}` : '/dashboard/trends';
  return apiGet<DashboardTrends>(url);
}
