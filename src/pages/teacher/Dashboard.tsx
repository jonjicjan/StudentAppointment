import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Mail, BookOpen, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeacherDetails {
  name: string;
  email: string;
  department: string;
  subjects: string[];
  status: string;
}

interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  subject: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [teacherDetails, setTeacherDetails] = useState<TeacherDetails | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeacherDetails();
      fetchAppointments();
    }
  }, [user]);

  const fetchTeacherDetails = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as TeacherDetails;
        setTeacherDetails(data);
      } else {
        toast.error('Teacher details not found');
      }
    } catch (err) {
      console.error('Error fetching teacher details:', err);
      toast.error('Failed to load teacher details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!user?.uid) return;

    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('teacherId', '==', user.uid)
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

  const handleAppointmentAction = async (appointmentId: string, status: 'approved' | 'rejected') => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status,
        updatedAt: new Date().toISOString()
      });

      // Refresh appointments after update
      await fetchAppointments();
      toast.success(`Appointment ${status} successfully`);
    } catch (err) {
      console.error('Error updating appointment:', err);
      toast.error('Failed to update appointment status');
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
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Teacher Dashboard</h1>

        {/* Teacher Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Profile</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <User className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-lg font-medium text-gray-900">{teacherDetails?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="text-lg font-medium text-gray-900">{teacherDetails?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="text-lg font-medium text-gray-900">{teacherDetails?.department}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="h-6 w-6 text-green-500" />
                <p className="text-sm text-gray-500">Subjects</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {teacherDetails?.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
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
                      <h3 className="font-medium text-gray-900">{appointment.studentName}</h3>
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

          {/* Pending Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Appointments</h2>
            <div className="space-y-4">
              {appointments.filter(apt => apt.status === 'pending').map(appointment => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{appointment.studentName}</h3>
                      <p className="text-sm text-gray-500">{appointment.subject}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAppointmentAction(appointment.id, 'approved')}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Approve appointment"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleAppointmentAction(appointment.id, 'rejected')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Reject appointment"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {appointments.filter(apt => apt.status === 'pending').length === 0 && (
                <p className="text-gray-600">No pending appointments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}