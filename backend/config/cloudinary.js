const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
  process.env.CLOUDINARY_API_SECRET && 
  process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret';

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️  Cloudinary is not fully configured in your environment variables. Please check your .env file.');
}

/**
 * Uploads a local file to Cloudinary and returns the upload result.
 * @param {string} localFilePath - Path to the local temporary file.
 * @param {string} folder - Folder name in Cloudinary.
 * @returns {Promise<object>} - Cloudinary upload result object
 */
const uploadToCloudinary = async (localFilePath, folder = 'inward_outward') => {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Please supply valid CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
  }

  try {
    if (!localFilePath) return null;
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto' // Crucial: allows PDF, DOC, DOCX as well as images
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Deletes an asset from Cloudinary using its secure URL.
 * @param {string} secureUrl - Cloudinary secure URL.
 * @returns {Promise<object|null>}
 */
const deleteFromCloudinary = async (secureUrl) => {
  if (!isConfigured) {
    console.warn('Cloudinary is not configured. Skipping deletion.');
    return null;
  }

  try {
    if (!secureUrl) return null;
    // Extract public_id from secureUrl.
    // Example: https://res.cloudinary.com/cloudname/image/upload/v1234567/folder/publicid.jpg
    const parts = secureUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Everything after /upload/v[number]/ is the public_id + extension
    // E.g., v1234567/folder/publicid.jpg -> folder/publicid.jpg
    let publicIdWithFormat = parts.slice(uploadIndex + 2).join('/');
    
    // Remove the extension to get the raw public_id
    const dotIndex = publicIdWithFormat.lastIndexOf('.');
    if (dotIndex !== -1) {
      publicIdWithFormat = publicIdWithFormat.substring(0, dotIndex);
    }
    
    // Determine resource_type from URL ('raw' or 'image')
    const resourceType = secureUrl.includes('/raw/upload/') ? 'raw' : 'image';
    
    const result = await cloudinary.uploader.destroy(publicIdWithFormat, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured: () => isConfigured
};
