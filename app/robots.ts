import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/support', '/accommodations'],
      disallow: ['/dashboard', '/settings', '/bookings', '/auth/', '/rooms', '/guests', '/media'],
    },
    sitemap: 'https://www.newhorizn.com/sitemap.xml',
  }
}
