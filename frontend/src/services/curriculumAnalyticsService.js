import { supabase } from '../config/supabase';

const curriculumAnalyticsService = {
  // Get coverage summary for a class subject
  async getCoverageSummary(classSubjectId) {
    try {
      const { data, error } = await supabase.rpc('get_coverage_summary', {
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching coverage summary:', error);
      throw error;
    }
  },

  // Get detailed coverage tracking
  async getCurriculumCoverage(classSubjectId) {
    try {
      const { data, error } = await supabase.rpc('get_curriculum_coverage', {
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching curriculum coverage:', error);
      throw error;
    }
  },

  // Get time allocation analysis
  async getTimeAllocationAnalysis(classSubjectId, academicYear = null, term = null) {
    try {
      const { data, error } = await supabase.rpc('get_time_allocation_analysis', {
        class_subject_id_param: classSubjectId,
        academic_year_param: academicYear,
        term_param: term
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching time allocation:', error);
      throw error;
    }
  },

  // Get outcome achievement summary
  async getOutcomeAchievementSummary(classSubjectId) {
    try {
      const { data, error } = await supabase.rpc('get_outcome_achievement_summary', {
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching outcome achievement:', error);
      throw error;
    }
  },

  // Get gap analysis
  async getGapAnalysis(classSubjectId, includeResolved = false) {
    try {
      const { data, error } = await supabase.rpc('get_gap_analysis', {
        class_subject_id_param: classSubjectId,
        include_resolved: includeResolved
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching gap analysis:', error);
      throw error;
    }
  },

  // Update coverage from lessons
  async updateCoverageFromLessons(classSubjectId) {
    try {
      const { error } = await supabase.rpc('update_coverage_from_lessons', {
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating coverage:', error);
      throw error;
    }
  },

  // Calculate time allocation
  async calculateTimeAllocation(classSubjectId, academicYear, term) {
    try {
      const { error } = await supabase.rpc('calculate_time_allocation', {
        class_subject_id_param: classSubjectId,
        academic_year_param: academicYear,
        term_param: term
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error calculating time allocation:', error);
      throw error;
    }
  },

  // Identify curriculum gaps
  async identifyGaps(classSubjectId) {
    try {
      const { data, error } = await supabase.rpc('identify_curriculum_gaps', {
        class_subject_id_param: classSubjectId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error identifying gaps:', error);
      throw error;
    }
  },

  // Get analytics snapshot
  async getAnalyticsSnapshot(classSubjectId, snapshotDate = null) {
    try {
      let query = supabase
        .from('curriculum_analytics_snapshots')
        .select('*')
        .eq('class_subject_id', classSubjectId)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      if (snapshotDate) {
        query = query.eq('snapshot_date', snapshotDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching analytics snapshot:', error);
      throw error;
    }
  },

  // Create analytics snapshot
  async createSnapshot(classSubjectId) {
    try {
      const coverageSummary = await this.getCoverageSummary(classSubjectId);
      const achievementSummary = await this.getOutcomeAchievementSummary(classSubjectId);
      const timeAllocation = await this.getTimeAllocationAnalysis(classSubjectId);
      const gaps = await this.getGapAnalysis(classSubjectId);

      const snapshotData = {
        class_subject_id: classSubjectId,
        snapshot_date: new Date().toISOString().split('T')[0],
        coverage_percentage: coverageSummary?.overall_coverage_percentage || 0,
        topics_covered: coverageSummary?.covered_topics || 0,
        topics_total: coverageSummary?.total_topics || 0,
        units_covered: coverageSummary?.covered_units || 0,
        units_total: coverageSummary?.total_units || 0,
        scos_covered: coverageSummary?.covered_scos || 0,
        scos_total: coverageSummary?.total_scos || 0,
        planned_hours_total: timeAllocation.reduce((sum, item) => sum + (parseFloat(item.planned_hours) || 0), 0),
        actual_hours_total: timeAllocation.reduce((sum, item) => sum + (parseFloat(item.actual_hours) || 0), 0),
        average_achievement_percentage: achievementSummary.length > 0
          ? achievementSummary.reduce((sum, item) => sum + (parseFloat(item.average_achievement_percentage) || 0), 0) / achievementSummary.length
          : 0,
        gaps_count: gaps.length,
        snapshot_data: {
          coverage: coverageSummary,
          achievement: achievementSummary,
          timeAllocation: timeAllocation,
          gaps: gaps
        }
      };

      const { data, error } = await supabase
        .from('curriculum_analytics_snapshots')
        .upsert(snapshotData, {
          onConflict: 'class_subject_id,snapshot_date'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }
};

export default curriculumAnalyticsService;

