// Service for managing student goals
// Currently uses localStorage for persistence, mimicking a backend API

const STORAGE_KEY = 'student_goals';

export const studentGoalService = {
    // Get all goals for a student
    getGoals: async (studentId) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const storedGoals = localStorage.getItem(STORAGE_KEY);
        if (!storedGoals) {
            // Return default mock goals if nothing stored
            return [
                {
                    id: 1,
                    title: 'Complete 5 Biology Modules',
                    type: 'daily', // daily, weekly, term
                    progress: 3,
                    target: 5,
                    deadline: '2023-11-15',
                    completed: false
                },
                {
                    id: 2,
                    title: 'Maintain 90% Average in Math',
                    type: 'term',
                    progress: 88,
                    target: 90,
                    deadline: '2023-12-20',
                    completed: false
                }
            ];
        }
        return JSON.parse(storedGoals);
    },

    // Add a new goal
    addGoal: async (goal) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const goals = await studentGoalService.getGoals();
        const newGoal = {
            ...goal,
            id: Date.now(),
            progress: 0,
            completed: false
        };

        const updatedGoals = [...goals, newGoal];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
        return newGoal;
    },

    // Update a goal (progress, completion)
    updateGoal: async (goalId, updates) => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const goals = await studentGoalService.getGoals();
        const updatedGoals = goals.map(g =>
            g.id === goalId ? { ...g, ...updates } : g
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
        return updatedGoals.find(g => g.id === goalId);
    },

    // Delete a goal
    deleteGoal: async (goalId) => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const goals = await studentGoalService.getGoals();
        const updatedGoals = goals.filter(g => g.id !== goalId);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
        return true;
    }
};
