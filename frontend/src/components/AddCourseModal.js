import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

function AddCourseModal({ onClose, onSuccess, currentStudent }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await axios.get('/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create enrollment
      const enrollmentData = {
        student_id: currentStudent.id,
        course_codes: [selectedCourse]
      };

      await axios.post('/enrollments/', enrollmentData);
      
      setSuccess('Successfully enrolled in course!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to enroll in course');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Add Course
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Choose a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.course_code}>
                {course.course_code} - {course.course_name} ({course.credits} credits)
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Course Details:</h4>
            {(() => {
              const course = courses.find(c => c.course_code === selectedCourse);
              return course ? (
                <div className="text-sm text-gray-600">
                  <p><strong>Name:</strong> {course.course_name}</p>
                  <p><strong>Credits:</strong> {course.credits}</p>
                  <p><strong>Department:</strong> {course.department}</p>
                  <p><strong>Description:</strong> {course.description || 'No description'}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={loading || !selectedCourse}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enrolling...' : 'Enroll'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCourseModal;
