// Service for fetching personalized recommendations
// Currently mocks an AI recommendation engine

export const recommendationService = {
    // Get recommendations based on student performance
    getRecommendations: async (studentId) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // In a real app, this would call an endpoint that analyzes student data
        // For now, we return mock data that looks realistic
        return [
            {
                id: 1,
                type: 'review',
                title: 'Review: Photosynthesis Light Reactions',
                reason: 'You missed 2 questions on this topic in the last quiz.',
                priority: 'high',
                action: 'Review Lesson',
                link: '/student/lesson/123'
            },
            {
                id: 2,
                type: 'practice',
                title: 'Practice: Quadratic Equations',
                reason: 'Strengthen your skills before the upcoming exam.',
                priority: 'medium',
                action: 'Start Practice',
                link: '/student/practice/math-quad'
            },
            {
                id: 3,
                type: 'challenge',
                title: 'Challenge: Advanced History Essay',
                reason: 'You are doing great in History! Try this advanced topic.',
                priority: 'low',
                action: 'View Challenge',
                link: '/student/assignment/456'
            }
        ];
    },

    // Dismiss a recommendation
    dismissRecommendation: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (import.meta.env.DEV) console.log(`Dismissed recommendation ${id}`);
        return true;
    }
};
