import type { PlmMotion } from './plm';

export interface User {
  id: number;
  name: string;
  machine_id: string;
}

export interface MotionRecord {
  id: number;
  user_id?: number;
  name: string;
  payload: PlmMotion | string; // Kolom payload MySQL
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  expires_at?: string
  user: User;
  message?: string;
}