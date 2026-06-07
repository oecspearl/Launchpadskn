import { supabase } from '../config/supabase';

export const institutionService = {
    // ============================================
    // HELPERS
    // ============================================

    /**
     * Helper function to convert snake_case to camelCase
     */
    toCamelCase(str) {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    },

    /**
     * Helper function to transform institution object from snake_case to camelCase
     */
    transformInstitution(institution) {
        if (!institution) return null;
        return {
            ...institution,
            // institutions PK is `id` (uuid); expose it as institutionId for legacy callers
            institutionId: institution.id || institution.institutionId,
            createdAt: institution.created_at || institution.createdAt,
            // institutions schema uses `type` (not institution_type) and `principal_name`
            institutionType: institution.type || institution.institutionType,
            type: institution.type ?? institution.institutionType ?? null,
            island: institution.island ?? null,
            logoUrl: institution.logo_url || institution.logoUrl || null,
            principal: institution.principal_name || institution.principal || null
        };
    },

    /**
     * Helper function to transform institution data for database (camelCase to snake_case)
     */
    transformInstitutionForDB(institutionData) {
        const transformed = { ...institutionData };

        // establishedYear has no column in the institutions schema – drop it
        if (transformed.establishedYear !== undefined) {
            delete transformed.establishedYear;
        }

        // institutions PK is `id`; don't include the legacy institutionId in updates/inserts
        if (transformed.institutionId !== undefined) {
            delete transformed.institutionId;
        }

        // Valid DB values for the institution `type` column
        const VALID_DB_TYPES = ['SECONDARY_SCHOOL', 'PRIMARY_SCHOOL', 'TERTIARY_INSTITUTION', 'MINISTRY_OF_EDUCATION', 'OTHER'];

        const normalizeType = (val) => {
            const upper = (val || '').trim().toUpperCase().replace(/\s+/g, '_');
            if (VALID_DB_TYPES.includes(upper)) return upper;
            // Map legacy values
            if (upper.includes('SECONDARY') || upper === 'SCHOOL') return 'SECONDARY_SCHOOL';
            if (upper.includes('PRIMARY')) return 'PRIMARY_SCHOOL';
            if (upper.includes('UNIV') || upper.includes('COLL') || upper.includes('TERTIARY')) return 'TERTIARY_INSTITUTION';
            if (upper.includes('MINISTRY')) return 'MINISTRY_OF_EDUCATION';
            if (upper.includes('INSTIT')) return 'OTHER';
            return 'SECONDARY_SCHOOL';
        };

        // Handle institutionType (camelCase) -> `type` (DB column)
        if (transformed.institutionType !== undefined) {
            transformed.type = normalizeType(transformed.institutionType);
            delete transformed.institutionType;
        }

        // Normalize existing `type` if present
        if (transformed.type) {
            transformed.type = normalizeType(transformed.type);
        }

        // Handle logoUrl -> logo_url
        if (transformed.logoUrl !== undefined) {
            transformed.logo_url = transformed.logoUrl;
            delete transformed.logoUrl;
        }

        // Handle principal -> principal_name (DB column)
        if (transformed.principal !== undefined) {
            transformed.principal_name = transformed.principal;
            delete transformed.principal;
        }

        // canAddStudents has no column in the institutions schema – drop it
        if (transformed.canAddStudents !== undefined) {
            delete transformed.canAddStudents;
        }

        // Remove any stray fields that should not be sent
        delete transformed.institutionId;
        delete transformed.institutionType;

        return transformed;
    },

    // ============================================
    // INSTITUTIONS
    // ============================================

    async getAllInstitutions() {
        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .order('name');

        if (error) throw error;
        // Transform data to camelCase
        return (data || []).map(inst => this.transformInstitution(inst));
    },

    async getInstitutionById(id) {
        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return this.transformInstitution(data);
    },

    async createInstitution(institutionData) {
        // Transform camelCase to snake_case for database
        const dbData = this.transformInstitutionForDB(institutionData);
        const { data, error } = await supabase
            .from('institutions')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;
        return this.transformInstitution(data);
    },

    async updateInstitution(id, updates) {
        // Transform camelCase to snake_case for database
        const dbUpdates = this.transformInstitutionForDB(updates);
        const { data, error } = await supabase
            .from('institutions')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.transformInstitution(data);
    },

    async deleteInstitution(id) {
        const { error } = await supabase
            .from('institutions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ============================================
    // DEPARTMENTS
    // ============================================

    async getAllDepartments() {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },

    async getDepartmentsByInstitution(institutionId) {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('institution_id', institutionId)
            .order('name');

        if (error) throw error;
        return data;
    },

    async createDepartment(departmentData) {
        const { data, error } = await supabase
            .from('departments')
            .insert(departmentData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ============================================
    // FORMS (Caribbean School Structure)
    // ============================================

    async getAllForms(schoolId) {
        const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('institution_id', schoolId)
            .eq('is_active', true)
            .order('level');

        if (error) throw error;
        return data;
    },

    async getFormsBySchool(schoolId) {
        let query = supabase
            .from('forms')
            .select('*, coordinator:users!forms_coordinator_id_fkey(first_name, last_name, email), school:institutions!forms_institution_id_fkey(id, name)')
            .eq('is_active', true)
            .order('institution_id', { ascending: true })
            .order('level', { ascending: true });

        // Only filter by institution_id if it's provided
        if (schoolId !== null && schoolId !== undefined) {
            query = query.eq('institution_id', schoolId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    async getFormById(formId) {
        const { data, error } = await supabase
            .from('forms')
            .select('*, coordinator:users!forms_coordinator_id_fkey(*)')
            .eq('id', formId)
            .single();

        if (error) throw error;
        return data;
    },

    async createForm(formData) {
        const { data, error } = await supabase
            .from('forms')
            .insert(formData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateForm(formId, updates) {
        const { data, error } = await supabase
            .from('forms')
            .update({ ...updates })
            .eq('id', formId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteForm(formId) {
        const { data, error } = await supabase
            .from('forms')
            .update({ is_active: false })
            .eq('id', formId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getFormsByInstitution(institutionId) {
        return this.getAllForms(institutionId);
    },

    // ============================================
    // SUBJECTS
    // ============================================

    async getAllSubjects(_schoolId) {
        // NOTE: the subjects table has no school_id/institution scoping column,
        // so the schoolId argument can no longer filter the query.
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data;
    },

    async getSubjectsBySchool(_schoolId) {
        // NOTE: subjects has no school_id column, so the schoolId filter is dropped.
        // subjects.department_id has no FK constraint, so departments cannot be
        // embedded (PostgREST 400). department_id is currently unused/null.
        const query = supabase
            .from('subjects')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    async getSubjectById(subjectId) {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', subjectId)
            .single();

        if (error) throw error;
        return data;
    },

    async createSubject(subjectData) {
        const { data, error } = await supabase
            .from('subjects')
            .insert(subjectData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateSubject(subjectId, updates) {
        const { data, error } = await supabase
            .from('subjects')
            .update({ ...updates })
            .eq('id', subjectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteSubject(subjectId) {
        const { error } = await supabase
            .from('subjects')
            .update({ is_active: false })
            .eq('id', subjectId);

        if (error) throw error;
    },

    async getSubjectsByInstitution(_institutionId) {
        // NOTE: subjects has no school_id/institution column; institution filter dropped.
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    // ============================================
    // CURRICULUM MANAGEMENT
    // ============================================

    async getCurriculumContent(schoolId = null, formId = null, subjectId = null) {
        // If filtering by school, first get forms for that school
        let formIds = null;
        if (schoolId) {
            const { data: forms } = await supabase
                .from('forms')
                .select('id')
                .eq('institution_id', schoolId)
                .eq('is_active', true);

            if (forms && forms.length > 0) {
                formIds = forms.map(f => f.id);
            } else {
                return [];
            }
        }

        let query = supabase
            .from('subject_form_offerings')
            .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
            .eq('is_active', true);

        if (formIds) {
            query = query.in('form_id', formIds);
        } else if (formId) {
            query = query.eq('form_id', formId);
        }

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        query = query.order('form_id', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    async getCurriculumBySubject(subjectId) {
        const { data, error } = await supabase
            .from('subject_form_offerings')
            .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
            .eq('subject_id', subjectId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getCurriculumByForm(formId) {
        const { data, error } = await supabase
            .from('subject_form_offerings')
            .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
            .eq('form_id', formId)
            .eq('is_active', true)
            .order('subject_name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getCurriculumOfferingById(offeringId) {
        const { data, error } = await supabase
            .from('subject_form_offerings')
            .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
            .eq('offering_id', offeringId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateCurriculumOffering(offeringId, curriculumData) {
        const updateData = {
            curriculum_framework: curriculumData.curriculum_framework,
            learning_outcomes: curriculumData.learning_outcomes,
            weekly_periods: curriculumData.weekly_periods,
            is_compulsory: curriculumData.is_compulsory,
            updated_at: new Date().toISOString()
        };

        if (curriculumData.curriculum_structure !== undefined) {
            updateData.curriculum_structure = curriculumData.curriculum_structure;
        }
        if (curriculumData.curriculum_version) {
            updateData.curriculum_version = curriculumData.curriculum_version;
        }
        if (curriculumData.curriculum_updated_at) {
            updateData.curriculum_updated_at = curriculumData.curriculum_updated_at;
        }

        const { data, error } = await supabase
            .from('subject_form_offerings')
            .update(updateData)
            .eq('offering_id', offeringId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getSubjectsByForm(formId) {
        const { data, error } = await supabase
            .from('subject_form_offerings')
            .select(`
        *,
        subject:subjects(*)
      `)
            .eq('form_id', formId);

        if (error) throw error;
        return data;
    },

    async createSubjectOffering(subjectId, formId, offeringData = {}) {
        const { data, error } = await supabase
            .from('subject_form_offerings')
            .insert({
                subject_id: subjectId,
                form_id: formId,
                ...offeringData
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteSubjectOffering(offeringId) {
        const { error } = await supabase
            .from('subject_form_offerings')
            .delete()
            .eq('offering_id', offeringId);

        if (error) throw error;
    }
};
