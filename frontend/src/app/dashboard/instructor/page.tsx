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

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  published: boolean;
  thumbnail: string | null;
  modules: CourseModule[];
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

  /* ── Fetch courses ─────────────────────────────────────── */
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await fetch(`${API}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
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

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-400 text-sm font-medium">Total Courses</h3>
            <BookOpen className="text-blue-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">{loadingCourses ? '—' : courses.length}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-400 text-sm font-medium">Published</h3>
            <CheckCircle className="text-emerald-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">{loadingCourses ? '—' : courses.filter((c) => c.published).length}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl hover:border-yellow-500/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-400 text-sm font-medium">Drafts</h3>
            <EyeOff className="text-yellow-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">{loadingCourses ? '—' : courses.filter((c) => !c.published).length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-1 gap-8">
        {/* Course list */ }
        <div className="md:col-span-1">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Your Courses</h2>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Create Course
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateCourse} className="mb-6 bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-white mb-2">Create New Course</h3>
                <div>
                  <input
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-sm"
                    placeholder="Course Title"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <textarea
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-sm resize-none"
                    placeholder="Course Description"
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    className="w-32 bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-sm"
                    placeholder="Price ($)"
                    value={newCoursePrice}
                    onChange={(e) => setNewCoursePrice(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
                    Save Course
                  </button>
                  <button type="button" onClick={() => setIsCreating(false)} className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded text-sm font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loadingCourses && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-neutral-800 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!loadingCourses && coursesError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-sm">
                <AlertCircle size={16} />
                {coursesError}
              </div>
            )}

            {!loadingCourses && !coursesError && courses.length === 0 && (
              <div className="text-center py-10 text-neutral-500 text-sm">
                No courses assigned yet. Check back later or contact your admin.
              </div>
            )}

            {!loadingCourses && courses.length > 0 && (
              <div className="space-y-4">
                {courses.map((course) => {
                  const isExpanded = expandedCourse === course.id;
                  const isEditing = editingCourse === course.id;

                  return (
                    <div
                      key={course.id}
                      className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30"
                    >
                      {/* Course row */}
                      <div className="flex items-start gap-3 p-4">
                        <button
                          onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                          className="mt-1 text-neutral-500 hover:text-white transition-colors shrink-0"
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-sm"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                              <textarea
                                rows={2}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-sm resize-none"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                              />
                              <input
                                type="number"
                                className="w-24 bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-sm"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                placeholder="Price"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => void handleSaveEdit(course.id)}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCourse(null)}
                                  className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-white text-sm">{course.title}</h3>
                              <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1">{course.description}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    course.published
                                      ? 'bg-emerald-900/50 text-emerald-400'
                                      : 'bg-yellow-900/40 text-yellow-400'
                                  }`}
                                >
                                  {course.published ? 'Published' : 'Draft'}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} •{' '}
                                  {course.price === 0 ? 'Free' : `$${course.price}`}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingCourse(course.id);
                                setEditTitle(course.title);
                                setEditDesc(course.description);
                                setEditPrice(String(course.price));
                              }}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => void handleTogglePublish(course)}
                              className={`p-1.5 rounded transition-colors ${
                                course.published
                                  ? 'text-emerald-400 hover:bg-emerald-900/20'
                                  : 'text-yellow-400 hover:bg-yellow-900/20'
                              }`}
                              title={course.published ? 'Unpublish' : 'Publish'}
                            >
                              {course.published ? <EyeOff size={14} /> : <CheckCircle size={14} />}
                            </button>
                            <button
                              onClick={() => void handleDeleteCourse(course.id)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded: modules & lessons */}
                      {isExpanded && (
                        <div className="border-t border-neutral-800 px-4 py-4 space-y-4 bg-neutral-950/30">
                          {course.modules.length === 0 && (
                            <p className="text-xs text-neutral-500">No modules yet.</p>
                          )}

                          {course.modules.map((mod, mIdx) => (
                            <div key={mod.id} className="border border-neutral-800 rounded-lg overflow-hidden">
                              {/* Module header */}
                              <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-800/50">
                                <span className="text-sm font-medium text-white">
                                  {mIdx + 1}. {mod.title}
                                </span>
                                <button
                                  onClick={() => void handleDeleteModule(course.id, mod.id)}
                                  className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {/* Lessons */}
                              <div className="divide-y divide-neutral-800/50">
                                {mod.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-neutral-700 shrink-0" />
                                    <span className="flex-1 truncate">{lesson.title}</span>
                                    <span className="text-neutral-600 uppercase text-[10px]">{lesson.type}</span>
                                    <button
                                      onClick={() =>
                                        void handleDeleteLesson(course.id, mod.id, lesson.id)
                                      }
                                      className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Add lesson inline */}
                              {addingLessonTo === mod.id ? (
                                <div className="px-3 py-3 border-t border-neutral-800 space-y-2 bg-neutral-900/50">
                                  <input
                                    placeholder="Lesson title *"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-xs"
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <select
                                      className="bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-xs flex-1"
                                      value={newLessonType}
                                      onChange={(e) => setNewLessonType(e.target.value as Lesson['type'])}
                                    >
                                      <option value="VIDEO">Video</option>
                                      <option value="PDF">PDF</option>
                                      <option value="QUIZ">Quiz</option>
                                    </select>
                                    <input
                                      placeholder="Duration (e.g. 10:00)"
                                      className="bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-xs flex-1"
                                      value={newLessonDuration}
                                      onChange={(e) => setNewLessonDuration(e.target.value)}
                                    />
                                  </div>
                                  <input
                                    placeholder="Content URL (optional)"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white text-xs"
                                    value={newLessonUrl}
                                    onChange={(e) => setNewLessonUrl(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => void handleAddLesson(course.id, mod.id)}
                                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                                    >
                                      Add
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAddingLessonTo(null);
                                        setNewLessonTitle('');
                                        setNewLessonUrl('');
                                        setNewLessonDuration('');
                                      }}
                                      className="text-xs bg-neutral-700 text-white px-3 py-1.5 rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAddingLessonTo(mod.id)}
                                  className="w-full flex items-center gap-1 text-xs text-neutral-500 hover:text-blue-400 px-3 py-2 border-t border-neutral-800/50 transition-colors"
                                >
                                  <Plus size={12} /> Add Lesson
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Add module */}
                          {addingModuleTo === course.id ? (
                            <div className="flex gap-2 mt-2">
                              <input
                                placeholder="Module title *"
                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white text-sm"
                                value={newModuleTitle}
                                onChange={(e) => setNewModuleTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') void handleAddModule(course.id);
                                }}
                              />
                              <button
                                onClick={() => void handleAddModule(course.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 rounded-lg"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setAddingModuleTo(null);
                                  setNewModuleTitle('');
                                }}
                                className="bg-neutral-700 text-white text-sm px-3 rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingModuleTo(course.id)}
                              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-blue-400 transition-colors"
                            >
                              <Plus size={14} /> Add Module
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
