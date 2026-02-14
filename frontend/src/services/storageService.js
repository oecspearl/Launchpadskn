import { supabase } from '../config/supabase';

export const storageService = {
    /**
     * List files in a Supabase Storage bucket/folder
     */
    async listFiles(bucket, folderPath = '') {
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(folderPath, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) throw error;

            // Get public URLs for each file
            const filesWithUrls = await Promise.all(
                (data || []).map(async (file) => {
                    const { data: urlData } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(`${folderPath}/${file.name}`);

                    return {
                        name: file.name,
                        size: file.metadata?.size || 0,
                        createdAt: file.created_at,
                        updatedAt: file.updated_at,
                        url: urlData.publicUrl,
                        publicUrl: urlData.publicUrl
                    };
                })
            );

            return filesWithUrls;
        } catch (error) {
            if (import.meta.env.DEV) console.error('[storageService] Error listing files:', error);
            return [];
        }
    },

    /**
     * Upload file to Supabase Storage
     */
    async uploadFile(bucket, filePath, file) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;
        return data;
    },

    /**
     * Get public URL for file
     */
    getPublicUrl(bucket, filePath) {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * Delete file from storage
     */
    async deleteFile(bucket, filePath) {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) throw error;
    }
};
