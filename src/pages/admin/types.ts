export interface Route {
  id: number;
  from_city: string;
  to_city: string;
  km_normal: number;
  km_special: number;
  km_total: number;
  notes: string;
}

export interface CheckResult {
  total_routes: number;
  offset: number;
  limit: number;
  checked: number;
  ok: number;
  deviations: number;
  errors: number;
  has_more: boolean;
  next_offset: number | null;
  problems: CheckProblem[];
}

export interface CheckProblem {
  id: number;
  route_id?: number;
  from: string;
  to: string;
  ref_km?: number;
  calc_km?: number;
  deviation?: number;
  status?: string;
  error?: string;
  detail?: string;
}

export interface DailyReport {
  date: string;
  total: number;
  ok: number;
  deviations: number;
  errors: number;
}

export interface FixResult {
  route_id: number;
  status: string;
  from: string;
  to: string;
  old_total?: number;
  new_total?: number;
  message?: string;
  error?: string;
}
