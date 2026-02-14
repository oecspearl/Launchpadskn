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

/**
 * Interactive Video Content Data Structure
 */
export interface InteractiveVideoData {
  videoUrl: string; // YouTube URL, Vimeo URL, or direct video URL
  videoType: 'youtube' | 'vimeo' | 'direct'; // Video platform type
  checkpoints: VideoCheckpoint[]; // Interactive checkpoints at specific timestamps
  settings: InteractiveVideoSettings; // Playback and interaction settings
}

export interface VideoCheckpoint {
  id: string; // UUID for the checkpoint
  timestamp: number; // Time in seconds where checkpoint appears
  type: 'question' | 'quiz' | 'note' | 'pause' | 'reflection'; // Type of interaction
  title?: string; // Optional title for the checkpoint
  content: string; // Main content (question text, note text, etc.)
  options?: CheckpointOption[]; // For question/quiz types
  correctAnswer?: string | string[]; // For quiz types
  explanation?: string; // Explanation shown after answering
  required: boolean; // Whether student must complete before continuing
  pauseVideo: boolean; // Whether video pauses at this checkpoint
  order: number; // Display order
}

export interface CheckpointOption {
  id: string; // UUID for the option
  text: string; // Option text
  isCorrect?: boolean; // For quiz types
}

export interface InteractiveVideoSettings {
  allowSkip: boolean; // Allow students to skip checkpoints
  showProgress: boolean; // Show progress indicator
  showTimestamps: boolean; // Show timestamps in progress bar
  autoPause: boolean; // Auto-pause at checkpoints
  allowSeeking: boolean; // Allow students to seek/scrub video
  requireCompletion: boolean; // Require all checkpoints to be completed
  showHints: boolean; // Show hints for questions
  allowRetry: boolean; // Allow retrying questions
  maxAttempts?: number; // Maximum attempts per checkpoint (if allowRetry is true)
}

/**
 * Default interactive video settings
 */
export const defaultInteractiveVideoSettings: InteractiveVideoSettings = {
  allowSkip: false,
  showProgress: true,
  showTimestamps: true,
  autoPause: true,
  allowSeeking: true,
  requireCompletion: false,
  showHints: true,
  allowRetry: true,
  maxAttempts: 3
};

/**
 * Helper function to create empty interactive video data
 */
export function createEmptyInteractiveVideoData(): InteractiveVideoData {
  return {
    videoUrl: '',
    videoType: 'youtube',
    checkpoints: [],
    settings: { ...defaultInteractiveVideoSettings }
  };
}

/**
 * Helper function to extract video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Helper function to extract video ID from Vimeo URL
 */
export function extractVimeoVideoId(url: string): string | null {
  const patterns = [
    /(?:vimeo\.com\/)(\d+)/,
    /(?:player\.vimeo\.com\/video\/)(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Helper function to detect video type from URL
 */
export function detectVideoType(url: string): 'youtube' | 'vimeo' | 'direct' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'direct';
}

/**
 * Interactive Book Content Data Structure
 */
export interface InteractiveBookData {
  pages: BookPage[];
  subject?: string;
  gradeLevel?: string;
  settings: InteractiveBookSettings;
}

export interface BookPage {
  id: string; // UUID for the page
  title: string;
  pageType?: 'content' | 'video' | 'quiz' | 'image';
  content: string; // Rich text/HTML (for content pages)
  
  // Page-specific data
  videoData?: VideoPageData;
  quizData?: QuizPageData;
  imageData?: ImagePageData;
  
  audioUrl?: string; // Base64 encoded audio for narration
  
  // Embedded content (two formats for backward compatibility)
  embeddedContentId?: string; // NEW: Reference to h5pContent.id
  embeddedContent?: {        // LEGACY: Snapshot of content data
    type: ContentType;
    data: any; // QuizData | FlashcardData | etc.
  };
}

export interface VideoPageData {
  videoId: string;
  videoUrl: string;
  title: string;
  description?: string;
  instructions?: string;
}

export interface QuizPageData {
  questions: QuizQuestion[];
  settings: QuizSettings;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string | string[]; // For multiple-choice/true-false, or array for fill-blank
  explanation?: string;
}

export interface QuizSettings {
  shuffle: boolean;
  showAnswers: boolean;
  allowRetry: boolean;
  timeLimit?: number; // seconds
}

export interface ImagePageData {
  imageUrl?: string; // Generated or provided image URL
  imageDescription?: string; // Description for AI image generation
  instructions?: string;
}

export interface InteractiveBookSettings {
  showNavigation: boolean;
  showProgress: boolean;
  requireCompletion: boolean; // Must complete embedded activities to proceed
}

/**
 * Default interactive book settings
 */
export const defaultInteractiveBookSettings: InteractiveBookSettings = {
  showNavigation: true,
  showProgress: true,
  requireCompletion: false
};

/**
 * Helper function to create empty interactive book data
 */
export function createEmptyInteractiveBookData(): InteractiveBookData {
  return {
    pages: [],
    settings: { ...defaultInteractiveBookSettings }
  };
}

