/*
 * Конфігурація лендингу «Сніжок».
 *
 * GITHUB_REPO — ЗАМІНІТЬ на справжній репозиторій у форматі 'власник/репозиторій'
 *   (наприклад 'ivanenko/snizhok'). З нього будуються посилання на останні збірки:
 *   https://github.com/<GITHUB_REPO>/releases/latest/download/Snizhok.dmg
 *   https://github.com/<GITHUB_REPO>/releases/latest/download/Snizhok-Setup.exe
 *   На GitHub Pages workflow .github/workflows/pages.yml підставляє поточний
 *   репозиторій автоматично, якщо тут лишився плейсхолдер.
 *
 * ENGINE_BASE — де лежить рушій відносно сторінки.
 *   Локально (сайт відкрито з репозиторію: /landing/index.html) — './engine/'.
 *   На GitHub Pages рушій копіюється в _site/engine/, а workflow переписує
 *   значення на './engine/'. Вручну міняти не потрібно.
 */
window.SNIZHOK_CONFIG = {
  GITHUB_REPO: 'Wmedede1234/snizhok-site', // публічний репозиторій із сайтом і збірками
  ENGINE_BASE: './engine/',
  // Публічна адреса сайту: з неї будуються посилання «Поділитися» (список бажань, Таємний Санта),
  // навіть коли сторінку відкрито локально — інакше друзі отримають нерабочий localhost.
  SITE_URL: 'https://wmedede1234.github.io/snizhok-site/',
};

(function (c) {
  var base = 'https://github.com/' + c.GITHUB_REPO + '/releases/latest/download/';
  c.DOWNLOAD_MAC = base + 'Snizhok.dmg';
  c.DOWNLOAD_WIN = base + 'Snizhok-Setup.exe';
  c.RELEASES_PAGE = 'https://github.com/' + c.GITHUB_REPO + '/releases';
})(window.SNIZHOK_CONFIG);
