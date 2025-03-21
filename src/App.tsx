import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherMessages from './pages/teacher/Messages';
import TeacherAppointments from './pages/teacher/Appointments';
import StudentDashboard from './pages/student/Dashboard';
import StudentMessages from './pages/student/Messages';
import StudentAppointments from './pages/student/Appointments';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/messages" element={<TeacherMessages />} />
              <Route path="/teacher/appointments" element={<TeacherAppointments />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/messages" element={<StudentMessages />} />
              <Route path="/student/appointments" element={<StudentAppointments />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;