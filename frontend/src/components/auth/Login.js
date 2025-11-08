import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { login } from '../../services/authService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const { login: setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Test kullanıcıları
  const testUsers = [
    { role: 'Admin', email: 'admin@university.edu', password: 'admin123', name: 'Sistem Yöneticisi' },
    { role: 'Bölüm Başkanı', email: 'bolumbaskani@university.edu', password: 'bolumbaskani123', name: 'Prof. Dr. Ahmet Yılmaz' },
    { role: 'Öğretim Üyesi 1', email: 'ogretimuyesi1@university.edu', password: 'ogretimuyesi123', name: 'Doç. Dr. Mehmet Demir' },
    { role: 'Öğretim Üyesi 2', email: 'ogretimuyesi2@university.edu', password: 'ogretimuyesi123', name: 'Dr. Öğr. Üyesi Ayşe Kaya' },
    { role: 'Öğrenci 1', email: 'ogrenci1@university.edu', password: 'ogrenci123', name: 'Ali Veli' },
    { role: 'Öğrenci 2', email: 'ogrenci2@university.edu', password: 'ogrenci123', name: 'Fatma Yılmaz' },
    { role: 'Öğrenci 3', email: 'ogrenci3@university.edu', password: 'ogrenci123', name: 'Mustafa Özkan' },
    { role: 'Öğrenci 4', email: 'ogrenci4@university.edu', password: 'ogrenci123', name: 'Zeynep Şahin' },
    { role: 'Öğrenci 5', email: 'ogrenci5@university.edu', password: 'ogrenci123', name: 'Emre Kaya' },
    { role: 'Öğrenci 6', email: 'ogrenci6@university.edu', password: 'ogrenci123', name: 'Elif Demir' },
    { role: 'Öğrenci 7', email: 'ogrenci7@university.edu', password: 'ogrenci123', name: 'Can Yıldız' },
    { role: 'Öğrenci 8', email: 'ogrenci8@university.edu', password: 'ogrenci123', name: 'Seda Arslan' },
    { role: 'Öğrenci 9', email: 'ogrenci9@university.edu', password: 'ogrenci123', name: 'Burak Çelik' },
    { role: 'Öğrenci 10', email: 'ogrenci10@university.edu', password: 'ogrenci123', name: 'Ayşe Doğan' }
  ];

  const handleUserClick = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      setUser(data.user);
      
      // Rol bazlı yönlendirme
      const roleRoutes = {
        admin: '/admin',
        instructor: '/instructor',
        student: '/student',
        department_head: '/department-head'
      };
      
      navigate(roleRoutes[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'login-container' },
    React.createElement('div', { className: 'login-card' },
      React.createElement('h1', null, 'Üniversite Online Sınav Sistemi'),
      React.createElement('h2', null, 'Kocaeli Sağlık ve Teknoloji Üniversitesi'),
      React.createElement('div', { className: 'test-users-info' },
        React.createElement('button', {
          type: 'button',
          className: 'btn btn-secondary btn-small test-users-toggle',
          onClick: () => setShowUsers(!showUsers)
        }, showUsers ? '▼ Kullanıcıları Gizle' : '▶ Test Kullanıcılarını Göster'),
        showUsers && React.createElement('div', { className: 'test-users-list' },
          React.createElement('p', { className: 'test-users-info-text' }, 
            'Test için hazırlanmış kullanıcılar (tıklayarak otomatik doldur):'
          ),
          testUsers.map((user, index) =>
            React.createElement('div', {
              key: index,
              className: 'test-user-item',
              onClick: () => handleUserClick(user.email, user.password)
            },
              React.createElement('strong', null, `${user.role}:`),
              ' ',
              React.createElement('span', { className: 'test-user-email' }, user.email),
              ' / ',
              React.createElement('span', { className: 'test-user-password' }, user.password),
              user.name && React.createElement('span', { className: 'test-user-name' }, `(${user.name})`)
            )
          )
        )
      ),
      React.createElement('form', { onSubmit: handleSubmit },
        error && React.createElement('div', { className: 'error-message' }, error),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'email' }, 'Email'),
          React.createElement('input', {
            type: 'email',
            id: 'email',
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            placeholder: 'Email adresiniz'
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'password' }, 'Şifre'),
          React.createElement('input', {
            type: 'password',
            id: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            required: true,
            placeholder: 'Şifreniz'
          })
        ),
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: loading
        }, loading ? 'Giriş yapılıyor...' : 'Giriş Yap')
      )
    )
  );
}

export default Login;

