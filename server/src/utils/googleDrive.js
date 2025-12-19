import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
);

// Set credentials from refresh token
if (process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });
}

// Initialize Drive API
const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Upload file to Google Drive
 * @param {Object} options - Upload options
 * @param {string} options.filename - File name
 * @param {string} options.mimeType - MIME type
 * @param {Buffer} options.buffer - File buffer
 * @param {string} options.folderId - Target folder ID
 * @returns {Promise<Object>} - Upload result
 */
export const uploadToGoogleDrive = async ({ filename, mimeType, buffer, folderId }) => {
  try {
    // Check if credentials are configured
    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      throw new Error('Google Drive not configured');
    }

    // Create readable stream from buffer
    const stream = Readable.from(buffer);

    // File metadata
    const fileMetadata = {
      name: `${Date.now()}-${filename}`,
      parents: folderId ? [folderId] : undefined,
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, name, mimeType, size, webViewLink, webContentLink',
    });

    const file = response.data;

    // Make file publicly accessible (optional, based on settings)
    if (process.env.GOOGLE_DRIVE_SUPPORT_SHARED === 'true') {
      try {
        await drive.permissions.create({
          fileId: file.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permError) {
        console.warn('Could not set public permissions:', permError.message);
      }
    }

    // Generate public URL
    const publicUrl = process.env.GOOGLE_DRIVE_PUBLIC_URL_TEMPLATE
      ? process.env.GOOGLE_DRIVE_PUBLIC_URL_TEMPLATE.replace('{{fileId}}', file.id)
      : `https://drive.google.com/uc?id=${file.id}`;

    return {
      provider: 'drive',
      fileId: file.id,
      path: file.name,
      url: file.webViewLink,
      publicUrl,
      thumbnailUrl: mimeType.startsWith('image/')
        ? `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`
        : null,
    };
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Google Drive
 * @param {string} fileId - File ID to delete
 */
export const deleteFromGoogleDrive = async (fileId) => {
  try {
    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      throw new Error('Google Drive not configured');
    }

    await drive.files.delete({ fileId });
    return { success: true };
  } catch (error) {
    console.error('Google Drive delete error:', error);
    throw error;
  }
};

/**
 * Get file URL from Google Drive
 * @param {string} fileId - File ID
 * @returns {Promise<string>} - File URL
 */
export const getFileUrl = async (fileId) => {
  try {
    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      return null;
    }

    const response = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    });

    return response.data.webContentLink || response.data.webViewLink;
  } catch (error) {
    console.error('Google Drive get URL error:', error);
    return null;
  }
};

/**
 * List files in a folder
 * @param {string} folderId - Folder ID
 * @param {number} pageSize - Number of files to retrieve
 * @returns {Promise<Array>} - List of files
 */
export const listFiles = async (folderId, pageSize = 100) => {
  try {
    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      return [];
    }

    const response = await drive.files.list({
      q: folderId ? `'${folderId}' in parents` : undefined,
      pageSize,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
    });

    return response.data.files;
  } catch (error) {
    console.error('Google Drive list files error:', error);
    return [];
  }
};

/**
 * Create folder in Google Drive
 * @param {string} folderName - Folder name
 * @param {string} parentFolderId - Parent folder ID
 * @returns {Promise<Object>} - Created folder
 */
export const createFolder = async (folderName, parentFolderId) => {
  try {
    if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
      throw new Error('Google Drive not configured');
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name',
    });

    return response.data;
  } catch (error) {
    console.error('Google Drive create folder error:', error);
    throw error;
  }
};

/**
 * Check if Google Drive is configured
 * @returns {boolean}
 */
export const isDriveConfigured = () => {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
};

export default {
  uploadToGoogleDrive,
  deleteFromGoogleDrive,
  getFileUrl,
  listFiles,
  createFolder,
  isDriveConfigured,
};
