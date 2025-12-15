import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'PixelTool',
        short_name: 'PixelTool',
        description: 'A powerful web-based design and pixel art tool.',
        start_url: '/pixeltool3/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}
