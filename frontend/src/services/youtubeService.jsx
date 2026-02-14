/**
 * YouTube API Service
 * Handles YouTube video searches using the YouTube Data API v3
 */

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyD6apl0ugvvTRl4_7g02mRuwVuA-vRnmyU';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Search for educational YouTube videos related to a topic
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (topic, subject, etc.)
 * @param {string} params.subject - Subject name (optional, for better results)
 * @param {string} params.form - Form/grade level (optional)
 * @param {number} params.maxResults - Maximum number of results (default: 5)
 * @returns {Promise<Array>} Array of video objects with id, title, description, thumbnail, etc.
 */
export const searchEducationalVideos = async ({
  query,
  subject = '',
  form = '',
  maxResults = 5
}) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured. Please set REACT_APP_YOUTUBE_API_KEY in your .env file.');
  }

  if (!query || !query.trim()) {
    throw new Error('Search query is required');
  }

  // Build search query - prioritize educational content
  let searchQuery = query.trim();

  // Add subject context if available
  if (subject && !searchQuery.toLowerCase().includes(subject.toLowerCase())) {
    searchQuery = `${subject} ${searchQuery}`;
  }

  // Add form/grade level context if available
  if (form) {
    // Only add if not already in query
    if (!searchQuery.toLowerCase().includes(form.toLowerCase())) {
      searchQuery = `${searchQuery} ${form}`;
    }
  }

  // Add educational keywords to improve results (but keep query concise)
  // YouTube API works better with focused queries
  if (searchQuery.length < 50) {
    searchQuery = `${searchQuery} educational tutorial`;
  }

  try {
    if (import.meta.env.DEV) console.log('[YouTube Service] Searching for videos:', searchQuery);

    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      videoCategoryId: '27', // Education category
      maxResults: maxResults.toString(),
      order: 'relevance',
      safeSearch: 'strict',
      key: YOUTUBE_API_KEY
    });

    const response = await fetch(`${YOUTUBE_API_URL}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (import.meta.env.DEV) console.error('[YouTube Service] API error:', errorData);
      throw new Error(errorData.error?.message || `YouTube API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      if (import.meta.env.DEV) console.warn('[YouTube Service] No videos found for query:', searchQuery);
      return [];
    }

    // Format video data
    const videos = data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
    }));

    if (import.meta.env.DEV) console.log('[YouTube Service] Found', videos.length, 'videos');
    return videos;
  } catch (error) {
    if (import.meta.env.DEV) console.error('[YouTube Service] Error searching videos:', error);
    throw error;
  }
};

/**
 * Get video details by video ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video details
 */
export const getVideoDetails = async (videoId) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: YOUTUBE_API_KEY
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `YouTube API request failed`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || '',
      channelTitle: item.snippet.channelTitle,
      duration: item.contentDetails.duration,
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      embedUrl: `https://www.youtube.com/embed/${item.id}`
    };
  } catch (error) {
    if (import.meta.env.DEV) console.error('[YouTube Service] Error getting video details:', error);
    throw error;
  }
};

/**
 * Search for the best educational video for a lesson topic
 * @param {Object} params - Search parameters
 * @param {string} params.topic - Lesson topic
 * @param {string} params.subject - Subject name
 * @param {string} params.form - Form/grade level
 * @returns {Promise<Object|null>} Best matching video or null
 */
export const findBestVideoForLesson = async ({ topic, subject, form }) => {
  try {
    const videos = await searchEducationalVideos({
      query: topic,
      subject,
      form,
      maxResults: 3
    });

    if (videos.length === 0) {
      return null;
    }

    // Return the first (most relevant) video
    return videos[0];
  } catch (error) {
    if (import.meta.env.DEV) console.error('[YouTube Service] Error finding best video:', error);
    return null;
  }
};

export default {
  searchEducationalVideos,
  getVideoDetails,
  findBestVideoForLesson
};

