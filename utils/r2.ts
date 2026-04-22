export const uploadToR2 = async (file: File, fileName: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);

    const response = await fetch('/api/common/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return {
      url: result.data.file_url,
      success: true
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
}; 