import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes image URLs to ensure direct access where possible.
 * Specifically handles Google Drive sharing links.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return ''

  // Google Drive
  // Pattern 1: https://drive.google.com/file/d/VIDEO_ID/view?usp=sharing
  // Pattern 2: https://drive.google.com/open?id=VIDEO_ID
  if (url.includes('drive.google.com')) {
    let id = ''
    const parts = url.split('/')

    // Try identifying /file/d/ID pattern
    const fileIndex = parts.indexOf('file')
    if (fileIndex !== -1 && parts[fileIndex + 1] === 'd' && parts[fileIndex + 2]) {
      id = parts[fileIndex + 2]
    }

    // Try identifying id=ID query param
    if (!id) {
      try {
        const urlObj = new URL(url)
        id = urlObj.searchParams.get('id') || ''
      } catch (e) {
        // Invalid URL
      }
    }

    if (id) {
      return `https://drive.google.com/uc?export=view&id=${id}`
    }
  }

  return url
}
