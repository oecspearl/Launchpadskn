import { supabase } from '../config/supabase';

const studentInformationService = {
  // ============================================
  // Student Profiles
  // ============================================
  
  async getStudentProfile(studentId) {
    try {
      const { data, error } = await supabase.rpc('get_student_profile', {
        student_id_param: studentId
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  },

  async upsertStudentProfile(studentId, profileData) {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .upsert({
          student_id: studentId,
          ...profileData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting student profile:', error);
      throw error;
    }
  },

  // ============================================
  // Student Lifecycle
  // ============================================
  
  async getStudentLifecycle(studentId) {
    try {
      const { data, error } = await supabase.rpc('get_student_lifecycle', {
        student_id_param: studentId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student lifecycle:', error);
      throw error;
    }
  },

  async createLifecycleEvent(eventData) {
    try {
      const { data, error } = await supabase.rpc('create_lifecycle_event', {
        student_id_param: eventData.student_id,
        event_type_param: eventData.event_type,
        event_date_param: eventData.event_date,
        academic_year_param: eventData.academic_year || null,
        term_param: eventData.term || null,
        from_school_id_param: eventData.from_school_id || null,
        to_school_id_param: eventData.to_school_id || null,
        from_class_id_param: eventData.from_class_id || null,
        to_class_id_param: eventData.to_class_id || null,
        from_grade_param: eventData.from_grade || null,
        to_grade_param: eventData.to_grade || null,
        status_param: eventData.status || null,
        reason_param: eventData.reason || null,
        notes_param: eventData.notes || null,
        created_by_param: eventData.created_by || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lifecycle event:', error);
      throw error;
    }
  },

  // ============================================
  // Student Transfers
  // ============================================
  
  async getStudentTransfers(studentId, transferType = null) {
    try {
      const { data, error } = await supabase.rpc('get_student_transfers', {
        student_id_param: studentId,
        transfer_type_param: transferType
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student transfers:', error);
      throw error;
    }
  },

  async createTransfer(transferData) {
    try {
      const { data, error } = await supabase
        .from('student_transfers')
        .insert(transferData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  },

  async updateTransfer(transferId, updateData) {
    try {
      const { data, error } = await supabase
        .from('student_transfers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('transfer_id', transferId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transfer:', error);
      throw error;
    }
  },

  // ============================================
  // Special Needs
  // ============================================
  
  async getStudentSpecialNeeds(studentId, activeOnly = true) {
    try {
      const { data, error } = await supabase.rpc('get_student_special_needs', {
        student_id_param: studentId,
        active_only: activeOnly
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching special needs:', error);
      throw error;
    }
  },

  async createSpecialNeed(needData) {
    try {
      const { data, error } = await supabase
        .from('student_special_needs')
        .insert(needData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating special need:', error);
      throw error;
    }
  },

  async updateSpecialNeed(needId, updateData) {
    try {
      const { data, error } = await supabase
        .from('student_special_needs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('need_id', needId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating special need:', error);
      throw error;
    }
  },

  // ============================================
  // Accommodations
  // ============================================
  
  async getStudentAccommodations(studentId, activeOnly = true) {
    try {
      const { data, error } = await supabase.rpc('get_student_accommodations', {
        student_id_param: studentId,
        active_only: activeOnly
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      throw error;
    }
  },

  async createAccommodation(accommodationData) {
    try {
      const { data, error } = await supabase
        .from('student_accommodations')
        .insert(accommodationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating accommodation:', error);
      throw error;
    }
  },

  async updateAccommodation(accommodationId, updateData) {
    try {
      const { data, error } = await supabase
        .from('student_accommodations')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('accommodation_id', accommodationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating accommodation:', error);
      throw error;
    }
  },

  // ============================================
  // Disciplinary Records
  // ============================================
  
  async getStudentDisciplinaryRecords(studentId, academicYear = null, resolvedOnly = false) {
    try {
      const { data, error } = await supabase.rpc('get_student_disciplinary_records', {
        student_id_param: studentId,
        academic_year_param: academicYear,
        resolved_only: resolvedOnly
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching disciplinary records:', error);
      throw error;
    }
  },

  async getDisciplinarySummary(studentId, academicYear = null) {
    try {
      const { data, error } = await supabase.rpc('get_student_disciplinary_summary', {
        student_id_param: studentId,
        academic_year_param: academicYear
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching disciplinary summary:', error);
      throw error;
    }
  },

  async createDisciplinaryIncident(incidentData) {
    try {
      const { data, error } = await supabase
        .from('disciplinary_incidents')
        .insert(incidentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating disciplinary incident:', error);
      throw error;
    }
  },

  async updateDisciplinaryIncident(incidentId, updateData) {
    try {
      const { data, error } = await supabase
        .from('disciplinary_incidents')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('incident_id', incidentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating disciplinary incident:', error);
      throw error;
    }
  }
};

export default studentInformationService;

