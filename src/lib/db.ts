import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp,
  FirestoreError,
  DocumentReference
} from 'firebase/firestore';
import { db } from './firebase';

// Profile operations
export async function createProfile(userId: string, data: {
  email: string;
  name: string;
  role: string;
}) {
  try {
    await setDoc(doc(db, 'profiles', userId), {
      ...data,
      createdAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

export async function getProfile(userId: string) {
  try {
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
}

// Teacher operations
export async function createTeacherProfile(teacherId: string, data: {
  subjects: string[];
  classes: string[];
}) {
  try {
    await setDoc(doc(db, 'teachers', teacherId), {
      ...data,
      availability: {}
    });
    return true;
  } catch (error) {
    console.error('Error creating teacher profile:', error);
    throw error;
  }
}

export async function updateTeacherAvailability(teacherId: string, date: string, timeSlot: {
  startTime: string;
  endTime: string;
}) {
  try {
    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, {
      [`availability.${date}`]: timeSlot
    });
    return true;
  } catch (error) {
    console.error('Error updating teacher availability:', error);
    throw error;
  }
}

// Student operations
export async function createStudentProfile(studentId: string, data: {
  enrolledClasses: string[];
}) {
  try {
    await setDoc(doc(db, 'students', studentId), {
      ...data,
      bookings: []
    });
    return true;
  } catch (error) {
    console.error('Error creating student profile:', error);
    throw error;
  }
}

export async function createBooking(studentId: string, bookingData: {
  classId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}) {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    if (!studentDoc.exists()) throw new Error('Student not found');

    const currentBookings = studentDoc.data().bookings || [];
    await updateDoc(studentRef, {
      bookings: [...currentBookings, bookingData]
    });
    return true;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Class operations
export async function createClass(classData: {
  teacherId: string;
  subject: string;
  name: string;
  description: string;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  maxStudents: number;
}) {
  try {
    const classesRef = collection(db, 'classes');
    const newClassRef = doc(classesRef);
    await setDoc(newClassRef, {
      ...classData,
      currentStudents: 0
    });
    return newClassRef.id;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
}

export async function getClassesByTeacher(teacherId: string) {
  try {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting teacher classes:', error);
    throw error;
  }
}

export async function getClassesByStudent(studentId: string) {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    if (!studentDoc.exists()) return [];

    const enrolledClasses = studentDoc.data().enrolledClasses;
    const classes = await Promise.all(
      enrolledClasses.map(async (classId: string) => {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        return classDoc.exists() ? {
          id: classDoc.id,
          ...classDoc.data()
        } : null;
      })
    );

    return classes.filter(Boolean);
  } catch (error) {
    console.error('Error getting student classes:', error);
    throw error;
  }
} 