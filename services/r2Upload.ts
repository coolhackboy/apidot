/**
 * Upload base64 image to Cloudflare R2
 * @param base64Image - Base64 encoded image string (with data:image/...;base64, prefix)
 * @returns Promise with CDN URL
 */
export async function uploadImageToR2(base64Image: string): Promise<string> {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.url) {
      throw new Error('Invalid response from upload API');
    }

    return data.url;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
}

/**
 * Upload multiple base64 images to Cloudflare R2
 * @param base64Images - Array of base64 encoded image strings
 * @returns Promise with array of CDN URLs
 */
export async function uploadImagesToR2(base64Images: string[]): Promise<string[]> {
  const uploadPromises = base64Images.map(img => uploadImageToR2(img));
  return Promise.all(uploadPromises);
}
