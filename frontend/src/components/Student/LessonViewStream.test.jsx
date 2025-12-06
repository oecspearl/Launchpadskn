import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotesPanel from './NotesPanel';
import CheckpointRenderer from './CheckpointRenderer';

describe('NotesPanel', () => {
    it('renders the notes button', () => {
        render(<NotesPanel lessonId="123" />);
        // Check for the icon or button
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('opens the panel when clicked', () => {
        render(<NotesPanel lessonId="123" />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(screen.getByText('My Notes')).toBeInTheDocument();
    });

    it('loads saved notes from localStorage', () => {
        localStorage.setItem('lesson_note_123', 'Saved note content');
        render(<NotesPanel lessonId="123" />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(screen.getByDisplayValue('Saved note content')).toBeInTheDocument();
    });
});

describe('CheckpointRenderer', () => {
    const mockCheckpoint = {
        type: 'QUIZ',
        question: 'Test Question?',
        options: ['A', 'B'],
        correctAnswer: 'A'
    };

    it('renders the question and options', () => {
        render(<CheckpointRenderer checkpoint={mockCheckpoint} />);
        expect(screen.getByText('Test Question?')).toBeInTheDocument();
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('handles correct answer selection', () => {
        render(<CheckpointRenderer checkpoint={mockCheckpoint} />);
        fireEvent.click(screen.getByText('A'));
        fireEvent.click(screen.getByText('Submit Answer'));
        expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('handles incorrect answer selection', () => {
        render(<CheckpointRenderer checkpoint={mockCheckpoint} />);
        fireEvent.click(screen.getByText('B'));
        fireEvent.click(screen.getByText('Submit Answer'));
        expect(screen.getByText(/Incorrect/i)).toBeInTheDocument();
    });
});
