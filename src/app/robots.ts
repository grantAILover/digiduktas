import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth", "/parduoti", "/paskyra", "/pirkiniai"],
    },
    sitemap: "https://digiduktas.lt/sitemap.xml",
    host: "https://digiduktas.lt",
  };
}
