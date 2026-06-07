# Redirect Debug - Quick Test Script

## Run this in browser console after login:

```javascript
// Check auth state
const auth = {
  localStorage: {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token')
  },
  sessionStorage: {
    active: sessionStorage.getItem('sessionActive')
  },
  currentPath: window.location.pathname
};

console.log('Auth State Check:', auth);
console.log('User role:', auth.localStorage.user?.role);
console.log('Is authenticated:', auth.localStorage.user && auth.localStorage.token);

// Force redirect test
if (auth.localStorage.user && auth.localStorage.token) {
  const role = (auth.localStorage.user.role || '').toLowerCase();
  let dashboardPath = '/login';
  
  if (role === 'admin') dashboardPath = '/admin/dashboard';
  else if (role === 'instructor') dashboardPath = '/instructor/dashboard';
  else if (role === 'student') dashboardPath = '/student/dashboard';
  
  console.log('Should redirect to:', dashboardPath);
  if (dashboardPath !== '/login') {
    window.location.href = dashboardPath;
  }
}
```


