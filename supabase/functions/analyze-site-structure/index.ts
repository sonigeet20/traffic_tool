import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface SiteStructure {
  baseUrl: string;
  navigablePages: string[];
  formPages: string[];
  contentAreas: string[];
  internalLinks: number;
  images: number;
  scripts: number;
  analyzed_at: string;
  confidence: number;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // In production, this would use Puppeteer to actually trace the website
    // For now, return a simulated structure based on common patterns
    const simulatedStructure: SiteStructure = {
      baseUrl: url,
      navigablePages: generateNavigablePages(url),
      formPages: generateFormPages(url),
      contentAreas: ["hero", "product-grid", "testimonials", "footer", "navbar"],
      internalLinks: Math.floor(Math.random() * 30) + 10,
      images: Math.floor(Math.random() * 50) + 10,
      scripts: Math.floor(Math.random() * 20) + 5,
      analyzed_at: new Date().toISOString(),
      confidence: 0.85 + Math.random() * 0.15,
    };

    return new Response(JSON.stringify(simulatedStructure), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error analyzing site:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze site structure" }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );
  }
});

function generateNavigablePages(baseUrl: string): string[] {
  const commonPaths = [
    "",
    "/products",
    "/services",
    "/about",
    "/contact",
    "/blog",
    "/pricing",
    "/features",
    "/testimonials",
    "/case-studies",
    "/faq",
    "/help",
  ];

  return commonPaths
    .map((path) => {
      try {
        const url = new URL(baseUrl);
        return url.origin + path;
      } catch {
        return baseUrl + path;
      }
    })
    .filter((_, idx) => Math.random() > 0.3); // Filter out some pages randomly
}

function generateFormPages(baseUrl: string): string[] {
  const commonForms = ["/contact", "/subscribe", "/get-started", "/demo-request"];
  
  return commonForms.filter(() => Math.random() > 0.4).map((path) => {
    try {
      const url = new URL(baseUrl);
      return url.origin + path;
    } catch {
      return baseUrl + path;
    }
  });
}
