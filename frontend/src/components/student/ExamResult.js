import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamResult } from '../../services/studentService';

function ExamResult() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResult();
  }, [examId]);

  const loadResult = async () => {
    setLoading(true);
    try {
      const data = await getExamResult(parseInt(examId));
      setResult(data);
    } catch (err) {
      console.error('Sonuç yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'exam-result' },
      React.createElement('p', null, 'Yükleniyor...')
    );
  }

  if (!result) {
    return React.createElement('div', { className: 'exam-result' },
      React.createElement('p', null, 'Sonuç bulunamadı')
    );
  }

  return React.createElement('div', { className: 'exam-result' },
    React.createElement('h1', null, 'Sınav Sonucu'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, result.exam?.course?.code || 'Sınav'),
      React.createElement('div', { className: 'result-summary' },
        React.createElement('div', { className: 'result-item' },
          React.createElement('strong', null, 'Puanınız: '),
          `${result.my_result.score} / ${result.my_result.max_score}`
        ),
        React.createElement('div', { className: 'result-item' },
          React.createElement('strong', null, 'Yüzdeniz: '),
          `${result.my_result.percentage}%`
        )
      )
    ),
    React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('h2', null, 'Genel İstatistikler'),
      React.createElement('div', { className: 'statistics' },
        React.createElement('div', { className: 'stat-item' },
          React.createElement('strong', null, 'Ortalama Puan: '),
          `${result.statistics.average_score} / ${result.my_result.max_score}`
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('strong', null, 'Ortalama Yüzde: '),
          `${result.statistics.average_percentage}%`
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('strong', null, 'Toplam Katılımcı: '),
          result.statistics.total_participants
        )
      )
    ),
    React.createElement('button', {
      className: 'btn btn-primary',
      onClick: () => navigate('/student/exams'),
      style: { marginTop: '2rem' }
    }, 'Sınav Listesine Dön')
  );
}

export default ExamResult;

