/* eslint-disable no-console */
let deferredPrompt;
const addBtn = document.getElementById('addBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install'), e.preventDefault();
  deferredPrompt = e;
  addBtn.hidden = true;
  addBtn.addEventListener('click', installApp);
});

function installApp() {
  deferredPrompt.prompt();
  addBtn.disabled = true;
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      addBtn.hidden = true;
    } else {
      addBtn.disabled = false;
      deferredPrompt = null;
    }
  });
}

window.addEventListener('appinstalled', (event) => {
  console.log('app installed', event);
});
