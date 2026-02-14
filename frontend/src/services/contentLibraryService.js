import { supabase } from '../config/supabase';

const contentLibraryService = {
  // ============================================
  // GET CONTENT FROM LIBRARY
  // ============================================

  async getLibraryContent(filters = {}) {
    try {
      let query = supabase
        .from('content_library')
        .select(`
          *,
          shared_by_user:users!content_library_shared_by_fkey(
            user_id,
            name,
            email
          ),
          subject:subjects(
            subject_id,
            subject_name
          ),
          form:forms(
            form_id,
            form_name
          )
        `)
        .eq('status', 'ACTIVE');

      // Apply filters
      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType);
      }

      if (filters.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }

      if (filters.formId) {
        query = query.eq('form_id', filters.formId);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic);
      }

      if (filters.isFeatured) {
        query = query.eq('is_featured', true);
      }

      if (filters.minRating) {
        query = query.gte('rating_average', filters.minRating);
      }

      // Sorting
      const sortBy = filters.sortBy || 'use_count';
      const sortOrder = filters.sortOrder || 'desc';
      
      if (sortBy === 'rating') {
        query = query.order('rating_average', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'popular') {
        query = query.order('use_count', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('use_count', { ascending: sortOrder === 'asc' });
      }

      // Pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      // Increment view count for each item
      if (data && data.length > 0) {
        data.forEach(item => {
          this.incrementViewCount(item.library_id).catch(e => { if (import.meta.env.DEV) console.error(e); });
        });
      }

      return data || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching library content:', error);
      throw error;
    }
  },

  async getLibraryContentById(libraryId) {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select(`
          *,
          shared_by_user:users!content_library_shared_by_fkey(
            user_id,
            name,
            email
          ),
          subject:subjects(
            subject_id,
            subject_name
          ),
          form:forms(
            form_id,
            form_name
          ),
          ratings:content_library_ratings(
            *,
            user:users(
              user_id,
              name
            )
          )
        `)
        .eq('library_id', libraryId)
        .single();

      if (error) throw error;

      // Increment view count
      if (data) {
        this.incrementViewCount(libraryId).catch(e => { if (import.meta.env.DEV) console.error(e); });
      }

      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching library content by ID:', error);
      throw error;
    }
  },

  async incrementViewCount(libraryId) {
    try {
      const { error } = await supabase.rpc('increment_library_view_count', {
        library_id_param: libraryId
      });
      if (error) throw error;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error incrementing view count:', error);
      // Don't throw - this is not critical
    }
  },

  // ============================================
  // SHARE CONTENT TO LIBRARY
  // ============================================

  async shareContentToLibrary(contentData) {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .insert({
          ...contentData,
          shared_by: contentData.shared_by,
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error sharing content to library:', error);
      throw error;
    }
  },

  // ============================================
  // ADD LIBRARY CONTENT TO LESSON
  // ============================================

  async addLibraryContentToLesson(libraryId, lessonId, userId) {
    try {
      // Get library content
      const libraryContent = await this.getLibraryContentById(libraryId);

      if (!libraryContent) {
        throw new Error('Library content not found');
      }

      // Create lesson_content from library content
      const lessonContentData = {
        lesson_id: lessonId,
        content_type: libraryContent.content_type,
        title: libraryContent.title,
        description: libraryContent.description,
        url: libraryContent.url,
        file_path: libraryContent.file_path,
        file_name: libraryContent.file_name,
        file_size: libraryContent.file_size,
        mime_type: libraryContent.mime_type,
        instructions: libraryContent.instructions,
        learning_outcomes: libraryContent.learning_outcomes,
        learning_activities: libraryContent.learning_activities,
        key_concepts: libraryContent.key_concepts,
        reflection_questions: libraryContent.reflection_questions,
        discussion_prompts: libraryContent.discussion_prompts,
        summary: libraryContent.summary,
        content_section: libraryContent.content_section,
        is_required: libraryContent.is_required,
        estimated_minutes: libraryContent.estimated_minutes,
        content_data: libraryContent.content_data,
        metadata: libraryContent.metadata,
        assignment_details_file_path: libraryContent.assignment_details_file_path,
        assignment_details_file_name: libraryContent.assignment_details_file_name,
        assignment_details_file_size: libraryContent.assignment_details_file_size,
        assignment_details_mime_type: libraryContent.assignment_details_mime_type,
        assignment_rubric_file_path: libraryContent.assignment_rubric_file_path,
        assignment_rubric_file_name: libraryContent.assignment_rubric_file_name,
        assignment_rubric_file_size: libraryContent.assignment_rubric_file_size,
        assignment_rubric_mime_type: libraryContent.assignment_rubric_mime_type,
        uploaded_by: userId,
        is_published: true,
        published_at: new Date().toISOString()
      };

      // Insert lesson content
      const { data: lessonContent, error: contentError } = await supabase
        .from('lesson_content')
        .insert(lessonContentData)
        .select()
        .single();

      if (contentError) throw contentError;

      // Record usage
      const { error: usageError } = await supabase
        .from('content_library_usage')
        .insert({
          library_id: libraryId,
          lesson_id: lessonId,
          content_id: lessonContent.content_id,
          used_by: userId
        });

      if (usageError) throw usageError;

      return lessonContent;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error adding library content to lesson:', error);
      throw error;
    }
  },

  // ============================================
  // RATINGS AND REVIEWS
  // ============================================

  async rateContent(libraryId, userId, rating, review = null) {
    try {
      const { data, error } = await supabase
        .from('content_library_ratings')
        .upsert({
          library_id: libraryId,
          user_id: userId,
          rating: rating,
          review: review,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'library_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error rating content:', error);
      throw error;
    }
  },

  async getRatings(libraryId) {
    try {
      const { data, error } = await supabase
        .from('content_library_ratings')
        .select(`
          *,
          user:users(
            user_id,
            name,
            email
          )
        `)
        .eq('library_id', libraryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching ratings:', error);
      throw error;
    }
  },

  // ============================================
  // FAVORITES
  // ============================================

  async addToFavorites(libraryId, userId) {
    try {
      const { data, error } = await supabase
        .from('content_library_favorites')
        .insert({
          library_id: libraryId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  async removeFromFavorites(libraryId, userId) {
    try {
      const { error } = await supabase
        .from('content_library_favorites')
        .delete()
        .eq('library_id', libraryId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  async getFavorites(userId) {
    try {
      const { data, error } = await supabase
        .from('content_library_favorites')
        .select(`
          *,
          library_content:content_library(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  async isFavorite(libraryId, userId) {
    try {
      const { data, error } = await supabase
        .from('content_library_favorites')
        .select('favorite_id')
        .eq('library_id', libraryId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error checking favorite:', error);
      return false;
    }
  },

  // ============================================
  // STATISTICS
  // ============================================

  async getLibraryStats() {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('content_type, use_count, rating_average')
        .eq('status', 'ACTIVE');

      if (error) throw error;

      const stats = {
        total: data.length,
        byType: {},
        totalUses: 0,
        averageRating: 0
      };

      let totalRating = 0;
      let ratingCount = 0;

      data.forEach(item => {
        // Count by type
        stats.byType[item.content_type] = (stats.byType[item.content_type] || 0) + 1;
        
        // Sum uses
        stats.totalUses += item.use_count || 0;
        
        // Calculate average rating
        if (item.rating_average && item.rating_count) {
          totalRating += item.rating_average * item.rating_count;
          ratingCount += item.rating_count;
        }
      });

      stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      return stats;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching library stats:', error);
      throw error;
    }
  }
};

export default contentLibraryService;

