import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters long"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  PUSHER_APP_ID: z.string().min(1),
  NEXT_PUBLIC_PUSHER_KEY: z.string().min(1),
  PUSHER_SECRET: z.string().min(1),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1),
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1).optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  for (const [key, errors] of Object.entries(_env.error.flatten().fieldErrors)) {
    console.error(`  - ${key}: ${errors.join(", ")}`);
  }
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
