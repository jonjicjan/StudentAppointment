import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Calendar, MessageSquare, Clock, User, Mail, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface Teacher {
  uid: string;
  name: string;
  department: string;
  subjects: string[];
  availability: {
    [key: string]: Array<{
      start: string;
      end: string;
    }>;
  };
}

interface Appointment {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  subject: string;
}

interface StudentDetails {
  name: string;
  email: string;
  department: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);

  useEffect(() => {
    if (user) {
      fetchTeachers();
      fetchAppointments();
      fetchStudentDetails();
    }
  }, [user]);

  const fetchTeachers = async () => {
    try {
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
    } catch (err) {
      console.error('Error fetching teachers:', err);
      toast.error('Failed to load teachers');
    }
  };

  const fetchAppointments = async () => {
    if (!user?.uid) return;

    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('studentId', '==', user.uid)
      );
      
      const snapshot = await getDocs(appointmentsQuery);
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];

      // Sort appointments by date and time
      appointmentsData.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      toast.error('Failed to load appointments');
    }
  };

  const fetchStudentDetails = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as StudentDetails;
        setStudentDetails(data);
      } else {
        toast.error('Student details not found');
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>

        {/* Student Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Profile</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <User className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-lg font-medium text-gray-900">{studentDetails?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="text-lg font-medium text-gray-900">{studentDetails?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="text-lg font-medium text-gray-900">{studentDetails?.department}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
            <div className="space-y-4">
              {appointments.filter(apt => 
                apt.status === 'approved' && 
                new Date(`${apt.date}T${apt.time}`) > new Date()
              ).map(appointment => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{appointment.teacherName}</h3>
                      <p className="text-sm text-gray-500">{appointment.subject}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              {appointments.filter(apt => 
                apt.status === 'approved' && 
                new Date(`${apt.date}T${apt.time}`) > new Date()
              ).length === 0 && (
                <p className="text-gray-600">No upcoming appointments</p>
              )}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Appointments</h2>
            <div className="space-y-4">
              {appointments.filter(apt => 
                new Date(`${apt.date}T${apt.time}`) <= new Date()
              ).slice(0, 5).map(appointment => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{appointment.teacherName}</h3>
                      <p className="text-sm text-gray-500">{appointment.subject}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              {appointments.filter(apt => 
                new Date(`${apt.date}T${apt.time}`) <= new Date()
              ).length === 0 && (
                <p className="text-gray-600">No recent appointments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}