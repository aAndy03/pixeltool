import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://andym.github.io/pixeltool3'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/private/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
