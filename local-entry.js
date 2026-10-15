// Opening index.html directly must lead to the application server, where
// authentication cookies, persistence and Drive synchronization are available.
(function () {
  if (window.location.protocol !== 'file:') return;
  const route = window.location.hash || '#inicio';
  window.location.replace('http://127.0.0.1:4173/' + route);
})();
