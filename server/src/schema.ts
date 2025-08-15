import { z } from 'zod';

// User authentication schema
export const userSchema = z.object({
  id: z.string(), // UUID from auth provider
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().url().nullable(),
  provider: z.enum(['google', 'email']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Road damage report schema
export const roadDamageReportSchema = z.object({
  id: z.string(), // UUID
  user_id: z.string(), // Foreign key to users
  reporter_name: z.string(),
  reporter_phone: z.string(),
  reporter_address: z.string(),
  report_date: z.coerce.date(),
  damage_description: z.string().nullable(),
  photo_url: z.string().url(),
  latitude: z.number(),
  longitude: z.number(),
  status: z.enum(['pending', 'in_progress', 'resolved', 'rejected']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type RoadDamageReport = z.infer<typeof roadDamageReportSchema>;

// Input schema for creating road damage reports
export const createRoadDamageReportInputSchema = z.object({
  reporter_name: z.string().min(1, 'Nama pelapor wajib diisi'),
  reporter_phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  reporter_address: z.string().min(5, 'Alamat wajib diisi'),
  report_date: z.coerce.date(),
  damage_description: z.string().nullable(),
  photo_url: z.string().url('URL foto tidak valid'),
  latitude: z.number().min(-90).max(90, 'Latitude tidak valid'),
  longitude: z.number().min(-180).max(180, 'Longitude tidak valid'),
});

export type CreateRoadDamageReportInput = z.infer<typeof createRoadDamageReportInputSchema>;

// Input schema for updating road damage reports
export const updateRoadDamageReportInputSchema = z.object({
  id: z.string(),
  reporter_name: z.string().min(1, 'Nama pelapor wajib diisi').optional(),
  reporter_phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional(),
  reporter_address: z.string().min(5, 'Alamat wajib diisi').optional(),
  report_date: z.coerce.date().optional(),
  damage_description: z.string().nullable().optional(),
  photo_url: z.string().url('URL foto tidak valid').optional(),
  latitude: z.number().min(-90).max(90, 'Latitude tidak valid').optional(),
  longitude: z.number().min(-180).max(180, 'Longitude tidak valid').optional(),
  status: z.enum(['pending', 'in_progress', 'resolved', 'rejected']).optional(),
});

export type UpdateRoadDamageReportInput = z.infer<typeof updateRoadDamageReportInputSchema>;

// Query parameters for filtering reports
export const getReportsQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'rejected']).optional(),
  user_id: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_km: z.number().positive().optional(), // For location-based filtering
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type GetReportsQuery = z.infer<typeof getReportsQuerySchema>;

// Authentication input schemas
export const createUserInputSchema = z.object({
  email: z.string().email('Email tidak valid'),
  name: z.string().min(1, 'Nama wajib diisi'),
  avatar_url: z.string().url().nullable(),
  provider: z.enum(['google', 'email']),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email('Email tidak valid'),
  provider: z.enum(['google', 'email']),
  provider_token: z.string().optional(), // For OAuth providers
});

export type LoginInput = z.infer<typeof loginInputSchema>;