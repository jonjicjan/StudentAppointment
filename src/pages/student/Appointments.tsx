import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, Clock, User, BookOpen, Mail, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Teacher {
  uid: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  availability: {
    [key: string]: TimeSlot[];
  };
}

export default function StudentAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // First verify if the user is a student
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          toast.error('User profile not found');
          return;
        }

        const userData = userDoc.data();
        if (userData.role !== 'student') {
          toast.error('Access denied. Students only.');
          navigate('/');
          return;
        }

        // Fetch approved teachers
        const teachersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'teacher'),
          where('status', '==', 'approved')
        );
        
        const snapshot = await getDocs(teachersQuery);
        const teachersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.name,
            email: data.email,
            department: data.department,
            subjects: data.subjects || [],
            availability: data.availability || {}
          } as Teacher;
        });

        // Filter teachers who have availability slots
        const availableTeachers = teachersData.filter(teacher => {
          const hasSlots = Object.values(teacher.availability || {}).some(
            slots => Array.isArray(slots) && slots.length > 0
          );
          return hasSlots;
        });

        setTeachers(availableTeachers);
        
        if (availableTeachers.length === 0) {
          toast.error('No teachers have available slots at the moment');
        }
      } catch (err) {
        console.error('Error fetching teachers:', err);
        toast.error('Failed to load available appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [user, navigate]);

  const handleBookAppointment = async (teacher: Teacher, day: string, slot: TimeSlot) => {
    if (!user?.uid) {
      toast.error('Please login to book appointments');
      return;
    }

    try {
      const appointment = {
        teacherId: teacher.uid,
        studentId: user.uid,
        teacherName: teacher.name,
        studentName: user.displayName || user.email,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointment);
      toast.success('Appointment request sent successfully');
    } catch (err) {
      console.error('Error booking appointment:', err);
      toast.error('Failed to book appointment');
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subjects?.some(subject => 
      subject.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleTeacherExpansion = (teacherId: string) => {
    setExpandedTeacher(expandedTeacher === teacherId ? null : teacherId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Available Appointments</h1>
          <div className="text-sm text-gray-600">
            Teachers with slots: {teachers.length}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by teacher name, department, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDay('')}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    !selectedDay ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Days
                </button>
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      selectedDay === day ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Teachers List */}
        <div className="space-y-4">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map(teacher => (
              <div
                key={teacher.uid}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Teacher Header - Always Visible */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleTeacherExpansion(teacher.uid)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-12 w-12 text-gray-400 bg-gray-100 rounded-full p-2" />
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-gray-900">{teacher.name}</h2>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-gray-600">{teacher.department}</p>
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-1" />
                            <span className="text-sm">{teacher.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {expandedTeacher === teacher.uid ? (
                      <ChevronUp className="h-6 w-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedTeacher === teacher.uid && (
                  <div className="border-t px-6 py-4">
                    {/* Subjects */}
                    <div className="mb-6">
                      <div className="flex items-center text-gray-600 mb-2">
                        <BookOpen className="h-5 w-5 mr-2" />
                        <span>Subjects:</span>
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

                    {/* Available Slots */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Available Time Slots</h3>
                      <div className="space-y-3">
                        {daysOfWeek
                          .filter(day => !selectedDay || day === selectedDay)
                          .map(day => (
                            teacher.availability[day]?.length > 0 && (
                              <div key={day} className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-700 mb-3">{day}</h4>
                                <div className="space-y-2">
                                  {teacher.availability[day].map((slot, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                      <div className="flex items-center">
                                        <Clock className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-gray-700">
                                          {slot.startTime} - {slot.endTime}
                                        </span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleBookAppointment(teacher, day, slot);
                                        }}
                                        className="text-sm bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 hover:shadow-sm"
                                      >
                                        <Calendar className="h-4 w-4" />
                                        Book Slot
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          ))}
                        {Object.keys(teacher.availability || {}).length === 0 && (
                          <p className="text-gray-500 text-center py-4">
                            No time slots available for this teacher
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">
                {searchQuery 
                  ? 'No teachers found matching your search criteria' 
                  : 'No teachers have available slots at the moment'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 