import { supabase } from '../config/supabase';
import { classService } from './classService';
import { studentService } from './studentService';
import studentInformationService from './studentInformationService';

export const parentService = {
    /**
     * Get all children linked to this parent
     */
    async getLinkedChildren(parentUserId) {
        if (!parentUserId) return [];

        const { data, error } = await supabase
            .from('parent_student_links')
            .select(`
                *,
                student:users!parent_student_links_student_id_fkey(
                    id, first_name, last_name, email, phone, profile_image_url, is_active
                )
            `)
            .eq('parent_id', parentUserId);

        if (error) throw error;
        return data || [];
    },

    /**
     * Get child's class assignment with form/tutor info
     */
    async getChildClassAssignment(studentUserId) {
        return classService.getStudentClassAssignment(studentUserId);
    },

    /**
     * Get child's subjects
     */
    async getChildSubjects(classId) {
        return classService.getSubjectsByClass(classId);
    },

    /**
     * Get child's grades
     */
    async getChildGrades(studentUserId) {
        return studentService.getStudentGrades(studentUserId);
    },

    /**
     * Get child's attendance records
     */
    async getChildAttendance(studentUserId, startDate, endDate) {
        return classService.getStudentAttendance(studentUserId, startDate, endDate);
    },

    /**
     * Get child's lessons/timetable
     */
    async getChildLessons(studentUserId, startDate, endDate) {
        return classService.getLessonsByStudent(studentUserId, startDate, endDate);
    },

    /**
     * Get child's disciplinary records
     */
    async getChildDisciplinaryRecords(studentUserId, academicYear) {
        return studentInformationService.getStudentDisciplinaryRecords(studentUserId, academicYear);
    },

    /**
     * Get child's disciplinary summary
     */
    async getChildDisciplinarySummary(studentUserId) {
        return studentInformationService.getDisciplinarySummary(studentUserId);
    },

    // ---- Admin methods for managing parent-student links ----

    /**
     * Link a parent to a student
     */
    async linkParentToStudent(parentUserId, studentUserId, relationship, isPrimary, linkedBy) {
        const { data, error } = await supabase
            .from('parent_student_links')
            .insert({
                parent_id: parentUserId,
                student_id: studentUserId,
                relationship: relationship || 'PARENT',
                is_primary: isPrimary || false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Unlink a parent from a student (soft delete)
     */
    async unlinkParentFromStudent(linkId) {
        const { data, error } = await supabase
            .from('parent_student_links')
            .delete()
            .eq('id', linkId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get all parents linked to a student
     */
    async getParentsByStudent(studentUserId) {
        const { data, error } = await supabase
            .from('parent_student_links')
            .select(`
                *,
                parent:users!parent_student_links_parent_id_fkey(
                    id, first_name, last_name, email, phone
                )
            `)
            .eq('student_id', studentUserId);

        if (error) throw error;
        return data || [];
    }
};
