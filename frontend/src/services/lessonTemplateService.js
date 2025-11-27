import { supabase } from '../config/supabase';

const lessonTemplateService = {
  // ============================================
  // GET TEMPLATES
  // ============================================

  async getTemplates(filters = {}) {
    try {
      let query = supabase
        .from('lesson_templates')
        .select(`
          *,
          created_by_user:users!lesson_templates_created_by_fkey(
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
      if (filters.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }

      if (filters.formId) {
        query = query.eq('form_id', filters.formId);
      }

      if (filters.search) {
        query = query.or(`template_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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
          this.incrementViewCount(item.template_id).catch(console.error);
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  async getTemplateById(templateId) {
    try {
      const { data, error } = await supabase
        .from('lesson_templates')
        .select(`
          *,
          created_by_user:users!lesson_templates_created_by_fkey(
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
          content:lesson_template_content(
            *
          ),
          ratings:lesson_template_ratings(
            *,
            user:users(
              user_id,
              name
            )
          )
        `)
        .eq('template_id', templateId)
        .single();

      if (error) throw error;

      // Sort content by sequence_order
      if (data && data.content) {
        data.content = data.content.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
      }

      // Increment view count
      if (data) {
        this.incrementViewCount(templateId).catch(console.error);
      }

      return data;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      throw error;
    }
  },

  async incrementViewCount(templateId) {
    try {
      const { error } = await supabase.rpc('increment_template_view_count', {
        template_id_param: templateId
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw - this is not critical
    }
  },

  // ============================================
  // SAVE LESSON AS TEMPLATE
  // ============================================

  async saveLessonAsTemplate(lessonId, templateData) {
    try {
      // Get lesson data
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          class_subject:class_subjects(
            subject_offering:subject_form_offerings(
              subject:subjects(subject_id),
              form:forms(form_id)
            )
          )
        `)
        .eq('lesson_id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      // Get lesson content
      const { data: lessonContent, error: contentError } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sequence_order', { ascending: true });

      if (contentError) throw contentError;

      const subjectId = lesson?.class_subject?.subject_offering?.subject?.subject_id;
      const formId = lesson?.class_subject?.subject_offering?.form?.form_id;

      // Create template
      const templatePayload = {
        template_name: templateData.template_name || lesson.lesson_title || 'Untitled Template',
        description: templateData.description || '',
        subject_id: subjectId,
        form_id: formId,
        topic: lesson.topic || templateData.topic || '',
        lesson_title: lesson.lesson_title,
        learning_objectives: lesson.learning_objectives,
        lesson_plan: lesson.lesson_plan,
        homework_description: lesson.homework_description,
        estimated_duration: templateData.estimated_duration || null,
        created_by: templateData.created_by,
        is_public: templateData.is_public !== undefined ? templateData.is_public : true,
        tags: templateData.tags || [],
        published_at: new Date().toISOString()
      };

      const { data: template, error: templateError } = await supabase
        .from('lesson_templates')
        .insert(templatePayload)
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template content items
      if (lessonContent && lessonContent.length > 0) {
        const templateContentItems = lessonContent.map((content, index) => ({
          template_id: template.template_id,
          content_type: content.content_type,
          title: content.title,
          description: content.description,
          url: content.url,
          original_content_id: content.content_id,
          instructions: content.instructions,
          learning_outcomes: content.learning_outcomes,
          learning_activities: content.learning_activities,
          key_concepts: content.key_concepts,
          reflection_questions: content.reflection_questions,
          discussion_prompts: content.discussion_prompts,
          summary: content.summary,
          content_section: content.content_section,
          is_required: content.is_required,
          estimated_minutes: content.estimated_minutes,
          sequence_order: content.sequence_order || index + 1,
          content_data: content.content_data,
          metadata: content.metadata
        }));

        const { error: contentInsertError } = await supabase
          .from('lesson_template_content')
          .insert(templateContentItems);

        if (contentInsertError) throw contentInsertError;
      }

      return template;
    } catch (error) {
      console.error('Error saving lesson as template:', error);
      throw error;
    }
  },

  // ============================================
  // CREATE LESSON FROM TEMPLATE
  // ============================================

  async createLessonFromTemplate(templateId, classSubjectId, lessonData = {}) {
    try {
      // Get template with content
      const template = await this.getTemplateById(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Create lesson from template
      const lessonPayload = {
        class_subject_id: classSubjectId,
        lesson_title: lessonData.lesson_title || template.lesson_title || template.template_name,
        lesson_date: lessonData.lesson_date || new Date().toISOString().split('T')[0],
        start_time: lessonData.start_time || '08:00:00',
        end_time: lessonData.end_time || '08:45:00',
        topic: lessonData.topic || template.topic,
        learning_objectives: template.learning_objectives,
        lesson_plan: template.lesson_plan,
        homework_description: template.homework_description,
        location: lessonData.location || null,
        status: 'SCHEDULED',
        created_by: lessonData.created_by
      };

      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert(lessonPayload)
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Create lesson content from template content
      if (template.content && template.content.length > 0) {
        const lessonContentItems = template.content.map((templateContent) => {
          const contentItem = {
            lesson_id: lesson.lesson_id,
            content_type: templateContent.content_type,
            title: templateContent.title,
            description: templateContent.description,
            url: templateContent.url,
            instructions: templateContent.instructions,
            learning_outcomes: templateContent.learning_outcomes,
            learning_activities: templateContent.learning_activities,
            key_concepts: templateContent.key_concepts,
            reflection_questions: templateContent.reflection_questions,
            discussion_prompts: templateContent.discussion_prompts,
            summary: templateContent.summary,
            content_section: templateContent.content_section,
            is_required: templateContent.is_required,
            estimated_minutes: templateContent.estimated_minutes,
            sequence_order: templateContent.sequence_order,
            content_data: templateContent.content_data,
            metadata: templateContent.metadata,
            uploaded_by: lessonData.created_by,
            is_published: true,
            published_at: new Date().toISOString()
          };

          // If template content references library content, try to copy from library
          if (templateContent.library_content_id) {
            // Note: This would require fetching from content_library and copying
            // For now, we'll just use the template structure
          }

          return contentItem;
        });

        const { error: contentInsertError } = await supabase
          .from('lesson_content')
          .insert(lessonContentItems);

        if (contentInsertError) throw contentInsertError;
      }

      // Record template usage
      const { error: usageError } = await supabase
        .from('lesson_template_usage')
        .insert({
          template_id: templateId,
          lesson_id: lesson.lesson_id,
          used_by: lessonData.created_by
        });

      if (usageError) throw usageError;

      return lesson;
    } catch (error) {
      console.error('Error creating lesson from template:', error);
      throw error;
    }
  },

  // ============================================
  // RATINGS AND REVIEWS
  // ============================================

  async rateTemplate(templateId, userId, rating, review = null) {
    try {
      const { data, error } = await supabase
        .from('lesson_template_ratings')
        .upsert({
          template_id: templateId,
          user_id: userId,
          rating: rating,
          review: review,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'template_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rating template:', error);
      throw error;
    }
  },

  async getRatings(templateId) {
    try {
      const { data, error } = await supabase
        .from('lesson_template_ratings')
        .select(`
          *,
          user:users(
            user_id,
            name,
            email
          )
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }
  },

  // ============================================
  // FAVORITES
  // ============================================

  async addToFavorites(templateId, userId) {
    try {
      const { data, error } = await supabase
        .from('lesson_template_favorites')
        .insert({
          template_id: templateId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  async removeFromFavorites(templateId, userId) {
    try {
      const { error } = await supabase
        .from('lesson_template_favorites')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  async getFavorites(userId) {
    try {
      const { data, error } = await supabase
        .from('lesson_template_favorites')
        .select(`
          *,
          template:lesson_templates(
            *,
            created_by_user:users!lesson_templates_created_by_fkey(
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
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(fav => fav.template).filter(Boolean);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  async isFavorite(templateId, userId) {
    try {
      const { data, error } = await supabase
        .from('lesson_template_favorites')
        .select('favorite_id')
        .eq('template_id', templateId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },

  // ============================================
  // STATISTICS
  // ============================================

  async getTemplateStats() {
    try {
      const { data, error } = await supabase
        .from('lesson_templates')
        .select('use_count, rating_average, content_count')
        .eq('status', 'ACTIVE');

      if (error) throw error;

      const stats = {
        total: data.length,
        totalUses: 0,
        averageRating: 0,
        averageContentCount: 0
      };

      let totalRating = 0;
      let ratingCount = 0;
      let totalContent = 0;

      data.forEach(item => {
        stats.totalUses += item.use_count || 0;
        totalContent += item.content_count || 0;
        
        if (item.rating_average && item.rating_count) {
          totalRating += item.rating_average * item.rating_count;
          ratingCount += item.rating_count;
        }
      });

      stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      stats.averageContentCount = data.length > 0 ? totalContent / data.length : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching template stats:', error);
      throw error;
    }
  }
};

export default lessonTemplateService;

