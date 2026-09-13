(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const capture = params.get('capture') === '1';
  const portrait = document.getElementById('portrait-button');
  function setPortrait(enabled) {
    document.body.classList.toggle('portrait-view', enabled);
    portrait.setAttribute('aria-pressed', String(enabled));
    portrait.textContent = enabled ? 'Exit reel' : 'Reel view';
    if (!capture) {
      const url = new URL(location.href);
      enabled ? url.searchParams.set('portrait', '1') : url.searchParams.delete('portrait');
      history.replaceState(null, '', url);
    }
  }
  document.body.classList.toggle('capture-mode', capture);
  setPortrait(capture || params.get('portrait') === '1');
  portrait.addEventListener('click', () => setPortrait(!document.body.classList.contains('portrait-view')));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !document.fullscreenElement && !document.querySelector('dialog[open]')) setPortrait(false);
  });
})();
