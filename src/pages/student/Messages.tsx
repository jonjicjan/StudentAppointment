import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, User, Mail, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Teacher {
  uid: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  status: string;
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        const teachersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'teacher')
        );
        
        const snapshot = await getDocs(teachersQuery);
        const teachersData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Teacher[];

        setTeachers(teachersData);
        
        if (teachersData.length === 0) {
          toast.error('No teachers available');
        }
      } catch (err) {
        console.error('Error fetching teachers:', err);
        toast.error('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [user, navigate]);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subjects?.some(subject => 
      subject.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Teachers</h1>
          <div className="text-sm text-gray-600">
            Total Teachers: {teachers.length}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by name, department, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map(teacher => (
              <div
                key={teacher.uid}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <User className="h-12 w-12 text-gray-400 bg-gray-100 rounded-full p-2" />
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-900">{teacher.name}</h2>
                    <p className="text-gray-600">{teacher.department}</p>
                    <span className={`text-sm px-2 py-1 rounded ${
                      teacher.status === 'approved' ? 'bg-green-100 text-green-800' :
                      teacher.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {teacher.status || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 mr-2" />
                    <span>{teacher.email}</span>
                  </div>

                  <div>
                    <div className="flex items-center mb-2 text-gray-600">
                      <BookOpen className="h-5 w-5 mr-2" />
                      <span>Subjects</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects?.map(subject => (
                        <span
                          key={subject}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/student/messages/${teacher.uid}`)}
                  className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  disabled={teacher.status !== 'approved'}
                >
                  {teacher.status === 'approved' ? 'Send Message' : 'Teacher Not Available'}
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">
                {searchQuery 
                  ? 'No teachers found matching your search criteria' 
                  : 'No teachers have registered yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 