'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  BookOpen,
  CheckCircle,
  EyeOff,
} from 'lucide-react';
import { OperunCard, OperunCardHeader, OperunCardTitle, OperunCardBody, OperunInput, OperunButton, OperunAlert } from '@/components/ui';
import { OperunContainer, OperunMain } from '@/components/layout';
import AssignmentList from './components/AssignmentList';
import QuizList from './components/QuizList';
import LiveClassList from './components/LiveClassList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AnnouncementList from './components/AnnouncementList';

/* ─── Types ─────────────────────────────────────────────── */
interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'QUIZ';
  contentUrl: string | null;
  duration: string | null;
  orderIndex: number;
}

interface CourseModule {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface LiveSession {
  id: string;
  title: string;
  startTime: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  published: boolean;
  thumbnail: string | null;
  modules: CourseModule[];
  liveSessions?: LiveSession[];
}

/* ─── Helpers ────────────────────────────────────────────── */
const API = 'http://localhost:4000';

export default function InstructorDashboard() {
  const { token } = useAuth();

  /* Course list */
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  /* Expanded course (to show modules/lessons) */
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  /* Edit course */
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');

  /* Create new course */
  const [isCreating, setIsCreating] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('');

  /* Add module */
  const [addingModuleTo, setAddingModuleTo] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  /* Add lesson */
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null); // moduleId
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'VIDEO' | 'PDF' | 'QUIZ'>('VIDEO');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');

  const [addingSessionTo, setAddingSessionTo] = useState<string | null>(null); // courseId
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionTime, setNewSessionTime] = useState('');

  /* ── Fetch courses ─────────────────────────────────────── */
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await fetch(`${API}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      
      const coursesWithSessions = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (c: any) => {
          const sRes = await fetch(`${API}/live-sessions?courseId=${c.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const sessions = sRes.ok ? await sRes.json() : [];
          return { ...c, liveSessions: sessions };
        })
      );
      
      setCourses(coursesWithSessions);
    } catch (e) {
      setCoursesError(e instanceof Error ? e.message : 'Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  /* ── Toggle publish ────────────────────────────────────── */
  const handleTogglePublish = async (course: Course) => {
    const res = await fetch(`${API}/courses/${course.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ published: !course.published }),
    });
    if (res.ok) {
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, published: !course.published } : c)),
      );
    }
  };

  /* ── Create new course ─────────────────────────────────── */
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseDesc.trim()) return;

    const res = await fetch(`${API}/courses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: newCourseTitle,
        description: newCourseDesc,
        price: parseFloat(newCoursePrice) || 0,
      }),
    });
    
    if (res.ok) {
      const newCourse = await res.json();
      // Backend returns the newly created course, but without modules array which our frontend expects
      setCourses((prev) => [...prev, { ...newCourse, modules: [] }]);
      setIsCreating(false);
      setNewCourseTitle('');
      setNewCourseDesc('');
      setNewCoursePrice('');
    }
  };

  /* ── Delete course ─────────────────────────────────────── */
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    const res = await fetch(`${API}/courses/${courseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      if (expandedCourse === courseId) setExpandedCourse(null);
    }
  };

  /* ── Save course edit ──────────────────────────────────── */
  const handleSaveEdit = async (courseId: string) => {
    const res = await fetch(`${API}/courses/${courseId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        title: editTitle,
        description: editDesc,
        price: parseFloat(editPrice) || 0,
      }),
    });
    if (res.ok) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, title: editTitle, description: editDesc, price: parseFloat(editPrice) || 0 }
            : c,
        ),
      );
      setEditingCourse(null);
    }
  };

  /* ── Add module ────────────────────────────────────────── */
  const handleAddModule = async (courseId: string) => {
    if (!newModuleTitle.trim()) return;
    const course = courses.find((c) => c.id === courseId);
    const orderIndex = (course?.modules.length ?? 0) + 1;

    const res = await fetch(`${API}/courses/${courseId}/modules`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title: newModuleTitle, orderIndex }),
    });
    if (res.ok) {
      const newMod: CourseModule = await res.json();
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, modules: [...c.modules, { ...newMod, lessons: [] }] }
            : c,
        ),
      );
      setNewModuleTitle('');
      setAddingModuleTo(null);
    }
  };

  /* ── Delete module ─────────────────────────────────────── */
  const handleDeleteModule = async (courseId: string, moduleId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    const res = await fetch(`${API}/courses/modules/${moduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId) }
            : c,
        ),
      );
    }
  };

  /* ── Add lesson ────────────────────────────────────────── */
  const handleAddLesson = async (courseId: string, moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    const course = courses.find((c) => c.id === courseId);
    const mod = course?.modules.find((m) => m.id === moduleId);
    const orderIndex = (mod?.lessons.length ?? 0) + 1;

    const res = await fetch(`${API}/courses/modules/${moduleId}/lessons`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: newLessonTitle,
        type: newLessonType,
        contentUrl: newLessonUrl || undefined,
        duration: newLessonDuration || undefined,
        orderIndex,
      }),
    });
    if (res.ok) {
      const newLesson: Lesson = await res.json();
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                modules: c.modules.map((m) =>
                  m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m,
                ),
              }
            : c,
        ),
      );
      setNewLessonTitle('');
      setNewLessonUrl('');
      setNewLessonDuration('');
      setNewLessonType('VIDEO');
      setAddingLessonTo(null);
    }
  };

  /* ── Delete lesson ─────────────────────────────────────── */
  const handleDeleteLesson = async (courseId: string, moduleId: string, lessonId: string) => {
    const res = await fetch(`${API}/courses/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                modules: c.modules.map((m) =>
                  m.id === moduleId
                    ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
                    : m,
                ),
              }
            : c,
        ),
      );
    }
  };

  /* ── Add Live Session ──────────────────────────────────── */
  const handleAddLiveSession = async (courseId: string) => {
    if (!newSessionTitle.trim()) {
      alert('Please provide a title for the Live Session.');
      return;
    }
    if (!newSessionDate || !newSessionTime) {
      alert('Please select both a date and a time for the Live Session.');
      return;
    }
    const startDate = new Date(`${newSessionDate}T${newSessionTime}`);
    if (isNaN(startDate.getTime())) {
      alert('Invalid date selected.');
      return;
    }

    const res = await fetch(`${API}/live-sessions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        courseId,
        title: newSessionTitle,
        startTime: startDate.toISOString(),
      })
    });
    if (res.ok) {
      const session = await res.json();
      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, liveSessions: [...(c.liveSessions || []), session] } 
          : c
      ));
      setAddingSessionTo(null);
      setNewSessionTitle('');
      setNewSessionDate('');
      setNewSessionTime('');
      alert('Live session scheduled successfully! 🎉');
    }
  };

  /* ── Delete Live Session ───────────────────────────────── */
  const handleDeleteLiveSession = async (courseId: string, sessionId: string) => {
    if (!confirm('Delete this live session?')) return;
    const res = await fetch(`${API}/live-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, liveSessions: (c.liveSessions || []).filter(s => s.id !== sessionId) }
          : c
      ));
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <OperunMain>
      <OperunContainer maxWidth="lg">
        <div style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <OperunCard>
              <OperunCardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Total Courses</h3>
                  <BookOpen style={{ color: '#0ea5e9', width: '20px', height: '20px' }} />
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                  {loadingCourses ? '—' : courses.length}
                </p>
              </OperunCardBody>
            </OperunCard>

            <OperunCard>
              <OperunCardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Published</h3>
                  <CheckCircle style={{ color: '#10b981', width: '20px', height: '20px' }} />
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                  {loadingCourses ? '—' : courses.filter((c) => c.published).length}
                </p>
              </OperunCardBody>
            </OperunCard>

            <OperunCard>
              <OperunCardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Drafts</h3>
                  <EyeOff style={{ color: '#eab308', width: '20px', height: '20px' }} />
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                  {loadingCourses ? '—' : courses.filter((c) => !c.published).length}
                </p>
              </OperunCardBody>
            </OperunCard>
          </div>

          {/* Courses Section */}
          <OperunCard>
            <OperunCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <OperunCardTitle>Your Courses</OperunCardTitle>
                <OperunButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={16} /> Create Course
                </OperunButton>
              </div>
            </OperunCardHeader>

            <OperunCardBody>
              {/* Create Course Form */}
              {isCreating && (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem', margin: 0 }}>Create New Course</h3>
                    <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <OperunInput
                        label="Course Title"
                        placeholder="Enter course title"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        required
                        fullWidth
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#d1d5db', marginBottom: '0.5rem' }}>
                          Description
                        </label>
                        <textarea
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'rgba(31, 41, 55, 0.8)',
                            border: '1px solid rgba(107, 114, 128, 0.5)',
                            borderRadius: '0.375rem',
                            color: '#ffffff',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            minHeight: '100px',
                            resize: 'none',
                          }}
                          placeholder="Enter course description"
                          value={newCourseDesc}
                          onChange={(e) => setNewCourseDesc(e.target.value)}
                          required
                        />
                      </div>
                      <OperunInput
                        label="Price ($)"
                        type="number"
                        placeholder="0.00"
                        value={newCoursePrice}
                        onChange={(e) => setNewCoursePrice(e.target.value)}
                        fullWidth
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <OperunButton type="submit" variant="primary">Save Course</OperunButton>
                        <OperunButton type="button" variant="secondary" onClick={() => setIsCreating(false)}>
                          Cancel
                        </OperunButton>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingCourses && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ height: '4rem', background: 'rgba(31, 41, 55, 0.5)', borderRadius: '0.75rem', animation: 'pulse 2s infinite' }} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loadingCourses && coursesError && (
                <OperunAlert variant="error" onClose={() => setCoursesError('')}>
                  {coursesError}
                </OperunAlert>
              )}

              {/* Empty State */}
              {!loadingCourses && !coursesError && courses.length === 0 && (
                <p style={{ textAlign: 'center', paddingTop: '2.5rem', paddingBottom: '2.5rem', color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                  No courses assigned yet. Check back later or contact your admin.
                </p>
              )}

              {/* Courses List */}
              {!loadingCourses && courses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {courses.map((course) => {
                    const isExpanded = expandedCourse === course.id;
                    const isEditing = editingCourse === course.id;

                    return (
                      <div
                        key={course.id}
                        style={{
                          border: '1px solid rgba(107, 114, 128, 0.5)',
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          background: 'rgba(15, 23, 42, 0.5)',
                        }}
                      >
                        {/* Course Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem' }}>
                          <button
                            onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                            style={{
                              marginTop: '0.25rem',
                              background: 'none',
                              border: 'none',
                              color: '#6b7280',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <OperunInput
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  fullWidth
                                />
                                <div>
                                  <textarea
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      background: 'rgba(31, 41, 55, 0.8)',
                                      border: '1px solid rgba(107, 114, 128, 0.5)',
                                      borderRadius: '0.375rem',
                                      color: '#ffffff',
                                      fontSize: '0.875rem',
                                      fontFamily: 'inherit',
                                      minHeight: '80px',
                                      resize: 'none',
                                    }}
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                  />
                                </div>
                                <OperunInput
                                  type="number"
                                  placeholder="Price"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  fullWidth
                                />
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                  <OperunButton variant="primary" size="sm" onClick={() => void handleSaveEdit(course.id)}>
                                    Save
                                  </OperunButton>
                                  <OperunButton variant="secondary" size="sm" onClick={() => setEditingCourse(null)}>
                                    Cancel
                                  </OperunButton>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h3 style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem', margin: 0, marginBottom: '0.5rem' }}>
                                  {course.title}
                                </h3>
                                <p style={{
                                  color: '#9ca3af',
                                  fontSize: '0.75rem',
                                  margin: 0,
                                  marginBottom: '0.5rem',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}>
                                  {course.description}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '0.375rem',
                                      fontWeight: 500,
                                      background: course.published ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                      color: course.published ? '#10b981' : '#eab308',
                                    }}
                                  >
                                    {course.published ? 'Published' : 'Draft'}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} • {course.price === 0 ? 'Free' : `$${course.price}`}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {!isEditing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                              <button
                                onClick={() => {
                                  setEditingCourse(course.id);
                                  setEditTitle(course.title);
                                  setEditDesc(course.description);
                                  setEditPrice(String(course.price));
                                }}
                                style={{
                                  padding: '0.375rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#9ca3af',
                                  cursor: 'pointer',
                                  borderRadius: '0.375rem',
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => void handleTogglePublish(course)}
                                style={{
                                  padding: '0.375rem',
                                  background: 'none',
                                  border: 'none',
                                  color: course.published ? '#10b981' : '#eab308',
                                  cursor: 'pointer',
                                  borderRadius: '0.375rem',
                                }}
                              >
                                {course.published ? <EyeOff size={14} /> : <CheckCircle size={14} />}
                              </button>
                              <button
                                onClick={() => void handleDeleteCourse(course.id)}
                                style={{
                                  padding: '0.375rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  borderRadius: '0.375rem',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Expanded: Modules & Lessons */}
                        {isExpanded && (
                          <div style={{
                            borderTop: '1px solid rgba(107, 114, 128, 0.5)',
                            padding: '1rem',
                            background: 'rgba(5, 15, 30, 0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                          }}>
                            {course.modules.length === 0 && (
                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>No modules yet.</p>
                            )}

                            {course.modules.map((mod, mIdx) => (
                              <div key={mod.id} style={{ border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                {/* Module Header */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.625rem 0.75rem',
                                  background: 'rgba(31, 41, 55, 0.5)',
                                }}>
                                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#ffffff' }}>
                                    {mIdx + 1}. {mod.title}
                                  </span>
                                  <button
                                    onClick={() => void handleDeleteModule(course.id, mod.id)}
                                    style={{
                                      padding: '0.25rem',
                                      background: 'none',
                                      border: 'none',
                                      color: '#6b7280',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {/* Lessons */}
                                <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.3)' }}>
                                  {mod.lessons.map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        fontSize: '0.75rem',
                                        color: '#d1d5db',
                                        borderTop: '1px solid rgba(107, 114, 128, 0.2)',
                                      }}
                                    >
                                      <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#4b5563', flexShrink: 0 }} />
                                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {lesson.title}
                                      </span>
                                      <span style={{ color: '#9ca3af', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                        {lesson.type}
                                      </span>
                                      <button
                                        onClick={() => void handleDeleteLesson(course.id, mod.id, lesson.id)}
                                        style={{
                                          padding: '0.125rem',
                                          background: 'none',
                                          border: 'none',
                                          color: '#6b7280',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Add Lesson */}
                                {addingLessonTo === mod.id ? (
                                  <div style={{
                                    padding: '0.75rem',
                                    borderTop: '1px solid rgba(107, 114, 128, 0.3)',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                  }}>
                                    <OperunInput
                                      placeholder="Lesson title *"
                                      value={newLessonTitle}
                                      onChange={(e) => setNewLessonTitle(e.target.value)}
                                      fullWidth
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <select
                                        style={{
                                          flex: 1,
                                          background: 'rgba(31, 41, 55, 0.8)',
                                          border: '1px solid rgba(107, 114, 128, 0.5)',
                                          borderRadius: '0.375rem',
                                          padding: '0.5rem',
                                          color: '#ffffff',
                                          fontSize: '0.875rem',
                                        }}
                                        value={newLessonType}
                                        onChange={(e) => setNewLessonType(e.target.value as Lesson['type'])}
                                      >
                                        <option value="VIDEO">Video</option>
                                        <option value="PDF">PDF</option>
                                        <option value="QUIZ">Quiz</option>
                                      </select>
                                      <OperunInput
                                        placeholder="Duration (10:00)"
                                        value={newLessonDuration}
                                        onChange={(e) => setNewLessonDuration(e.target.value)}
                                        style={{ flex: 1 }}
                                      />
                                    </div>
                                    <OperunInput
                                      placeholder="Content URL (optional)"
                                      value={newLessonUrl}
                                      onChange={(e) => setNewLessonUrl(e.target.value)}
                                      fullWidth
                                    />
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                      <OperunButton variant="primary" size="sm" onClick={() => void handleAddLesson(course.id, mod.id)}>
                                        Add
                                      </OperunButton>
                                      <OperunButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                          setAddingLessonTo(null);
                                          setNewLessonTitle('');
                                          setNewLessonUrl('');
                                          setNewLessonDuration('');
                                        }}
                                      >
                                        Cancel
                                      </OperunButton>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setAddingLessonTo(mod.id)}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.875rem',
                                      color: '#6b7280',
                                      padding: '0.5rem 0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      borderTop: '1px solid rgba(107, 114, 128, 0.2)',
                                      cursor: 'pointer',
                                      justifyContent: 'flex-start',
                                    }}
                                  >
                                    <Plus size={14} /> Add Lesson
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Add Module */}
                            {addingModuleTo === course.id ? (
                              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                                <OperunInput
                                  placeholder="Module title *"
                                  value={newModuleTitle}
                                  onChange={(e) => setNewModuleTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') void handleAddModule(course.id);
                                  }}
                                  fullWidth
                                />
                                <OperunButton variant="primary" onClick={() => void handleAddModule(course.id)}>
                                  Add
                                </OperunButton>
                                <OperunButton variant="secondary" onClick={() => {
                                  setAddingModuleTo(null);
                                  setNewModuleTitle('');
                                }}>
                                  Cancel
                                </OperunButton>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingModuleTo(course.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.875rem',
                                  color: '#6b7280',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <Plus size={14} /> Add Module
                              </button>
                            )}

                            {/* Assignments Section */}
                            <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.3)', paddingTop: '1rem', marginTop: '1rem' }}>
                              <AssignmentList courseId={course.id} token={token} />
                            </div>

                            {/* Quizzes Section */}
                            <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.3)', paddingTop: '1rem', marginTop: '1rem' }}>
                              <QuizList courseId={course.id} token={token} />
                            </div>

                            {/* Live Classes Section */}
                            <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.3)', paddingTop: '1rem', marginTop: '1rem' }}>
                              <LiveClassList courseId={course.id} token={token} />
                            </div>

                            {/* Announcements Section */}
                            <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.3)', paddingTop: '1rem', marginTop: '1rem' }}>
                              <AnnouncementList courseId={course.id} token={token} />
                            </div>

                            {/* Analytics Section */}
                            <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.3)', paddingTop: '1rem', marginTop: '1rem' }}>
                              <AnalyticsDashboard courseId={course.id} token={token} />
                            </div>

                            {/* Live Sessions Section */}
                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(107, 114, 128, 0.5)' }}>
                              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem', margin: 0 }}>Live Sessions</h4>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                {(!course.liveSessions || course.liveSessions.length === 0) && (
                                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>No live sessions scheduled.</p>
                                )}

                                {course.liveSessions?.map(session => (
                                  <div
                                    key={session.id}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.25rem',
                                      padding: '0.75rem',
                                      background: 'rgba(31, 41, 55, 0.5)',
                                      border: '1px solid rgba(107, 114, 128, 0.5)',
                                      borderRadius: '0.5rem',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <h5 style={{ fontWeight: 500, fontSize: '0.875rem', color: '#ffffff', margin: 0 }}>
                                        {session.title}
                                      </h5>
                                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <a
                                          href={`/dashboard/live/${session.id}`}
                                          style={{
                                            fontSize: '0.75rem',
                                            background: 'rgba(14, 165, 233, 0.2)',
                                            color: '#0ea5e9',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            textDecoration: 'none',
                                          }}
                                        >
                                          Host
                                        </a>
                                        <button
                                          onClick={() => void handleDeleteLiveSession(course.id, session.id)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6b7280',
                                            cursor: 'pointer',
                                            padding: 0,
                                          }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                                      {new Date(session.startTime).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Add Live Session */}
                              {addingSessionTo === course.id ? (
                                <div style={{
                                  padding: '0.75rem',
                                  border: '1px solid rgba(107, 114, 128, 0.5)',
                                  borderRadius: '0.5rem',
                                  background: 'rgba(15, 23, 42, 0.5)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.75rem',
                                }}>
                                  <OperunInput
                                    placeholder="Session Title *"
                                    value={newSessionTitle}
                                    onChange={(e) => setNewSessionTitle(e.target.value)}
                                    fullWidth
                                  />
                                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <OperunInput
                                      type="date"
                                      value={newSessionDate}
                                      onChange={(e) => setNewSessionDate(e.target.value)}
                                      fullWidth
                                    />
                                    <OperunInput
                                      type="time"
                                      value={newSessionTime}
                                      onChange={(e) => setNewSessionTime(e.target.value)}
                                      fullWidth
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <OperunButton variant="primary" onClick={() => void handleAddLiveSession(course.id)}>
                                      Save Session
                                    </OperunButton>
                                    <OperunButton
                                      variant="secondary"
                                      onClick={() => {
                                        setAddingSessionTo(null);
                                        setNewSessionTitle('');
                                        setNewSessionDate('');
                                        setNewSessionTime('');
                                      }}
                                    >
                                      Cancel
                                    </OperunButton>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAddingSessionTo(course.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Plus size={14} /> Schedule Live Session
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </OperunCardBody>
          </OperunCard>
        </div>
      </OperunContainer>
    </OperunMain>
  );
}
