import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force NEXT_PUBLIC_* vars into the client bundle at build time. This is
  // belt-and-suspenders for Railway, whose Nixpacks build occasionally fails
  // to expose dashboard env vars during `next build`, leaving the client with
  // an unconfigured Supabase client (`supabaseUrl is required`).
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default nextConfig;
