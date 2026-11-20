// Wczytuje zapisane ułatwienia dostępu przed wyświetleniem strony
(function () {
  try {
    var r = document.documentElement, s = localStorage;
    var fs = s.getItem('p16-fs'); if (fs && fs !== '0') r.setAttribute('data-fs', fs);
    if (s.getItem('p16-contrast') === '1') r.setAttribute('data-contrast', 'high');
    if (s.getItem('p16-spacing') === '1') r.setAttribute('data-spacing', 'on');
    if (s.getItem('p16-links') === '1') r.setAttribute('data-links', 'on');
    if (s.getItem('p16-font') === '1') r.setAttribute('data-font', 'readable');
  } catch (e) {}
})();
