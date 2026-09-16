import type { MetadataRoute } from "next";

const BASE = "https://digiduktas.lt";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, freq: "weekly" },
    { path: "/produktai", priority: 0.9, freq: "daily" },
    { path: "/kaip-veikia", priority: 0.6, freq: "monthly" },
    { path: "/naujienos", priority: 0.6, freq: "weekly" },
    { path: "/privatumas", priority: 0.3, freq: "yearly" },
    { path: "/taisykles", priority: 0.3, freq: "yearly" },
    { path: "/grazinimai", priority: 0.3, freq: "yearly" },
  ];
  return routes.map((r) => ({
    url: `${BASE}${r.path === "/" ? "" : r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
