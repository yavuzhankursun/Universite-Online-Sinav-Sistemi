import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleNames = {
    admin: 'Admin',
    instructor: 'Öğretim Üyesi',
    student: 'Öğrenci',
    department_head: 'Bölüm Başkanı'
  };

  return React.createElement('nav', { className: 'navbar' },
    React.createElement('div', { className: 'navbar-brand' },
      React.createElement('h2', null, 'Online Sınav Sistemi')
    ),
    React.createElement('div', { className: 'navbar-menu' },
      React.createElement('span', { className: 'user-info' },
        `${user?.name || user?.email} (${roleNames[user?.role] || user?.role})`
      ),
      React.createElement('button', {
        className: 'btn btn-secondary',
        onClick: handleLogout
      }, 'Çıkış Yap')
    )
  );
}

export default Navbar;

