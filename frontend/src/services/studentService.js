import { supabase } from '../config/supabase';

export const studentService = {
    // ============================================
    // ASSESSMENTS & GRADES
    // ============================================

    async getAssessmentsByClassSubject(classSubjectId) {
        const { data, error } = await supabase
            .from('subject_assessments')
            .select('*')
            .eq('class_subject_id', classSubjectId)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createAssessment(assessmentData) {
        const { data, error } = await supabase
            .from('subject_assessments')
            .insert(assessmentData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getGradesByAssessment(assessmentId) {
        const { data, error } = await supabase
            .from('student_grades')
            .select(`
        *,
        student:users(*)
      `)
            .eq('assessment_id', assessmentId);

        if (error) throw error;
        return data;
    },

    // ============================================
    // QUIZ SYSTEM METHODS
    // ============================================

    async createQuiz(quizData) {
        const { data, error } = await supabase
            .from('quizzes')
            .insert(quizData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getQuizByContentId(contentId) {
        const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('content_id', contentId)
            .eq('is_published', true)
            .single();

        if (quizError) {
            if (quizError.code === 'PGRST116') return null;
            throw quizError;
        }
        if (!quizData) return null;

        const { data: questions, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizData.quiz_id)
            .order('question_order', { ascending: true });

        if (questionsError) throw questionsError;

        if (questions && questions.length > 0) {
            const questionIds = questions.map(q => q.question_id).filter(id => id != null);

            let allOptions = [];
            let allCorrectAnswers = [];

            if (questionIds.length > 0) {
                const { data: optionsData, error: optionsError } = await supabase
                    .from('quiz_answer_options')
                    .select('*')
                    .in('question_id', questionIds)
                    .order('option_order', { ascending: true });

                if (optionsError) throw optionsError;
                allOptions = optionsData || [];

                const { data: answersData, error: answersError } = await supabase
                    .from('quiz_correct_answers')
                    .select('*')
                    .in('question_id', questionIds);

                if (answersError) throw answersError;
                allCorrectAnswers = answersData || [];
            }

            const questionsWithData = questions.map(question => ({
                ...question,
                options: allOptions.filter(opt => opt.question_id === question.question_id),
                correct_answers: allCorrectAnswers.filter(ans => ans.question_id === question.question_id)
            }));

            return {
                ...quizData,
                questions: questionsWithData
            };
        }

        return {
            ...quizData,
            questions: []
        };
    },

    async getQuizById(quizId) {
        const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('quiz_id', quizId)
            .single();

        if (quizError) throw quizError;
        if (!quizData) return null;

        const { data: questions, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('question_order', { ascending: true });

        if (questionsError) throw questionsError;

        if (questions && questions.length > 0) {
            const questionIds = questions.map(q => q.question_id).filter(id => id != null);

            let allOptions = [];
            let allCorrectAnswers = [];

            if (questionIds.length > 0) {
                const { data: optionsData, error: optionsError } = await supabase
                    .from('quiz_answer_options')
                    .select('*')
                    .in('question_id', questionIds)
                    .order('option_order', { ascending: true });

                if (optionsError) throw optionsError;
                allOptions = optionsData || [];

                const { data: answersData, error: answersError } = await supabase
                    .from('quiz_correct_answers')
                    .select('*')
                    .in('question_id', questionIds);

                if (answersError) throw answersError;
                allCorrectAnswers = answersData || [];
            }

            const questionsWithData = questions.map(question => ({
                ...question,
                options: allOptions.filter(opt => opt.question_id === question.question_id),
                correct_answers: allCorrectAnswers.filter(ans => ans.question_id === question.question_id)
            }));

            return {
                ...quizData,
                questions: questionsWithData
            };
        }

        return {
            ...quizData,
            questions: []
        };
    },

    async updateQuiz(quizId, quizData) {
        const { data, error } = await supabase
            .from('quizzes')
            .update(quizData)
            .eq('quiz_id', quizId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteQuiz(quizId) {
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('quiz_id', quizId);

        if (error) throw error;
    },

    async createQuizQuestion(questionData) {
        const { data, error } = await supabase
            .from('quiz_questions')
            .insert(questionData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateQuizQuestion(questionId, questionData) {
        const { data, error } = await supabase
            .from('quiz_questions')
            .update(questionData)
            .eq('question_id', questionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteQuizQuestion(questionId) {
        const { error } = await supabase
            .from('quiz_questions')
            .delete()
            .eq('question_id', questionId);

        if (error) throw error;
    },

    async createAnswerOption(optionData) {
        const { data, error } = await supabase
            .from('quiz_answer_options')
            .insert(optionData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateAnswerOption(optionId, optionData) {
        const { data, error } = await supabase
            .from('quiz_answer_options')
            .update(optionData)
            .eq('option_id', optionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteAnswerOption(optionId) {
        const { error } = await supabase
            .from('quiz_answer_options')
            .delete()
            .eq('option_id', optionId);

        if (error) throw error;
    },

    async createCorrectAnswer(answerData) {
        const { data, error } = await supabase
            .from('quiz_correct_answers')
            .insert(answerData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCorrectAnswersForQuestion(questionId) {
        const { error } = await supabase
            .from('quiz_correct_answers')
            .delete()
            .eq('question_id', questionId);

        if (error) throw error;
    },

    async createQuizAttempt(attemptData) {
        const { data, error } = await supabase
            .from('student_quiz_attempts')
            .insert(attemptData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async submitQuizAttempt(attemptId, responses) {
        if (responses && responses.length > 0) {
            const { error: responsesError } = await supabase
                .from('student_quiz_responses')
                .insert(responses);

            if (responsesError) throw responsesError;
        }

        const { data: attempt } = await supabase
            .from('student_quiz_attempts')
            .select(`
        *,
        quiz:quizzes(*),
        responses:student_quiz_responses(
          *,
          question:quiz_questions(*)
        )
      `)
            .eq('attempt_id', attemptId)
            .single();

        if (!attempt) throw new Error('Attempt not found');

        let totalPoints = 0;
        let earnedPoints = 0;
        const responsesToUpdate = [];

        for (const response of attempt.responses || []) {
            const question = response.question;
            if (!question) continue;

            totalPoints += parseFloat(question.points || 0);

            if (question.question_type === 'MULTIPLE_CHOICE' || question.question_type === 'TRUE_FALSE') {
                const { data: option } = await supabase
                    .from('quiz_answer_options')
                    .select('is_correct, points')
                    .eq('option_id', response.selected_option_id)
                    .single();

                if (option && option.is_correct) {
                    const points = parseFloat(option.points || question.points || 0);
                    earnedPoints += points;
                    responsesToUpdate.push({
                        response_id: response.response_id,
                        points_earned: points,
                        is_correct: true,
                        is_graded: true
                    });
                } else {
                    responsesToUpdate.push({
                        response_id: response.response_id,
                        points_earned: 0,
                        is_correct: false,
                        is_graded: true
                    });
                }
            } else if (question.question_type === 'SHORT_ANSWER' || question.question_type === 'FILL_BLANK') {
                const { data: correctAnswers } = await supabase
                    .from('quiz_correct_answers')
                    .select('*')
                    .eq('question_id', question.question_id);

                let isCorrect = false;
                if (correctAnswers && correctAnswers.length > 0 && response.response_text) {
                    const studentAnswer = response.response_text.trim();
                    for (const correctAnswer of correctAnswers) {
                        let correctText = correctAnswer.correct_answer.trim();
                        if (!correctAnswer.case_sensitive) {
                            correctText = correctText.toLowerCase();
                            const studentText = studentAnswer.toLowerCase();
                            if (studentText === correctText ||
                                (correctAnswer.accept_partial && studentText.includes(correctText))) {
                                isCorrect = true;
                                break;
                            }
                        } else {
                            if (studentAnswer === correctText ||
                                (correctAnswer.accept_partial && studentAnswer.includes(correctText))) {
                                isCorrect = true;
                                break;
                            }
                        }
                    }
                }

                if (isCorrect) {
                    earnedPoints += parseFloat(question.points || 0);
                    responsesToUpdate.push({
                        response_id: response.response_id,
                        points_earned: question.points || 0,
                        is_correct: true,
                        is_graded: true
                    });
                } else {
                    responsesToUpdate.push({
                        response_id: response.response_id,
                        points_earned: 0,
                        is_correct: false,
                        is_graded: true
                    });
                }
            } else if (question.question_type === 'ESSAY') {
                responsesToUpdate.push({
                    response_id: response.response_id,
                    points_earned: 0,
                    is_correct: false,
                    is_graded: false
                });
            }
        }

        for (const update of responsesToUpdate) {
            const { error: updateError } = await supabase
                .from('student_quiz_responses')
                .update({
                    points_earned: update.points_earned,
                    is_correct: update.is_correct,
                    is_graded: update.is_graded
                })
                .eq('response_id', update.response_id);

            if (updateError) throw updateError;
        }

        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const isPassed = attempt.quiz.passing_score ? percentage >= attempt.quiz.passing_score : null;
        const needsGrading = (attempt.responses || []).some(r =>
            r.question.question_type === 'ESSAY' && !r.is_graded
        );

        const { error: updateError } = await supabase
            .from('student_quiz_attempts')
            .update({
                submitted_at: new Date().toISOString(),
                total_points_earned: earnedPoints,
                percentage_score: percentage,
                is_passed: isPassed,
                is_graded: !needsGrading
            })
            .eq('attempt_id', attemptId);

        if (updateError) throw updateError;

        const { data: updatedAttempt, error: fetchError } = await supabase
            .from('student_quiz_attempts')
            .select(`
        *,
        quiz:quizzes(*),
        responses:student_quiz_responses(
          *,
          question:quiz_questions(
            *,
            options:quiz_answer_options(*),
            correct_answers:quiz_correct_answers(*)
          )
        )
      `)
            .eq('attempt_id', attemptId)
            .single();

        if (fetchError) throw fetchError;
        return updatedAttempt;
    },

    async getStudentQuizAttempts(quizId, studentId = null) {
        let query = supabase
            .from('student_quiz_attempts')
            .select(`
        *,
        student:users!student_quiz_attempts_student_id_fkey(user_id, name, email),
        responses:student_quiz_responses(
          *,
          question:quiz_questions(*),
          option:quiz_answer_options(*)
        )
      `)
            .eq('quiz_id', quizId)
            .order('submitted_at', { ascending: false });

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    async getQuizResults(quizId) {
        const { data, error } = await supabase
            .from('student_quiz_attempts')
            .select(`
        *,
        student:users!student_quiz_attempts_student_id_fkey(user_id, name, email)
      `)
            .eq('quiz_id', quizId)
            .not('submitted_at', 'is', null)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async enterGrades(assessmentId, grades) {
        const records = grades.map(grade => ({
            assessment_id: assessmentId,
            student_id: grade.student_id,
            marks_obtained: grade.marks_obtained,
            percentage: grade.percentage,
            grade_letter: grade.grade_letter,
            comments: grade.comments || null
        }));

        const { data, error } = await supabase
            .from('student_grades')
            .upsert(records, {
                onConflict: 'assessment_id,student_id'
            })
            .select();

        if (error) throw error;
        return data;
    },

    async getStudentGrades(studentId, academicYear = null) {
        // Handle UUID vs numeric ID
        let numericStudentId = studentId;
        if (typeof studentId === 'string' && studentId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', studentId)
                .maybeSingle();
            if (userProfile && userProfile.user_id) {
                numericStudentId = userProfile.user_id;
            } else {
                return [];
            }
        }

        const { data: classAssignment } = await supabase
            .from('student_class_assignments')
            .select('class_id')
            .eq('student_id', numericStudentId)
            .eq('is_active', true)
            .maybeSingle();

        if (!classAssignment) return [];

        const { data: classSubjects } = await supabase
            .from('class_subjects')
            .select('class_subject_id')
            .eq('class_id', classAssignment.class_id);

        if (!classSubjects || classSubjects.length === 0) return [];

        const classSubjectIds = classSubjects.map(cs => cs.class_subject_id);

        const { data, error } = await supabase
            .from('student_grades')
            .select(`
        *,
        assessment:subject_assessments(
          *,
          class_subject:class_subjects(
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            )
          )
        )
      `)
            .eq('student_id', numericStudentId)
            .in('assessment.class_subject_id', classSubjectIds);

        if (error) throw error;
        return data || [];
    }
};
