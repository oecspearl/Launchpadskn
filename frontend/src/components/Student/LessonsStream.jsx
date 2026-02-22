import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBookOpen } from 'react-icons/fa';
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

  // Process lessons into Hero, Upcoming, and Past
  useEffect(() => {
    if (!lessons || lessons.length === 0) return;

    const now = new Date();
    const sortedLessons = [...lessons].sort((a, b) => new Date(a.lesson_date) - new Date(b.lesson_date));

    let hero = null;
    let upcoming = [];
    let past = [];

    sortedLessons.forEach(lesson => {
      const lessonDate = new Date(lesson.lesson_date);
      const endOfLessonDay = new Date(lessonDate);
      endOfLessonDay.setHours(23, 59, 59, 999);

      if (endOfLessonDay < now) {
        past.push(lesson);
      } else {
        upcoming.push(lesson);
      }
    });

    if (upcoming.length > 0) {
      hero = upcoming[0];
      upcoming = upcoming.slice(1);
    } else if (past.length > 0) {
      hero = past[past.length - 1];
      past = past.slice(0, past.length - 1);
    }

    setHeroLesson(hero);
    setQuests(upcoming);
    setArchives(past.reverse());
  }, [lessons]);

  const getGradient = (str) => {
    const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 40%))`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 50;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    return Math.max(duration, 10);
  };

  const formatTime = (time) => time ? time.substring(0, 5) : '';
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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
            <FaBookOpen style={{ fontSize: '4rem', color: 'var(--ls-text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--ls-text)' }}>No Lessons Available</h3>
            <p style={{ color: 'var(--ls-text-muted)' }}>Check back later for new lessons.</p>
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
        calculateXP={calculateDuration}
      />

      <ArchiveList
        archives={archives}
        formatDate={formatDate}
        calculateXP={calculateDuration}
      />
    </div>
  );
}

export default LessonsStream;
