import { supabase } from '../config/supabase';

const interactiveContentService = {
  // ============================================
  // Adaptive Learning Paths
  // ============================================
  
  async getStudentLearningPath(studentId, classSubjectId = null) {
    try {
      const { data, error } = await supabase.rpc('get_student_learning_path', {
        student_id_param: studentId,
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching learning path:', error);
      throw error;
    }
  },

  async getLearningPathStages(pathId) {
    try {
      const { data, error } = await supabase.rpc('get_learning_path_stages', {
        path_id_param: pathId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching path stages:', error);
      throw error;
    }
  },

  async updatePathProgress(pathId, stageId, score, performance = null) {
    try {
      const { data, error } = await supabase.rpc('update_learning_path_progress', {
        path_id_param: pathId,
        stage_id_param: stageId,
        score_param: score,
        performance_param: performance
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating path progress:', error);
      throw error;
    }
  },

  async createLearningPath(pathData) {
    try {
      const { data, error } = await supabase
        .from('adaptive_learning_paths')
        .insert(pathData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating learning path:', error);
      throw error;
    }
  },

  // ============================================
  // Gamification
  // ============================================
  
  async getStudentGamification(studentId, classSubjectId = null) {
    try {
      const { data, error } = await supabase.rpc('get_student_gamification', {
        student_id_param: studentId,
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching gamification:', error);
      throw error;
    }
  },

  async awardPoints(studentId, classSubjectId, points, transactionType, sourceType = null, sourceId = null, description = null) {
    try {
      const { data, error } = await supabase.rpc('award_points', {
        student_id_param: studentId,
        class_subject_id_param: classSubjectId,
        points_param: points,
        transaction_type_param: transactionType,
        source_type_param: sourceType,
        source_id_param: sourceId,
        description_param: description
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  },

  async getLeaderboard(leaderboardId, limit = 100) {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        leaderboard_id_param: leaderboardId,
        limit_param: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  async getStudentBadges(studentId, classSubjectId = null) {
    try {
      const { data, error } = await supabase.rpc('get_student_badges', {
        student_id_param: studentId,
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
  },

  async checkAndAwardBadge(studentId, classSubjectId, badgeId) {
    try {
      const { data, error } = await supabase
        .from('student_badges')
        .insert({
          student_id: studentId,
          badge_id: badgeId,
          class_subject_id: classSubjectId,
          earned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // Badge might already be earned
        if (error.code === '23505') {
          return null; // Already earned
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  },

  // ============================================
  // Social Learning - Forums
  // ============================================
  
  async getForumTopics(forumId, limit = 50) {
    try {
      const { data, error } = await supabase.rpc('get_forum_topics', {
        forum_id_param: forumId,
        limit_param: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forum topics:', error);
      throw error;
    }
  },

  async getForumPosts(topicId, limit = 100) {
    try {
      const { data, error } = await supabase.rpc('get_forum_posts', {
        topic_id_param: topicId,
        limit_param: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      throw error;
    }
  },

  async createForumTopic(topicData) {
    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .insert(topicData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating forum topic:', error);
      throw error;
    }
  },

  async createForumPost(postData) {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw error;
    }
  },

  // ============================================
  // Peer Review
  // ============================================
  
  async getPeerReviews(reviewAssignmentId) {
    try {
      const { data, error } = await supabase
        .from('peer_reviews')
        .select('*')
        .eq('review_assignment_id', reviewAssignmentId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching peer reviews:', error);
      throw error;
    }
  },

  async createPeerReview(reviewData) {
    try {
      const { data, error } = await supabase
        .from('peer_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating peer review:', error);
      throw error;
    }
  },

  // ============================================
  // Virtual Labs
  // ============================================
  
  async getVirtualLabs(subjectId = null, labType = null) {
    try {
      const { data, error } = await supabase.rpc('get_virtual_labs', {
        subject_id_param: subjectId,
        lab_type_param: labType
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching virtual labs:', error);
      throw error;
    }
  },

  async createLabSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('lab_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lab session:', error);
      throw error;
    }
  },

  async updateLabSession(sessionId, updateData) {
    try {
      const { data, error } = await supabase
        .from('lab_sessions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lab session:', error);
      throw error;
    }
  },

  // ============================================
  // AR/VR Content
  // ============================================
  
  async getARVRContent(subjectId = null, contentType = null, classSubjectId = null) {
    try {
      const { data, error } = await supabase.rpc('get_arvr_content', {
        subject_id_param: subjectId,
        content_type_param: contentType,
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AR/VR content:', error);
      throw error;
    }
  },

  async createARVRSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('arvr_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating AR/VR session:', error);
      throw error;
    }
  },

  async updateARVRSession(sessionId, updateData) {
    try {
      const { data, error } = await supabase
        .from('arvr_sessions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating AR/VR session:', error);
      throw error;
    }
  }
};

export default interactiveContentService;

