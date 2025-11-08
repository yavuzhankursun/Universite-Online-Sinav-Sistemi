import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - JWT token ekle
api.interceptors.request.use(
  (config) => {
    // Login endpoint'i için token gerekmez
    if (config.url && config.url.includes('/auth/login')) {
      return config;
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      // Token'ı temizle (gereksiz boşlukları kaldır)
      const cleanToken = token.trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log('Token added to request:', config.url, cleanToken.substring(0, 20) + '...');
    } else {
      console.warn('Token bulunamadı, istek token olmadan gönderiliyor:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 ve 422 hataları durumunda logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.error || '';
      
      console.error(`API Error [${status}]:`, errorMsg);
      console.error('Response data:', error.response.data);
      
      // 401 veya 422 hatası - token sorunu
      if (status === 401 || status === 422) {
        // Eğer login sayfasındaysak logout yapma
        if (!window.location.pathname.includes('/login')) {
          console.warn('Token hatası, logout yapılıyor...');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          // Kısa bir gecikme ile logout (kullanıcı hatayı görebilsin)
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

