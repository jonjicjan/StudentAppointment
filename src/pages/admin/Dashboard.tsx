import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { Users, UserPlus, Shield, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Teacher {
  uid: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  status: 'pending' | 'approved' | 'rejected';
}

interface Student {
  uid: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    department: '',
    subjects: [] as string[],
    password: ''
  });
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teachers
      const teachersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'teacher')
      );
      const teachersSnapshot = await getDocs(teachersQuery);
      const teachersData = teachersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Teacher[];

      // Fetch students
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Student[];

      setTeachers(teachersData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Unable to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newTeacher.email,
        newTeacher.password
      );

      // Create teacher document in Firestore
      const teacherData = {
        uid: userCredential.user.uid,
        name: newTeacher.name,
        email: newTeacher.email,
        department: newTeacher.department,
        subjects: newTeacher.subjects,
        role: 'teacher',
        status: 'approved', // Auto-approve teachers added by admin
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), teacherData);
      
      setShowAddTeacherForm(false);
      setNewTeacher({ name: '', email: '', department: '', subjects: [], password: '' });
      fetchUsers();
      toast.success('Teacher added successfully!');
    } catch (err: any) {
      console.error('Error adding teacher:', err);
      toast.error(err.message || 'Failed to add teacher. Please try again.');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newStudent.email,
        newStudent.password
      );

      // Create student document in Firestore
      const studentData = {
        uid: userCredential.user.uid,
        name: newStudent.name,
        email: newStudent.email,
        role: 'student',
        status: 'approved', // Auto-approve students added by admin
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), studentData);
      
      setShowAddStudentForm(false);
      setNewStudent({ name: '', email: '', password: '' });
      fetchUsers();
      toast.success('Student added successfully!');
    } catch (err: any) {
      console.error('Error adding student:', err);
      toast.error(err.message || 'Failed to add student. Please try again.');
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subject = e.target.value;
    if (e.target.checked) {
      setNewTeacher({ ...newTeacher, subjects: [...newTeacher.subjects, subject] });
    } else {
      setNewTeacher({ ...newTeacher, subjects: newTeacher.subjects.filter(s => s !== subject) });
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Total Teachers</p>
              <p className="text-xl font-semibold">{teachers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-xl font-semibold">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserPlus className="h-6 w-6 text-yellow-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Pending Approvals</p>
              <p className="text-xl font-semibold">
                {teachers.filter(t => t.status === 'pending').length + students.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`${
                activeTab === 'teachers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Teachers
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Students
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'teachers' ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Teacher Management</h2>
              <button
                onClick={() => setShowAddTeacherForm(!showAddTeacherForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                title="Add new teacher"
                aria-label="Add new teacher"
              >
                Add Teacher
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {showAddTeacherForm && (
              <form onSubmit={handleAddTeacher} className="mb-6 p-4 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                      title="Enter teacher name"
                      placeholder="Enter teacher name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                      title="Enter teacher email"
                      placeholder="Enter teacher email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newTeacher.department}
                      onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                      title="Enter department"
                      placeholder="Enter department"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newTeacher.password}
                      onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                      title="Enter password"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Art'].map(subject => (
                      <label key={subject} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newTeacher.subjects.includes(subject)}
                          onChange={handleSubjectChange}
                          value={subject}
                          className="rounded text-blue-500"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTeacherForm(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Add Teacher
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {filteredTeachers.map(teacher => (
                <div key={teacher.uid} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{teacher.name}</h3>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                      <p className="text-sm text-gray-500">{teacher.department}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Subjects:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {teacher.subjects.map(subject => (
                            <span key={subject} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                        teacher.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        teacher.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                      </span>
                      <p className="text-sm text-green-600 mt-2">
                        Teacher can login and schedule appointments
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Student Management</h2>
              <button
                onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                title="Add new student"
                aria-label="Add new student"
              >
                Add Student
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {showAddStudentForm && (
              <form onSubmit={handleAddStudent} className="mb-6 p-4 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                      title="Enter student name"
                      placeholder="Enter student name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                      title="Enter student email"
                      placeholder="Enter student email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                      title="Enter password"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentForm(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {filteredStudents.map(student => (
                <div key={student.uid} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                        student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        student.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                      <p className="text-sm text-green-600 mt-2">
                        Student can login and book appointments
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}