import { z } from "zod";

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Review validation schema
export const reviewSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .regex(emailRegex, "Invalid email format")
    .trim()
    .toLowerCase(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters")
    .trim(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// Content resource validation schema
export const contentResourceSchema = z.enum(["site_content", "skills", "experience", "projects", "settings"]);

export const contentPayloadSchema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

export type ContentInput = z.infer<typeof contentPayloadSchema>;

// Admin login validation schema
export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .regex(emailRegex, "Invalid email format")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required")
    .max(255, "Password must be less than 255 characters"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
