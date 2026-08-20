document.querySelectorAll('a[href*="auth="]').forEach(link => {
  link.addEventListener('click', () => sessionStorage.setItem('nutriq-auth-link', 'true'));
});
