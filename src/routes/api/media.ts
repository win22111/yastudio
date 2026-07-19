import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url) {
          return new Response("Missing url parameter", { status: 400 });
        }

        try {
          const parsedUrl = new URL(url);
          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

          if (supabaseUrl) {
            const supabaseHost = new URL(supabaseUrl).host;
            if (parsedUrl.host !== supabaseHost) {
              return new Response("Forbidden: URL must be from the configured Supabase instance", { status: 403 });
            }
          } else {
            // Fallback security check
            if (!parsedUrl.host.endsWith("supabase.co")) {
              return new Response("Forbidden host", { status: 403 });
            }
          }

          const response = await fetch(url);
          if (!response.ok) {
            return new Response(`Failed to fetch media: ${response.statusText}`, { status: response.status });
          }

          const blob = await response.blob();
          const contentType = response.headers.get("content-type") || "image/webp";

          return new Response(blob, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        } catch (error: any) {
          return new Response(`Error: ${error.message}`, { status: 500 });
        }
      },
    },
  },
});
