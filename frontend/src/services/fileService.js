/**
 * File Service
 * Handles file uploads, downloads, and management with Supabase Storage
 */

import { supabase } from '../config/supabase';

const BUCKET_NAME = 'lms-files'; // Ensure this bucket exists in Supabase

/**
 * Upload a file to Supabase Storage
 * @param {File} file - File object to upload
 * @param {string} folder - Folder path (e.g., 'assignments', 'lessons')
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Upload result with file URL
 */
export const uploadFile = async (file, folder = 'uploads', onProgress = null) => {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}_${randomString}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return {
            success: true,
            filePath: data.path,
            fileUrl: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        };
    } catch (error) {
        if (import.meta.env.DEV) console.error('File upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Upload multiple files
 * @param {FileList} files - Files to upload
 * @param {string} folder - Folder path
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleFiles = async (files, folder = 'uploads', onProgress = null) => {
    const fileArray = Array.from(files);
    const results = [];

    for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];

        // Report overall progress
        if (onProgress) {
            onProgress({
                current: i + 1,
                total: fileArray.length,
                percentage: ((i + 1) / fileArray.length) * 100,
                currentFile: file.name
            });
        }

        const result = await uploadFile(file, folder);
        results.push(result);
    }

    return results;
};

/**
 * Delete a file from storage
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<Object>} Delete result
 */
export const deleteFile = async (filePath) => {
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        if (import.meta.env.DEV) console.error('File delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get file URL from storage path
 * @param {string} filePath - Path to file in storage
 * @returns {string} Public URL
 */
export const getFileUrl = (filePath) => {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {boolean} Is valid
 */
export const validateFileType = (file, allowedTypes) => {
    return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} Is valid
 */
export const validateFileSize = (file, maxSizeMB) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on type
 * @param {string} fileType - MIME type
 * @returns {string} Icon name
 */
export const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'music';
    if (fileType === 'application/pdf') return 'file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'file-excel';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'file-powerpoint';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'file-archive';
    return 'file';
};

const fileService = {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getFileUrl,
    validateFileType,
    validateFileSize,
    formatFileSize,
    getFileIcon
};

export default fileService;
