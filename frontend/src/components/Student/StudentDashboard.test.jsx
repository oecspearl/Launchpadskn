import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentDashboard from './StudentDashboard';
import { studentGoalService } from '../../services/studentGoalService';
import { recommendationService } from '../../services/recommendationService';
import { BrowserRouter } from 'react-router-dom';

// Mock services
vi.mock('../../services/studentGoalService');
vi.mock('../../services/recommendationService');
vi.mock('../../services/interactiveContentService', () => ({
    interactiveContentService: {
        getStudentGamification: vi.fn().mockResolvedValue({
            level: 5,
            current_xp: 450,
            next_level_xp: 1000,
            streak_days: 3,
            points: 1200
        }),
        getStudentBadges: vi.fn().mockResolvedValue([]),
        getLeaderboard: vi.fn().mockResolvedValue([])
    }
}));

// Mock Auth
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'student-123', name: 'Test Student', role: 'student' }
    })
}));

describe('StudentDashboard', () => {
    it('renders the dashboard with all tabs', () => {
        render(
            <BrowserRouter>
                <StudentDashboard />
            </BrowserRouter>
        );

        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('My Classes')).toBeInTheDocument();
        expect(screen.getByText('Assignments')).toBeInTheDocument();
        expect(screen.getByText('Gamification')).toBeInTheDocument();
    });

    it('loads and displays personalized recommendations', async () => {
        const mockRecs = [
            { id: 1, type: 'review', title: 'Test Rec', reason: 'Test Reason', priority: 'high', action: 'Go' }
        ];
        recommendationService.getRecommendations.mockResolvedValue(mockRecs);

        render(
            <BrowserRouter>
                <StudentDashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Rec')).toBeInTheDocument();
        });
    });

    it('loads and displays student goals', async () => {
        const mockGoals = [
            { id: 1, title: 'Test Goal', type: 'daily', progress: 0, target: 5, completed: false }
        ];
        studentGoalService.getGoals.mockResolvedValue(mockGoals);

        render(
            <BrowserRouter>
                <StudentDashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Goal')).toBeInTheDocument();
        });
    });
});
