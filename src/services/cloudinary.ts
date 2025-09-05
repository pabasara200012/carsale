// Cloudinary configuration - Your actual config
const CLOUDINARY_CONFIG = {
  cloud_name: 'dduecixeg',
  api_key: '197811514974664',
  api_secret: 'Zyj_ArENOlY1Uh_gUF_y1Gk_IsA'
};

// Upload image to Cloudinary using fetch API
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    // Try the custom preset first, fallback to default if it doesn't exist
    formData.append('upload_preset', 'car_images'); // Create this preset in Cloudinary, or use 'ml_default' as fallback
    formData.append('folder', 'car_sale_system'); // Organize uploads in a folder
    
    console.log('Uploading image:', file.name, 'Size:', file.size);
    
    fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      console.log('Cloudinary response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Cloudinary response data:', data);
      if (data.secure_url) {
        resolve(data.secure_url);
      } else if (data.error && data.error.message.includes('upload_preset')) {
        // If preset doesn't exist, try with default preset
        console.log('Custom preset not found, trying with default preset...');
        const fallbackFormData = new FormData();
        fallbackFormData.append('file', file);
        fallbackFormData.append('upload_preset', 'ml_default');
        
        return fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`, {
          method: 'POST',
          body: fallbackFormData
        });
      } else {
        reject(new Error(data.error?.message || 'Upload failed - no secure URL returned'));
      }
    })
    .then(fallbackResponse => {
      if (fallbackResponse) {
        return fallbackResponse.json();
      }
    })
    .then(fallbackData => {
      if (fallbackData && fallbackData.secure_url) {
        console.log('Upload successful with fallback preset');
        resolve(fallbackData.secure_url);
      } else if (fallbackData) {
        reject(new Error(fallbackData.error?.message || 'Upload failed with fallback preset'));
      }
    })
    .catch(error => {
      console.error('Cloudinary upload error:', error);
      reject(error);
    });
  });
};

// Upload multiple images with better error handling
export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  console.log('Starting upload of', files.length, 'images to Cloudinary');
  
  // Validate files
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
    }
    if (!file.type.startsWith('image/')) {
      throw new Error(`File ${file.name} is not an image.`);
    }
  }
  
  const uploadPromises = files.map((file, index) => 
    uploadImageToCloudinary(file).catch(error => {
      console.error(`Error uploading file ${index + 1} (${file.name}):`, error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    })
  );
  
  try {
    const results = await Promise.all(uploadPromises);
    console.log('All uploads completed successfully to Cloudinary:', results);
    return results;
  } catch (error) {
    console.error('Cloudinary upload batch failed:', error);
    throw error;
  }
};

// Temporary upload method using base64 (for small images only in development)
export const uploadImagesAsBase64 = async (files: File[]): Promise<string[]> => {
  console.log('Using base64 upload for development (small images only)');
  
  // Reject if any file is too large for base64
  for (const file of files) {
    if (file.size > 500 * 1024) { // 500KB limit for base64
      throw new Error(`File ${file.name} is too large for development mode. Please configure Cloudinary for files over 500KB.`);
    }
  }
  
  const promises = files.map(file => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });
  
  return Promise.all(promises);
};

// Delete image from Cloudinary
export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_id: publicId,
        api_key: CLOUDINARY_CONFIG.api_key,
        timestamp: Math.floor(Date.now() / 1000),
      })
    });
    
    const result = await response.json();
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Get public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};

export default {
  uploadImageToCloudinary,
  uploadMultipleImages,
  uploadImagesAsBase64,
  deleteImageFromCloudinary,
  getPublicIdFromUrl
};
