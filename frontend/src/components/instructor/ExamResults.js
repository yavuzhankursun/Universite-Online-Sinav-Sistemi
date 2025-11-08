import React, { useState, useEffect } from 'react';
import { getMyExams, getExamResults } from '../../services/instructorService';

function ExamResults() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await getMyExams();
      setExams(data);
    } catch (err) {
      console.error('Sınavlar yüklenemedi:', err);
    }
  };

  const handleExamSelect = async (examId) => {
    setLoading(true);
    try {
      const data = await getExamResults(examId);
      setSelectedExam(data.exam);
      setResults(data);
    } catch (err) {
      console.error('Sonuçlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'exam-results' },
    React.createElement('h1', null, 'Sınav Sonuçları'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Sınav Seçin'),
      React.createElement('select', {
        value: selectedExam?.id || '',
        onChange: (e) => {
          const examId = parseInt(e.target.value);
          if (examId) {
            handleExamSelect(examId);
          }
        },
        className: 'form-control'
      },
        React.createElement('option', { value: '' }, 'Sınav Seçin'),
        exams.map(exam =>
          React.createElement('option', { key: exam.id, value: exam.id },
            `${exam.course?.code} - ${exam.exam_type}`
          )
        )
      )
    ),
    results && React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('h2', null, 'İstatistikler'),
      loading ? React.createElement('p', null, 'Yükleniyor...') :
      React.createElement('div', { className: 'statistics' },
        React.createElement('div', { className: 'stat-item' },
          React.createElement('strong', null, 'Toplam Katılım: '),
          results.statistics.total_attempts
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('strong', null, 'Ortalama Puan: '),
          `${results.statistics.average_score} / ${results.statistics.max_score}`
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('strong', null, 'Ortalama Yüzde: '),
          `${results.statistics.average_percentage}%`
        )
      ),
      React.createElement('h3', { style: { marginTop: '2rem' } }, 'Öğrenci Sonuçları'),
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'Öğrenci Email'),
            React.createElement('th', null, 'Puan'),
            React.createElement('th', null, 'Yüzde'),
            React.createElement('th', null, 'Gönderim Zamanı')
          )
        ),
        React.createElement('tbody', null,
          results.student_results.length === 0 ?
            React.createElement('tr', null,
              React.createElement('td', { colSpan: 4 }, 'Henüz sonuç yok')
            ) :
            results.student_results.map((result, index) =>
              React.createElement('tr', { key: index },
                React.createElement('td', null, result.student.email),
                React.createElement('td', null, `${result.score} / ${result.max_score}`),
                React.createElement('td', null, `${result.percentage}%`),
                React.createElement('td', null,
                  result.submitted_at ? new Date(result.submitted_at).toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'
                )
              )
            )
        )
      )
    )
  );
}

export default ExamResults;

