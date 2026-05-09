/**
 * Converts Google Drive sharing links to direct image links
 * Supported formats:
 * - https://drive.google.com/file/d/{ID}/view?usp=sharing
 * - https://drive.google.com/open?id={ID}
 * - https://drive.google.com/uc?id={ID}
 */
export function getGoogleDriveThumbnail(url: string): string {
  if (!url) return '';
  if (!url.includes('drive.google.com')) return url;

  try {
    const urlObj = new URL(url);
    let id = '';

    if (url.includes('/file/d/')) {
      const parts = urlObj.pathname.split('/');
      id = parts[parts.indexOf('d') + 1];
    } else if (urlObj.searchParams.has('id')) {
      id = urlObj.searchParams.get('id') || '';
    }

    if (id) {
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
  } catch (e) {
    console.warn('Invalid URL provided to getGoogleDriveThumbnail', e);
  }

  return url;
}

/**
 * Converts Google Drive sharing links to embeddable preview links
 */
export function getGoogleDriveEmbedUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('drive.google.com')) return url;

  try {
    const urlObj = new URL(url);
    let id = '';

    if (url.includes('/file/d/')) {
      const parts = urlObj.pathname.split('/');
      id = parts[parts.indexOf('d') + 1];
    } else if (urlObj.searchParams.has('id')) {
      id = urlObj.searchParams.get('id') || '';
    }

    if (id) {
      return `https://drive.google.com/file/d/${id}/preview`;
    }
  } catch (e) {
    console.warn('Invalid URL provided to getGoogleDriveEmbedUrl', e);
  }

  return url;
}

/**
 * Combines Tailwind classes
 */
export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
