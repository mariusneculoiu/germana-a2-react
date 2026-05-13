import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// Vite automatically exposes any env var prefixed with VITE_ to client code
// via import.meta.env. We use:
//   VITE_SUPABASE_URL              - your Supabase project URL
//   VITE_SUPABASE_PUBLISHABLE_KEY  - the public anon key (safe to expose)
// The actual AI provider key (LOVABLE_API_KEY) lives as a Supabase Edge Function
// secret on the server side - never exposed to the client.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
