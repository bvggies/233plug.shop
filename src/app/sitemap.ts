import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://233plug.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/request`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/cart`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
}
