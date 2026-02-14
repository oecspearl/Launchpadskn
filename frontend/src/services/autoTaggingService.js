/**
 * Auto-tagging service that uses AI to automatically suggest tags
 * for content based on title, description, and other metadata
 */

const autoTaggingService = {
  /**
   * Generate tags based on content metadata
   * Uses keyword extraction and pattern matching
   */
  async generateTags(contentData) {
    try {
      const tags = new Set();

      // Extract from title
      if (contentData.title) {
        const titleTags = this.extractTagsFromText(contentData.title);
        titleTags.forEach(tag => tags.add(tag));
      }

      // Extract from description
      if (contentData.description) {
        const descTags = this.extractTagsFromText(contentData.description);
        descTags.forEach(tag => tags.add(tag));
      }

      // Extract from learning objectives
      if (contentData.learning_objectives) {
        const objTags = this.extractTagsFromText(contentData.learning_objectives);
        objTags.forEach(tag => tags.add(tag));
      }

      // Extract from key concepts
      if (contentData.key_concepts) {
        const conceptTags = this.extractTagsFromText(contentData.key_concepts);
        conceptTags.forEach(tag => tags.add(tag));
      }

      // Add content type as tag
      if (contentData.content_type) {
        tags.add(contentData.content_type.toLowerCase().replace('_', '-'));
      }

      // Add subject as tag
      if (contentData.subject_id) {
        // We'll need to fetch subject name, but for now use ID
        tags.add(`subject-${contentData.subject_id}`);
      }

      // Add form/grade level as tag
      if (contentData.form_id) {
        tags.add(`form-${contentData.form_id}`);
      }

      // Add topic as tag if available
      if (contentData.topic) {
        const topicTags = this.extractTagsFromText(contentData.topic);
        topicTags.forEach(tag => tags.add(tag));
      }

      // Add content section as tag
      if (contentData.content_section) {
        tags.add(contentData.content_section.toLowerCase().replace(/\s+/g, '-'));
      }

      // Suggest tags based on content type patterns
      const typeBasedTags = this.getTagsByContentType(contentData);
      typeBasedTags.forEach(tag => tags.add(tag));

      // Suggest tags based on URL patterns
      if (contentData.url) {
        const urlTags = this.extractTagsFromUrl(contentData.url);
        urlTags.forEach(tag => tags.add(tag));
      }

      // Limit to top 10 most relevant tags
      return Array.from(tags).slice(0, 10);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating tags:', error);
      return [];
    }
  },

  /**
   * Extract meaningful tags from text
   */
  extractTagsFromText(text) {
    if (!text) return [];

    const tags = new Set();
    const lowerText = text.toLowerCase();

    // Common educational keywords
    const educationalKeywords = [
      'quiz', 'test', 'exam', 'assignment', 'homework', 'project',
      'lesson', 'lecture', 'tutorial', 'workshop', 'seminar',
      'practice', 'exercise', 'activity', 'lab', 'experiment',
      'reading', 'writing', 'speaking', 'listening',
      'comprehension', 'vocabulary', 'grammar', 'pronunciation',
      'mathematics', 'algebra', 'geometry', 'calculus', 'statistics',
      'science', 'biology', 'chemistry', 'physics', 'astronomy',
      'history', 'geography', 'social studies', 'civics',
      'art', 'music', 'drama', 'theater', 'dance',
      'physical education', 'health', 'sports',
      'technology', 'computer science', 'programming', 'coding',
      'interactive', 'multimedia', 'video', 'audio', 'animation',
      'beginner', 'intermediate', 'advanced', 'expert',
      'review', 'summary', 'introduction', 'conclusion',
      'assessment', 'evaluation', 'rubric', 'criteria'
    ];

    // Check for educational keywords
    educationalKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        tags.add(keyword.replace(/\s+/g, '-'));
      }
    });

    // Extract capitalized words (likely proper nouns or important terms)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g);
    if (capitalizedWords) {
      capitalizedWords.forEach(word => {
        if (word.length > 3) { // Filter out short words
          tags.add(word.toLowerCase());
        }
      });
    }

    // Extract quoted terms (often important concepts)
    const quotedTerms = text.match(/"([^"]+)"/g);
    if (quotedTerms) {
      quotedTerms.forEach(term => {
        const cleanTerm = term.replace(/"/g, '').toLowerCase().replace(/\s+/g, '-');
        if (cleanTerm.length > 2) {
          tags.add(cleanTerm);
        }
      });
    }

    // Extract words in parentheses (often abbreviations or clarifications)
    const parentheticalTerms = text.match(/\(([^)]+)\)/g);
    if (parentheticalTerms) {
      parentheticalTerms.forEach(term => {
        const cleanTerm = term.replace(/[()]/g, '').toLowerCase().replace(/\s+/g, '-');
        if (cleanTerm.length > 2 && cleanTerm.length < 20) {
          tags.add(cleanTerm);
        }
      });
    }

    return Array.from(tags);
  },

  /**
   * Get tags based on content type
   */
  getTagsByContentType(contentData) {
    const tags = [];
    const contentType = contentData.content_type?.toUpperCase();

    switch (contentType) {
      case 'VIDEO':
      case 'INTERACTIVE_VIDEO':
        tags.push('video', 'multimedia', 'visual-learning');
        if (contentData.url) {
          if (contentData.url.includes('youtube') || contentData.url.includes('youtu.be')) {
            tags.push('youtube');
          }
          if (contentData.url.includes('vimeo')) {
            tags.push('vimeo');
          }
        }
        break;
      case '3D_MODEL':
      case 'AR_OVERLAY':
        tags.push('3d', 'interactive', 'visualization', 'ar', 'vr');
        break;
      case 'IMAGE':
        tags.push('image', 'visual', 'illustration');
        break;
      case 'DOCUMENT':
      case 'PDF':
        tags.push('document', 'reading', 'text');
        break;
      case 'QUIZ':
      case 'ASSESSMENT':
        tags.push('assessment', 'quiz', 'evaluation');
        break;
      case 'INTERACTIVE_BOOK':
        tags.push('interactive', 'book', 'reading');
        break;
      case 'FLASHCARD':
        tags.push('flashcard', 'memorization', 'study');
        break;
      default:
        break;
    }

    return tags;
  },

  /**
   * Extract tags from URL patterns
   */
  extractTagsFromUrl(url) {
    const tags = [];
    if (!url) return tags;

    const lowerUrl = url.toLowerCase();

    // Domain-based tags
    if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) {
      tags.push('youtube', 'video');
    }
    if (lowerUrl.includes('vimeo')) {
      tags.push('vimeo', 'video');
    }
    if (lowerUrl.includes('khan')) {
      tags.push('khan-academy');
    }
    if (lowerUrl.includes('edx')) {
      tags.push('edx', 'mooc');
    }
    if (lowerUrl.includes('coursera')) {
      tags.push('coursera', 'mooc');
    }
    if (lowerUrl.includes('ted')) {
      tags.push('ted', 'talks');
    }

    // File extension tags
    if (lowerUrl.endsWith('.pdf')) {
      tags.push('pdf', 'document');
    }
    if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx')) {
      tags.push('word', 'document');
    }
    if (lowerUrl.endsWith('.ppt') || lowerUrl.endsWith('.pptx')) {
      tags.push('powerpoint', 'presentation');
    }
    if (lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx')) {
      tags.push('excel', 'spreadsheet');
    }

    return tags;
  },

  /**
   * Enhance tags with AI-like suggestions based on context
   * This could be extended to call an actual AI API
   */
  async enhanceTagsWithAI(tags, contentData) {
    // For now, this is a placeholder for future AI integration
    // Could integrate with OpenAI, Google Cloud AI, or other services
    
    // Add related tags based on common patterns
    const enhancedTags = new Set(tags);

    // If "quiz" is present, add related tags
    if (tags.some(t => t.includes('quiz'))) {
      enhancedTags.add('assessment');
      enhancedTags.add('evaluation');
    }

    // If "video" is present, add related tags
    if (tags.some(t => t.includes('video'))) {
      enhancedTags.add('multimedia');
      enhancedTags.add('visual-learning');
    }

    // If "interactive" is present, add related tags
    if (tags.some(t => t.includes('interactive'))) {
      enhancedTags.add('engagement');
      enhancedTags.add('active-learning');
    }

    return Array.from(enhancedTags);
  },

  /**
   * Get suggested tags for content sharing
   * Main entry point for auto-tagging
   */
  async getSuggestedTags(contentData) {
    try {
      // Generate base tags
      let tags = await this.generateTags(contentData);

      // Enhance with AI-like suggestions
      tags = await this.enhanceTagsWithAI(tags, contentData);

      // Remove duplicates and normalize
      const normalizedTags = tags
        .map(tag => tag.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'))
        .filter(tag => tag.length > 2 && tag.length < 30)
        .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates

      return normalizedTags.slice(0, 10); // Limit to 10 tags
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting suggested tags:', error);
      return [];
    }
  },

  /**
   * Get popular tags from existing content
   * Useful for suggesting common tags
   */
  async getPopularTags(limit = 20) {
    try {
      // This would query the database for most common tags
      // For now, return common educational tags
      return [
        'interactive', 'video', 'quiz', 'assessment', 'practice',
        'beginner', 'intermediate', 'advanced', 'review', 'homework',
        'multimedia', 'visual-learning', 'reading', 'writing',
        'mathematics', 'science', 'history', 'language', 'art'
      ].slice(0, limit);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting popular tags:', error);
      return [];
    }
  }
};

export default autoTaggingService;

