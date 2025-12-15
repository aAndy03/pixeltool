import { NextRequest, NextResponse } from 'next/server'

/**
 * Image Proxy API Route
 * Fetches images from external URLs to bypass CORS restrictions.
 * Usage: /api/image-proxy?url=<encoded-url>
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    try {
        // Fetch the image from the external URL
        const response = await fetch(imageUrl, {
            headers: {
                // Pretend to be a browser to avoid some restrictions
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            )
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const buffer = await response.arrayBuffer()

        // Return the image with proper headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (error) {
        console.error('Image proxy error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch image' },
            { status: 500 }
        )
    }
}
