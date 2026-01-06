import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://vocab-app.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
