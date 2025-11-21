/**
 * Content Type Definitions
 * Defines TypeScript interfaces for all interactive content types
 */

// Base content type enum
export type ContentType = 
  | 'FILE' 
  | 'LINK' 
  | 'VIDEO' 
  | 'DOCUMENT' 
  | 'IMAGE'
  | 'QUIZ'
  | 'ASSIGNMENT'
  | 'FLASHCARD'
  | 'INTERACTIVE_VIDEO'
  | 'IMAGE_HOTSPOT'
  | 'DRAG_DROP'
  | 'FILL_BLANKS'
  | 'MEMORY_GAME'
  | 'INTERACTIVE_BOOK'
  | 'VIDEO_FINDER'
  | 'PRESENTATION'
  | 'LEARNING_OUTCOMES'
  | 'KEY_CONCEPTS'
  | 'LEARNING_ACTIVITIES'
  | 'REFLECTION_QUESTIONS'
  | 'DISCUSSION_PROMPTS'
  | 'SUMMARY';

/**
 * Flashcard Content Data Structure
 */
export interface FlashcardData {
  cards: Flashcard[];
  settings: FlashcardSettings;
}

export interface Flashcard {
  id: string; // UUID for the card
  front: string; // Front side text (question, term, etc.)
  back: string; // Back side text (answer, definition, etc.)
  frontImage?: string; // Optional image URL for front
  backImage?: string; // Optional image URL for back
  tags?: string[]; // Optional tags for categorization
  difficulty?: 'easy' | 'medium' | 'hard'; // Optional difficulty level
  order: number; // Display order
}

export interface FlashcardSettings {
  showAnswer: 'click' | 'hover' | 'auto'; // How to reveal answer
  shuffleCards: boolean; // Shuffle order when studying
  studyMode: 'sequential' | 'random' | 'difficulty'; // Study mode
  showProgress: boolean; // Show progress indicator
  allowMarking: boolean; // Allow students to mark cards as known/unknown
  autoAdvance: boolean; // Auto-advance to next card after viewing answer
  autoAdvanceDelay: number; // Delay in seconds before auto-advance
}

/**
 * Default flashcard settings
 */
export const defaultFlashcardSettings: FlashcardSettings = {
  showAnswer: 'click',
  shuffleCards: false,
  studyMode: 'sequential',
  showProgress: true,
  allowMarking: true,
  autoAdvance: false,
  autoAdvanceDelay: 3
};

/**
 * Helper function to create empty flashcard data
 */
export function createEmptyFlashcardData(): FlashcardData {
  return {
    cards: [],
    settings: { ...defaultFlashcardSettings }
  };
}

