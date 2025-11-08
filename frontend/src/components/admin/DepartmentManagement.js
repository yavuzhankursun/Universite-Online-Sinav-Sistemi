import React, { useState, useEffect } from 'react';
import { createDepartment, getDepartments, deleteDepartment } from '../../services/adminService';

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Departmanlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await createDepartment(formData.name, formData.code);
      setSuccess('Departman başarıyla oluşturuldu');
      setFormData({ name: '', code: '' });
      loadDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Departman oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm('Bu departmanı silmek istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await deleteDepartment(departmentId);
      setSuccess(response.message || 'Departman başarıyla silindi');
      loadDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Departman silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'department-management' },
    React.createElement('h1', null, 'Departman Yönetimi'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Yeni Departman Ekle'),
      error && React.createElement('div', { className: 'error-message' }, error),
      success && React.createElement('div', { className: 'success-message' }, success),
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Departman Adı'),
          React.createElement('input', {
            type: 'text',
            value: formData.name,
            onChange: (e) => setFormData({ ...formData, name: e.target.value }),
            required: true,
            placeholder: 'Örn: Bilgisayar Mühendisliği'
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Departman Kodu'),
          React.createElement('input', {
            type: 'text',
            value: formData.code,
            onChange: (e) => setFormData({ ...formData, code: e.target.value.toUpperCase() }),
            required: true,
            placeholder: 'Örn: BM'
          })
        ),
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: loading
        }, loading ? 'Ekleniyor...' : 'Departman Ekle')
      )
    ),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Departman Listesi'),
      loading ? React.createElement('p', null, 'Yükleniyor...') :
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'ID'),
            React.createElement('th', null, 'Kod'),
            React.createElement('th', null, 'Ad'),
            React.createElement('th', null, 'İşlemler')
          )
        ),
        React.createElement('tbody', null,
          departments.length === 0 ?
            React.createElement('tr', null,
              React.createElement('td', { colSpan: 4 }, 'Henüz departman yok')
            ) :
            departments.map(dept =>
              React.createElement('tr', { key: dept.id },
                React.createElement('td', null, dept.id),
                React.createElement('td', null, dept.code),
                React.createElement('td', null, dept.name),
                React.createElement('td', null,
                  React.createElement('button', {
                    className: 'btn btn-danger btn-small',
                    onClick: () => handleDelete(dept.id),
                    disabled: loading
                  }, 'Sil')
                )
              )
            )
        )
      )
    )
  );
}

export default DepartmentManagement;

