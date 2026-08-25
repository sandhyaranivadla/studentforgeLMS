'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { CheckCircle, EyeOff, AlertCircle, Trash2, Plus, UserPlus, Link as LinkIcon } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  createdAt: string;
}

interface Instructor {
  name: string | null;
  email: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  published: boolean;
  instructor: Instructor;
  modules: { id: string; lessons: { id: string }[] }[];
  enrollments: { id: string }[];
}

export default function AdminDashboard() {
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'enrollments'>('overview');

  /* ── State ── */
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ── Forms State ── */
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState('');

  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: '0', instructorId: '' });
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseError, setCourseError] = useState('');

  const [newEnrollment, setNewEnrollment] = useState({ studentId: '', courseId: '' });
  const [creatingEnrollment, setCreatingEnrollment] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');
  const [enrollmentSuccess, setEnrollmentSuccess] = useState('');

  /* ── Fetch Data ── */
  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        // Fetch courses
        const resCourses = await fetch('http://localhost:4000/courses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resCourses.ok) throw new Error('Failed to load courses');
        const dataCourses = await resCourses.json();
        setCourses(Array.isArray(dataCourses) ? dataCourses : []);

        // Fetch users
        const resUsers = await fetch('http://localhost:4000/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resUsers.ok) throw new Error('Failed to load users');
        const dataUsers = await resUsers.json();
        setUsers(Array.isArray(dataUsers) ? dataUsers : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, [token]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  /* ── Handlers ── */
  const handleTogglePublish = async (course: Course) => {
    const res = await fetch(`http://localhost:4000/courses/${course.id}`, {
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

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Permanently delete this course?')) return;
    const res = await fetch(`http://localhost:4000/courses/${courseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setUserError('');
    try {
      const res = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      
      // refresh users
      const resUsers = await fetch('http://localhost:4000/users', { headers: authHeaders() });
      if (resUsers.ok) setUsers(await resUsers.json());
      
      setNewUser({ name: '', email: '', password: '', role: 'STUDENT' });
      alert('User created successfully');
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'Error creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    setCourseError('');
    try {
      const res = await fetch('http://localhost:4000/courses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description,
          price: parseFloat(newCourse.price) || 0,
          instructorId: newCourse.instructorId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message);
      
      // Add empty course locally for speed
      setCourses(prev => [...prev, { ...data, instructor: users.find(u => u.id === newCourse.instructorId) || { name: 'Admin' }, modules: [], enrollments: [] }]);
      setNewCourse({ title: '', description: '', price: '0', instructorId: '' });
      alert('Course created successfully');
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : 'Error creating course');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEnrollment(true);
    setEnrollmentError('');
    setEnrollmentSuccess('');
    try {
      const res = await fetch('http://localhost:4000/enrollments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newEnrollment),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to enroll student');
      
      setEnrollmentSuccess('Student enrolled successfully!');
      setNewEnrollment({ studentId: '', courseId: '' });
    } catch (err) {
      setEnrollmentError(err instanceof Error ? err.message : 'Error enrolling student');
    } finally {
      setCreatingEnrollment(false);
    }
  };

  /* ── Computed ── */

  const published = courses.filter((c) => c.published).length;
  const drafts = courses.filter((c) => !c.published).length;

  const instructors = users.filter(u => u.role === 'INSTRUCTOR');
  const students = users.filter(u => u.role === 'STUDENT');

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b border-neutral-800">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'Users' },
          { id: 'courses', label: 'Courses' },
          { id: 'enrollments', label: 'Enrollments' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'courses' | 'enrollments')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-neutral-500">
          Loading provisioning data...
        </div>
      )}
      
      {!loading && error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-neutral-400 text-sm font-medium mb-3">Total Users</h3>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-neutral-400 text-sm font-medium mb-3">Total Courses</h3>
            <p className="text-3xl font-bold">{courses.length}</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-neutral-400 text-sm font-medium mb-3">Published</h3>
            <p className="text-3xl font-bold text-emerald-400">{published}</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-neutral-400 text-sm font-medium mb-3">Drafts</h3>
            <p className="text-3xl font-bold text-yellow-400">{drafts}</p>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'users' && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-blue-500" /> Provision User
            </h2>
            {userError && (
              <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-2 rounded border border-red-900/50">{userError}</div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Name</label>
                <input required className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Email</label>
                <input required type="email" className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Password</label>
                <input required type="password" minLength={6} className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Role</label>
                <select className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button disabled={creatingUser} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors">
                {creatingUser ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
             <h2 className="text-lg font-semibold text-white mb-4">All Users</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-neutral-500 border-b border-neutral-800">
                   <tr>
                     <th className="pb-2 font-medium">Name</th>
                     <th className="pb-2 font-medium">Email</th>
                     <th className="pb-2 font-medium">Role</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-800/50">
                   {users.map(u => (
                     <tr key={u.id} className="text-neutral-300">
                       <td className="py-3">{u.name}</td>
                       <td className="py-3 text-neutral-400">{u.email}</td>
                       <td className="py-3">
                         <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                           u.role === 'ADMIN' ? 'bg-red-900/30 text-red-400' :
                           u.role === 'INSTRUCTOR' ? 'bg-blue-900/30 text-blue-400' :
                           'bg-neutral-800 text-neutral-400'
                         }`}>{u.role}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'courses' && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-500" /> Provision Course
            </h2>
            {courseError && (
              <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-2 rounded border border-red-900/50">{courseError}</div>
            )}
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Title</label>
                <input required className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Description</label>
                <textarea required rows={3} className="w-full bg-neutral-800 rounded p-2 text-sm text-white resize-none" value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Assign Instructor</label>
                <select required className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newCourse.instructorId} onChange={e => setNewCourse({...newCourse, instructorId: e.target.value})}>
                  <option value="" disabled>Select an instructor...</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>
                  ))}
                  <option value="self">Myself (Admin)</option>
                </select>
              </div>
              <button disabled={creatingCourse} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors">
                {creatingCourse ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">All Courses</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 border-b border-neutral-800">
                    <th className="pb-3 font-medium pr-4">Course</th>
                    <th className="pb-3 font-medium pr-4">Instructor</th>
                    <th className="pb-3 font-medium pr-4">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-white line-clamp-1">{course.title}</div>
                      </td>
                      <td className="py-3 pr-4 text-neutral-400">{course.instructor?.name || 'Unknown'}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${course.published ? 'bg-emerald-900/50 text-emerald-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                          {course.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => void handleTogglePublish(course)} className="p-1.5 rounded text-xs text-neutral-400 hover:text-white" title={course.published ? 'Unpublish' : 'Publish'}>
                            {course.published ? <EyeOff size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <button onClick={() => void handleDeleteCourse(course.id)} className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'enrollments' && (
        <div className="max-w-xl bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LinkIcon size={18} className="text-blue-500" /> Manual Enrollment
          </h2>
          <p className="text-sm text-neutral-400 mb-6">Assign a student to a specific course to grant them access.</p>
          
          {enrollmentError && <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-2 rounded">{enrollmentError}</div>}
          {enrollmentSuccess && <div className="text-emerald-400 text-sm mb-4 bg-emerald-900/20 p-2 rounded">{enrollmentSuccess}</div>}
          
          <form onSubmit={handleCreateEnrollment} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Select Student</label>
              <select required className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newEnrollment.studentId} onChange={e => setNewEnrollment({...newEnrollment, studentId: e.target.value})}>
                <option value="" disabled>Select a student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Select Course</label>
              <select required className="w-full bg-neutral-800 rounded p-2 text-sm text-white" value={newEnrollment.courseId} onChange={e => setNewEnrollment({...newEnrollment, courseId: e.target.value})}>
                <option value="" disabled>Select a course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <button disabled={creatingEnrollment} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm font-medium transition-colors">
              {creatingEnrollment ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
