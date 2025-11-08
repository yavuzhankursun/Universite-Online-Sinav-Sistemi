import React, { useState, useEffect } from 'react';
import { getMyCourses, createExam, getMyExams, addQuestion, updateExamTime } from '../../services/instructorService';
import api from '../../services/api';

function ExamCreation() {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examForm, setExamForm] = useState({
    course_id: '',
    exam_type: 'vize',
    start_time: '',
    end_time: '',
    duration_minutes: 10,
    weight_percentage: 50
  });

  // Sınav oluşturma formu için süre hesaplama
  useEffect(() => {
    if (examForm.start_time && examForm.end_time) {
      const start = new Date(examForm.start_time);
      const end = new Date(examForm.end_time);
      if (end > start) {
        const diffMs = end - start;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        setExamForm(prev => ({ ...prev, duration_minutes: diffMinutes }));
      }
    }
  }, [examForm.start_time, examForm.end_time]);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    points: 1.0,
    answer_options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examTimeForm, setExamTimeForm] = useState({
    start_time: '',
    end_time: '',
    duration_minutes: 10
  });
  const [istanbulTime, setIstanbulTime] = useState(null);

  useEffect(() => {
    loadData();
    loadIstanbulTime();
    // Her 30 saniyede bir İstanbul saatini güncelle
    const interval = setInterval(loadIstanbulTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadIstanbulTime = async () => {
    try {
      const response = await api.get('/auth/time');
      setIstanbulTime(response.data.istanbul_time);
    } catch (err) {
      console.error('İstanbul saati alınamadı:', err);
      // Fallback: tarayıcı saatini kullan
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year').value;
      const month = parts.find(p => p.type === 'month').value;
      const day = parts.find(p => p.type === 'day').value;
      const hours = parts.find(p => p.type === 'hour').value;
      const minutes = parts.find(p => p.type === 'minute').value;
      setIstanbulTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  };

  // Başlangıç ve bitiş zamanına göre süreyi otomatik hesapla
  useEffect(() => {
    if (examTimeForm.start_time && examTimeForm.end_time) {
      const start = new Date(examTimeForm.start_time);
      const end = new Date(examTimeForm.end_time);
      if (end > start) {
        const diffMs = end - start;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        setExamTimeForm(prev => ({ ...prev, duration_minutes: diffMinutes }));
      }
    }
  }, [examTimeForm.start_time, examTimeForm.end_time]);

  // Minimum tarih (backend'den gelen İstanbul saati)
  const getMinDateTime = () => {
    if (istanbulTime) {
      return istanbulTime;
    }
    // Fallback: tarayıcı saatini kullan
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const hours = parts.find(p => p.type === 'hour').value;
    const minutes = parts.find(p => p.type === 'minute').value;
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadData = async () => {
    try {
      const [coursesData, examsData] = await Promise.all([
        getMyCourses(),
        getMyExams()
      ]);
      setCourses(coursesData);
      setExams(examsData);
    } catch (err) {
      setError('Veriler yüklenemedi');
    }
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await createExam(examForm);
      setSuccess('Sınav başarıyla oluşturuldu');
      setExamForm({
        course_id: '',
        exam_type: 'vize',
        start_time: '',
        end_time: '',
        duration_minutes: 10,
        weight_percentage: 50
      });
      setSelectedExam(data.exam);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Sınav oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setQuestionForm({
      ...questionForm,
      answer_options: [...questionForm.answer_options, { option_text: '', is_correct: false }]
    });
  };

  const handleEditExamTime = (exam) => {
    setEditingExam(exam);
    // Veritabanındaki UTC zamanını İstanbul saatine çevir ve datetime-local formatına dönüştür
    // datetime-local input'u tarayıcının yerel saatine göre çalışır, ama biz bunu
    // İstanbul saati olarak göstermeliyiz
    const formatForInput = (dateString) => {
      // UTC zamanını İstanbul saatine çevir
      const date = new Date(dateString);
      // İstanbul saatine göre formatla - daha güvenilir yöntem
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(date);
      const year = parts.find(p => p.type === 'year').value;
      const month = parts.find(p => p.type === 'month').value;
      const day = parts.find(p => p.type === 'day').value;
      const hours = parts.find(p => p.type === 'hour').value;
      const minutes = parts.find(p => p.type === 'minute').value;
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setExamTimeForm({
      start_time: formatForInput(exam.start_time),
      end_time: formatForInput(exam.end_time),
      duration_minutes: exam.duration_minutes
    });
    setError('');
    setSuccess('');
  };

  // Input'tan gelen datetime-local değerini İstanbul saati olarak yorumla
  // datetime-local input'u tarayıcının yerel saatine göre çalışır, ama biz bunu
  // İstanbul saati olarak kabul etmek istiyoruz
  const parseAsIstanbulTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    // Input formatı: "YYYY-MM-DDTHH:mm"
    // Bunu İstanbul saati olarak yorumlayıp UTC'ye çevirmek için
    // Önce naive datetime oluştur, sonra İstanbul timezone'u ekle
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // İstanbul saati olarak oluştur (UTC+3)
    const istanbulDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
    // UTC+3 offset'ini çıkar (İstanbul saati UTC'den 3 saat ileri)
    istanbulDate.setUTCHours(istanbulDate.getUTCHours() - 3);
    
    // ISO formatına çevir (backend parse edebilsin)
    return istanbulDate.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  };

  const handleUpdateExamTime = async (e) => {
    e.preventDefault();
    if (!editingExam) return;
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Input'tan gelen değerleri İstanbul saati olarak yorumla
      // datetime-local input'u tarayıcının yerel saatine göre çalışır
      // Ama biz bunu İstanbul saati olarak kabul etmek istiyoruz
      // Çözüm: Input'tan gelen değeri İstanbul saati olarak yorumlayıp backend'e gönderiyoruz
      
      // DEBUG: Frontend'den gönderilen değerleri logla
      console.log('[DEBUG] Frontend - Gönderilen start_time:', examTimeForm.start_time);
      console.log('[DEBUG] Frontend - Gönderilen end_time:', examTimeForm.end_time);
      
      const formData = {
        start_time: examTimeForm.start_time, // Backend zaten İstanbul saati olarak parse edecek
        end_time: examTimeForm.end_time,     // Backend zaten İstanbul saati olarak parse edecek
        duration_minutes: examTimeForm.duration_minutes
      };
      
      await updateExamTime(editingExam.id, formData);
      setSuccess('Sınav zamanı başarıyla güncellendi');
      setEditingExam(null);
      setExamTimeForm({ start_time: '', end_time: '', duration_minutes: 10 });
      loadData();
      // İstanbul saatini yeniden yükle
      loadIstanbulTime();
    } catch (err) {
      setError(err.response?.data?.error || 'Sınav zamanı güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    // Backend'den gelen zaman artık UTC olarak 'Z' ile biter (örn: "2025-11-08T10:25:00Z")
    // Eğer 'Z' yoksa (eski veriler için), UTC olarak kabul et
    const date = dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)
      ? new Date(dateString)
      : new Date(dateString + 'Z');
    
    // İstanbul saatine göre formatla
    return date.toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExam) {
      setError('Önce bir sınav seçin');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await addQuestion(selectedExam.id, questionForm);
      setSuccess('Soru başarıyla eklendi');
      setQuestionForm({
        question_text: '',
        points: 1.0,
        answer_options: [
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Soru eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'exam-creation' },
    React.createElement('h1', null, 'Sınav Oluşturma'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Yeni Sınav Oluştur'),
      error && React.createElement('div', { className: 'error-message' }, error),
      success && React.createElement('div', { className: 'success-message' }, success),
      React.createElement('form', { onSubmit: handleExamSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Ders'),
          React.createElement('select', {
            value: examForm.course_id,
            onChange: (e) => setExamForm({ ...examForm, course_id: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Ders Seçin'),
            courses.map(course =>
              React.createElement('option', { key: course.id, value: course.id },
                `${course.code} - ${course.name}`
              )
            )
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Sınav Tipi'),
          React.createElement('select', {
            value: examForm.exam_type,
            onChange: (e) => setExamForm({ ...examForm, exam_type: e.target.value })
          },
            React.createElement('option', { value: 'vize' }, 'Vize'),
            React.createElement('option', { value: 'final' }, 'Final')
          )
        ),
        React.createElement('div', { className: 'form-row' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Başlangıç Zamanı'),
            React.createElement('input', {
              type: 'datetime-local',
              value: examForm.start_time,
              onChange: (e) => setExamForm({ ...examForm, start_time: e.target.value }),
              min: getMinDateTime(),
              required: true,
              step: 60
            }),
            React.createElement('small', { style: { color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' } },
              istanbulTime ? `🕐 Şu anki İstanbul saati: ${istanbulTime.replace('T', ' ')}` : '⚠ Lütfen İstanbul saatine göre girin (UTC+3)'
            )
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Bitiş Zamanı'),
            React.createElement('input', {
              type: 'datetime-local',
              value: examForm.end_time,
              onChange: (e) => setExamForm({ ...examForm, end_time: e.target.value }),
              min: examForm.start_time || getMinDateTime(),
              required: true,
              step: 60
            }),
            React.createElement('small', { style: { color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' } },
              istanbulTime ? `🕐 Şu anki İstanbul saati: ${istanbulTime.replace('T', ' ')}` : '⚠ Lütfen İstanbul saatine göre girin (UTC+3)'
            )
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Süre (dakika)'),
            React.createElement('input', {
              type: 'number',
              value: examForm.duration_minutes,
              readOnly: true,
              style: { backgroundColor: '#f5f5f5', cursor: 'not-allowed' },
              min: 1
            }),
            React.createElement('small', { style: { color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' } },
              'Süre otomatik olarak başlangıç ve bitiş zamanına göre hesaplanır'
            )
          )
        ),
        React.createElement('div', { className: 'form-row' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Ağırlık (%)'),
            React.createElement('input', {
              type: 'number',
              value: examForm.weight_percentage,
              onChange: (e) => setExamForm({ ...examForm, weight_percentage: parseFloat(e.target.value) }),
              min: 0,
              max: 100,
              step: 0.1,
              required: true
            })
          )
        ),
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: loading
        }, loading ? 'Oluşturuluyor...' : 'Sınav Oluştur')
      )
    ),
    exams.length > 0 && React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('h2', null, 'Sınavlara Soru Ekle'),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', null, 'Sınav Seçin'),
        React.createElement('select', {
          value: selectedExam?.id || '',
          onChange: (e) => {
            const exam = exams.find(ex => ex.id === parseInt(e.target.value));
            setSelectedExam(exam);
          }
        },
          React.createElement('option', { value: '' }, 'Sınav Seçin'),
          exams.map(exam =>
            React.createElement('option', { key: exam.id, value: exam.id },
              `${exam.course?.code} - ${exam.exam_type}`
            )
          )
        )
      ),
      selectedExam && React.createElement('form', { onSubmit: handleQuestionSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Soru Metni'),
          React.createElement('textarea', {
            value: questionForm.question_text,
            onChange: (e) => setQuestionForm({ ...questionForm, question_text: e.target.value }),
            rows: 4,
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Puan'),
          React.createElement('input', {
            type: 'number',
            value: questionForm.points,
            onChange: (e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) }),
            min: 0.1,
            step: 0.1,
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Cevap Seçenekleri'),
          questionForm.answer_options.map((option, index) =>
            React.createElement('div', { key: index, className: 'answer-option' },
              React.createElement('input', {
                type: 'text',
                value: option.option_text,
                onChange: (e) => {
                  const newOptions = [...questionForm.answer_options];
                  newOptions[index].option_text = e.target.value;
                  setQuestionForm({ ...questionForm, answer_options: newOptions });
                },
                placeholder: `Seçenek ${index + 1}`,
                required: true
              }),
              React.createElement('label', { className: 'checkbox-label' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: option.is_correct,
                  onChange: (e) => {
                    const newOptions = [...questionForm.answer_options];
                    newOptions[index].is_correct = e.target.checked;
                    setQuestionForm({ ...questionForm, answer_options: newOptions });
                  }
                }),
                'Doğru Cevap'
              )
            )
          ),
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onClick: handleAddOption
          }, 'Seçenek Ekle')
        ),
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: loading
        }, loading ? 'Ekleniyor...' : 'Soru Ekle')
      )
    ),
    // Sınav Zamanı Düzenleme Bölümü
    exams.length > 0 && React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('h2', null, 'Sınav Zamanlarını Düzenle'),
      error && React.createElement('div', { className: 'error-message' }, error),
      success && React.createElement('div', { className: 'success-message' }, success),
      React.createElement('div', { className: 'exams-list', style: { marginBottom: '1rem' } },
        exams.map(exam =>
          React.createElement('div', {
            key: exam.id,
            className: 'exam-item',
            style: {
              padding: '1rem',
              marginBottom: '0.5rem',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          },
            React.createElement('div', null,
              React.createElement('strong', null, `${exam.course?.code || 'Bilinmeyen'} - ${exam.exam_type}`),
              React.createElement('p', { style: { margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' } },
                `Başlangıç: ${formatDateTime(exam.start_time)} | Bitiş: ${formatDateTime(exam.end_time)}`
              )
            ),
            React.createElement('button', {
              className: 'btn btn-secondary btn-small',
              onClick: () => handleEditExamTime(exam),
              disabled: loading || editingExam?.id === exam.id
            }, editingExam?.id === exam.id ? 'Düzenleniyor...' : 'Zamanı Düzenle')
          )
        )
      ),
      editingExam && React.createElement('form', { onSubmit: handleUpdateExamTime, style: { marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' } },
        React.createElement('h3', { style: { marginBottom: '1rem' } }, 
          `${editingExam.course?.code || 'Bilinmeyen'} - ${editingExam.exam_type} Sınav Zamanını Düzenle`
        ),
        React.createElement('div', { className: 'form-row' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Başlangıç Zamanı'),
            React.createElement('input', {
              type: 'datetime-local',
              value: examTimeForm.start_time,
              onChange: (e) => {
                // Input'tan gelen değer zaten "YYYY-MM-DDTHH:mm" formatında
                // Bu değeri direkt kullanıyoruz, backend İstanbul saati olarak parse edecek
                const newStartTime = e.target.value;
                setExamTimeForm(prev => ({ ...prev, start_time: newStartTime }));
              },
              min: getMinDateTime(),
              required: true,
              step: 60 // Saniye hassasiyeti
            }),
            React.createElement('small', { style: { color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' } },
              istanbulTime ? `🕐 Şu anki İstanbul saati: ${istanbulTime.replace('T', ' ')}` : '⚠ Lütfen İstanbul saatine göre girin (UTC+3)'
            )
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Bitiş Zamanı'),
            React.createElement('input', {
              type: 'datetime-local',
              value: examTimeForm.end_time,
              onChange: (e) => {
                // Input'tan gelen değer zaten "YYYY-MM-DDTHH:mm" formatında
                // Bu değeri direkt kullanıyoruz, backend İstanbul saati olarak parse edecek
                const newEndTime = e.target.value;
                setExamTimeForm(prev => ({ ...prev, end_time: newEndTime }));
              },
              min: examTimeForm.start_time || getMinDateTime(),
              required: true,
              step: 60 // Saniye hassasiyeti
            }),
            React.createElement('small', { style: { color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' } },
              istanbulTime ? `🕐 Şu anki İstanbul saati: ${istanbulTime.replace('T', ' ')}` : '⚠ Lütfen İstanbul saatine göre girin (UTC+3)'
            )
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Süre (dakika)'),
            React.createElement('input', {
              type: 'number',
              value: examTimeForm.duration_minutes,
              readOnly: true,
              style: { backgroundColor: '#f5f5f5', cursor: 'not-allowed' },
              min: 1
            }),
            React.createElement('small', { style: { color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' } },
              'Süre otomatik olarak başlangıç ve bitiş zamanına göre hesaplanır'
            )
          )
        ),
        React.createElement('div', { style: { marginTop: '1rem' } },
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary',
            disabled: loading
          }, loading ? 'Güncelleniyor...' : 'Zamanı Güncelle'),
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onClick: () => {
              setEditingExam(null);
              setExamTimeForm({ start_time: '', end_time: '', duration_minutes: 10 });
              setError('');
              setSuccess('');
            },
            style: { marginLeft: '0.5rem' },
            disabled: loading
          }, 'İptal')
        )
      )
    )
  );
}

export default ExamCreation;

