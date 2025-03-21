import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, Clock, Plus, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface TeacherAvailability {
  [key: string]: TimeSlot[];
}

export default function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<TeacherAvailability>({});
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00'
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    const fetchTeacherAvailability = async () => {
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const teacherDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!teacherDoc.exists()) {
          toast.error('Teacher profile not found');
          return;
        }

        const teacherData = teacherDoc.data();
        if (teacherData.role !== 'teacher') {
          toast.error('Access denied. Teachers only.');
          navigate('/');
          return;
        }

        setAvailability(teacherData.availability || {});
      } catch (err) {
        console.error('Error fetching availability:', err);
        toast.error('Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherAvailability();
  }, [user, navigate]);

  const handleAddSlot = async () => {
    if (!user?.uid) {
      toast.error('Please login to add time slots');
      return;
    }

    try {
      const updatedAvailability = { ...availability };
      if (!updatedAvailability[newSlot.day]) {
        updatedAvailability[newSlot.day] = [];
      }

      // Check for overlapping slots
      const isOverlapping = updatedAvailability[newSlot.day].some(slot => {
        const newStart = new Date(`2024-01-01T${newSlot.startTime}`);
        const newEnd = new Date(`2024-01-01T${newSlot.endTime}`);
        const slotStart = new Date(`2024-01-01T${slot.startTime}`);
        const slotEnd = new Date(`2024-01-01T${slot.endTime}`);
        
        return (newStart < slotEnd && newEnd > slotStart);
      });

      if (isOverlapping) {
        toast.error('Time slot overlaps with existing slot');
        return;
      }

      updatedAvailability[newSlot.day].push({ ...newSlot });
      
      // Sort slots by start time
      updatedAvailability[newSlot.day].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      );

      await updateDoc(doc(db, 'users', user.uid), {
        availability: updatedAvailability
      });

      setAvailability(updatedAvailability);
      toast.success('Time slot added successfully');
    } catch (err) {
      console.error('Error adding slot:', err);
      toast.error('Failed to add time slot');
    }
  };

  const handleRemoveSlot = async (day: string, index: number) => {
    if (!user?.uid) {
      toast.error('Please login to remove time slots');
      return;
    }

    try {
      const updatedAvailability = { ...availability };
      updatedAvailability[day].splice(index, 1);
      
      if (updatedAvailability[day].length === 0) {
        delete updatedAvailability[day];
      }

      await updateDoc(doc(db, 'users', user.uid), {
        availability: updatedAvailability
      });

      setAvailability(updatedAvailability);
      toast.success('Time slot removed');
    } catch (err) {
      console.error('Error removing slot:', err);
      toast.error('Failed to remove time slot');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Appointment Slots</h1>
          <p className="mt-2 text-gray-600">Set your available time slots for student appointments</p>
        </div>

        {/* Add New Slot Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Time Slot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                id="day"
                name="day"
                value={newSlot.day}
                onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                className="w-full border rounded-lg p-2"
                aria-label="Select day of the week"
              >
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full border rounded-lg p-2"
                aria-label="Select start time"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full border rounded-lg p-2"
                aria-label="Select end time"
              />
            </div>
          </div>
          <button
            onClick={handleAddSlot}
            className="mt-4 flex items-center justify-center w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            aria-label="Add new time slot"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Time Slot
          </button>
        </div>

        {/* Current Slots */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Availability</h2>
          {daysOfWeek.map(day => (
            availability[day]?.length > 0 && (
              <div key={day} className="mb-6 last:mb-0">
                <h3 className="text-lg font-medium text-gray-800 mb-3">{day}</h3>
                <div className="space-y-2">
                  {availability[day].map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-gray-700">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSlot(day, index)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        aria-label={`Remove time slot ${slot.startTime} - ${slot.endTime} on ${day}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          {Object.keys(availability).length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No time slots added yet. Add your first slot above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 