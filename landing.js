document.querySelectorAll('a[href*="auth="]').forEach(link => {
  link.addEventListener('click', () => sessionStorage.setItem('nutriq-auth-link', 'true'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
