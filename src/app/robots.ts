import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://233plug.com";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/checkout"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
