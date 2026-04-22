import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return new NextResponse('Missing file URL', { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return new NextResponse('Failed to fetch file', { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const buffer = await response.arrayBuffer();

    // Extract filename from URL or use default
    let filename = 'download';
    try {
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        filename = lastPart;
      } else {
        // Try to determine file extension from content type
        if (contentType?.includes('video')) {
          filename = `video_${Date.now()}.mp4`;
        } else if (contentType?.includes('image')) {
          filename = `image_${Date.now()}.jpg`;
        } else if (contentType?.includes('audio')) {
          filename = `audio_${Date.now()}.mp3`;
        } else {
          filename = `file_${Date.now()}`;
        }
      }
    } catch (error) {
      console.warn('Could not parse filename from URL:', error);
      filename = `download_${Date.now()}`;
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': contentLength || buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return new NextResponse('Failed to download file', { status: 500 });
  }
}