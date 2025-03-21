export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  name: string;
  department: string;
  subjects: string[];
  created_at: string;
}

export interface Appointment {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'cancelled';
  message: string;
  created_at: string;
}

export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  created_at: string;
}