import React, { useState, useEffect } from 'react';
import { createUser, getUsers, deleteUser } from '../../services/adminService';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcılar yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await createUser(formData.name, formData.email, formData.password, formData.role);
      setSuccess(response.message || 'Kullanıcı başarıyla oluşturuldu');
      if (response.warnings && response.warnings.length > 0) {
        setError(response.warnings.join(', '));
      }
      setFormData({ name: '', email: '', password: '', role: 'student' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userRole) => {
    if (!window.confirm(`Bu ${userRole === 'student' ? 'öğrenciyi' : userRole === 'instructor' ? 'öğretim üyesini' : 'kullanıcıyı'} silmek istediğinize emin misiniz?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await deleteUser(userId);
      setSuccess(response.message || 'Kullanıcı başarıyla silindi');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'user-management' },
    React.createElement('h1', null, 'Kullanıcı Yönetimi'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Yeni Kullanıcı Ekle'),
      error && React.createElement('div', { className: 'error-message' }, error),
      success && React.createElement('div', { className: 'success-message' }, success),
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'İsim'),
          React.createElement('input', {
            type: 'text',
            value: formData.name,
            onChange: (e) => setFormData({ ...formData, name: e.target.value }),
            placeholder: 'Örn: Ali Veli, Doç. Dr. Mehmet Demir'
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Email'),
          React.createElement('input', {
            type: 'email',
            value: formData.email,
            onChange: (e) => setFormData({ ...formData, email: e.target.value }),
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Şifre'),
          React.createElement('input', {
            type: 'password',
            value: formData.password,
            onChange: (e) => setFormData({ ...formData, password: e.target.value }),
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Rol'),
          React.createElement('select', {
            value: formData.role,
            onChange: (e) => setFormData({ ...formData, role: e.target.value })
          },
            React.createElement('option', { value: 'student' }, 'Öğrenci'),
            React.createElement('option', { value: 'instructor' }, 'Öğretim Üyesi'),
            React.createElement('option', { value: 'department_head' }, 'Bölüm Başkanı')
          )
        ),
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: loading
        }, loading ? 'Ekleniyor...' : 'Kullanıcı Ekle')
      )
    ),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Kullanıcı Listesi'),
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'ID'),
            React.createElement('th', null, 'İsim'),
            React.createElement('th', null, 'Email'),
            React.createElement('th', null, 'Rol'),
            React.createElement('th', null, 'İşlemler')
          )
        ),
        React.createElement('tbody', null,
          users.map(user =>
            React.createElement('tr', { key: user.id },
              React.createElement('td', null, user.id),
              React.createElement('td', null, user.name || user.email),
              React.createElement('td', null, user.email),
              React.createElement('td', null, user.role),
              React.createElement('td', null,
                user.role !== 'admin' && React.createElement('button', {
                  className: 'btn btn-danger btn-small',
                  onClick: () => handleDelete(user.id, user.role),
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

export default UserManagement;

