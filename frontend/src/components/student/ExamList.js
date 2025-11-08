import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function ExamList() {
  const [exams, setExams] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
    const interval = setInterval(loadExams, 30000); // Her 30 saniyede bir yenile
    return () => clearInterval(interval);
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/exams');
      setExams(response.data.exams || []);
      setUpcomingExams(response.data.upcoming_exams || []);
    } catch (err) {
      console.error('Sınavlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/student/exams/${examId}/taking`);
  };

  const handleViewResult = (examId) => {
    navigate(`/student/exams/${examId}/result`);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    // İstanbul saatine göre formatla
    return new Date(dateString).toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return React.createElement('div', { className: 'exam-list' },
    React.createElement('h1', null, 'Sınavlar'),
    loading ? React.createElement('p', null, 'Yükleniyor...') :
    React.createElement(React.Fragment, null,
      // Aktif Sınavlar
      React.createElement('div', { style: { marginBottom: '3rem' } },
        React.createElement('h2', { style: { marginBottom: '1rem', color: '#667eea' } }, 'Aktif Sınavlar'),
        React.createElement('div', { className: 'exams-grid' },
          exams.length === 0 ?
            React.createElement('p', { style: { color: '#666' } }, 'Şu anda aktif sınav bulunmamaktadır') :
            exams.map(exam =>
              React.createElement('div', { key: exam.id, className: 'exam-card' },
                React.createElement('h3', null, exam.course?.code || 'Bilinmeyen Ders'),
                React.createElement('p', null, exam.course?.name || ''),
                React.createElement('p', { className: 'exam-type' }, `Sınav Tipi: ${exam.exam_type}`),
                exam.course?.instructor && React.createElement('p', { style: { color: '#666', fontSize: '0.9rem' } }, 
                  `Öğretim Üyesi: ${exam.course.instructor.name || exam.course.instructor.email}`
                ),
                React.createElement('p', null, `Başlangıç: ${formatDateTime(exam.start_time)}`),
                React.createElement('p', null, `Bitiş: ${formatDateTime(exam.end_time)}`),
                React.createElement('p', null, `Süre: ${exam.duration_minutes} dakika`),
                exam.can_start && React.createElement('button', {
                  className: 'btn btn-primary',
                  onClick: () => handleStartExam(exam.id)
                }, 'Sınava Başla'),
                exam.already_taken && React.createElement('button', {
                  className: 'btn btn-secondary',
                  onClick: () => handleViewResult(exam.id)
                }, 'Sonucu Görüntüle'),
                exam.in_progress && React.createElement('button', {
                  className: 'btn btn-warning',
                  onClick: () => handleStartExam(exam.id)
                }, 'Devam Et')
              )
            )
        )
      ),
      // Yaklaşan Sınavlar
      React.createElement('div', null,
        React.createElement('h2', { style: { marginBottom: '1rem', color: '#667eea' } }, 'Yaklaşan Sınavlar'),
        React.createElement('div', { className: 'exams-grid' },
          upcomingExams.length === 0 ?
            React.createElement('p', { style: { color: '#666' } }, 'Yaklaşan sınav bulunmamaktadır') :
            upcomingExams.map(exam =>
              React.createElement('div', { 
                key: exam.id, 
                className: 'exam-card',
                style: { opacity: 0.85, border: '2px dashed #ccc' }
              },
                React.createElement('h3', null, exam.course?.code || 'Bilinmeyen Ders'),
                React.createElement('p', null, exam.course?.name || ''),
                React.createElement('p', { className: 'exam-type' }, `Sınav Tipi: ${exam.exam_type}`),
                exam.course?.instructor && React.createElement('p', { style: { color: '#666', fontSize: '0.9rem' } }, 
                  `Öğretim Üyesi: ${exam.course.instructor.name || exam.course.instructor.email}`
                ),
                React.createElement('p', { style: { fontWeight: 'bold', color: '#667eea' } }, 
                  `Başlangıç: ${formatDateTime(exam.start_time)}`
                ),
                React.createElement('p', null, `Bitiş: ${formatDateTime(exam.end_time)}`),
                React.createElement('p', null, `Süre: ${exam.duration_minutes} dakika`),
                React.createElement('p', { 
                  style: { 
                    marginTop: '1rem', 
                    padding: '0.5rem', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#856404'
                  } 
                }, '⏰ Sınav henüz başlamadı. Sınav zamanı geldiğinde buradan giriş yapabilirsiniz.')
              )
            )
        )
      )
    )
  );
}

export default ExamList;

