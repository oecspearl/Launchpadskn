import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGamepad } from 'react-icons/fa';
import { supabase } from '../../config/supabase';
import StreamHeader from './StreamComponents/StreamHeader';
import HeroCard from './StreamComponents/HeroCard';
import QuestGrid from './StreamComponents/QuestGrid';
import ArchiveList from './StreamComponents/ArchiveList';
import './LessonsStream.css';

function LessonsStream({ lessons = [], classSubjectId, loading = false }) {
  const navigate = useNavigate();
  const [heroLesson, setHeroLesson] = useState(null);
  const [quests, setQuests] = useState([]);
  const [archives, setArchives] = useState([]);

  // Process lessons into Hero, Quests (Upcoming), and Archives (Past)
  useEffect(() => {
    if (!lessons || lessons.length === 0) return;

    const now = new Date();
    const sortedLessons = [...lessons].sort((a, b) => new Date(a.lesson_date) - new Date(b.lesson_date));

    // Find the "Hero" lesson:
    // 1. First lesson that is happening NOW (or within 1 hour)
    // 2. OR the very next upcoming lesson
    // 3. OR if no upcoming, the most recent past lesson

    let hero = null;
    let upcoming = [];
    let past = [];

    // Split into past and upcoming
    sortedLessons.forEach(lesson => {
      const lessonDate = new Date(lesson.lesson_date);
      // Set end of day for comparison to include today's lessons as upcoming if not passed time
      const endOfLessonDay = new Date(lessonDate);
      endOfLessonDay.setHours(23, 59, 59, 999);

      if (endOfLessonDay < now) {
        past.push(lesson);
      } else {
        upcoming.push(lesson);
      }
    });

    // Determine Hero
    if (upcoming.length > 0) {
      hero = upcoming[0]; // The immediate next lesson
      upcoming = upcoming.slice(1); // Remove hero from quests
    } else if (past.length > 0) {
      hero = past[past.length - 1]; // Most recent past lesson
      past = past.slice(0, past.length - 1); // Remove hero from archives
    }

    setHeroLesson(hero);
    setQuests(upcoming);
    setArchives(past.reverse()); // Show most recent past lessons first
  }, [lessons]);

  // Helper to generate deterministic gradient based on string
  const getGradient = (str) => {
    const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 40%))`;
  };

  // Helper to calculate "XP" (Duration in mins)
  const calculateXP = (start, end) => {
    if (!start || !end) return 50;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    return Math.max(duration, 10); // Min 10 XP
  };

  const formatTime = (time) => time ? time.substring(0, 5) : '';
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Explorer';
    if (hour < 18) return 'Good Afternoon, Explorer';
    return 'Good Evening, Explorer';
  };

  if (loading) {
    return (
      <div className="lessons-stream-container">
        <div className="skeleton-hero" />
        <div className="skeleton-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="lessons-stream-container">
        <StreamHeader greeting={getGreeting()} />
        <div className="hero-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-center">
            <FaGamepad style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'white' }}>No Missions Available</h3>
            <p style={{ color: '#94a3b8' }}>Check back later for new quests!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lessons-stream-container">
      <StreamHeader greeting={getGreeting()} />

      <HeroCard
        heroLesson={heroLesson}
        getGradient={getGradient}
        formatDate={formatDate}
        formatTime={formatTime}
      />

      <QuestGrid
        quests={quests}
        getGradient={getGradient}
        formatDate={formatDate}
        formatTime={formatTime}
        calculateXP={calculateXP}
        navigate={navigate}
      />

      <ArchiveList
        archives={archives}
        formatDate={formatDate}
        calculateXP={calculateXP}
        navigate={navigate}
      />
    </div>
  );
}

export default LessonsStream;
