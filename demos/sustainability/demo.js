const key = 'tanja-sustainability-demo-v1';
const choices = document.querySelectorAll('input[name="decision"]');
const comment = document.querySelector('#comment');
const status = document.querySelector('#copy-status');
const languageButtons = document.querySelectorAll('[data-set-lang]');

function save() {
  try {
    localStorage.setItem(key, JSON.stringify({
      decision: document.querySelector('input[name="decision"]:checked')?.value || '',
      comment: comment.value,
      lang: document.documentElement.dataset.lang
    }));
  } catch (_) { /* The demo remains usable when storage is disabled. */ }
}

function setLanguage(lang) {
  if (!['en', 'sw', 'ja'].includes(lang)) return;
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang;
  languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.setLang === lang)));
  save();
}

try {
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  if (saved.decision) [...choices].find(choice => choice.value === saved.decision).checked = true;
  if (typeof saved.comment === 'string') comment.value = saved.comment;
  if (saved.lang) setLanguage(saved.lang);
} catch (_) { /* Ignore unavailable or malformed local data. */ }

choices.forEach(choice => choice.addEventListener('change', save));
comment.addEventListener('input', save);
languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.setLang)));

document.querySelector('#copy-decision').addEventListener('click', async () => {
  const choice = document.querySelector('input[name="decision"]:checked')?.value || '未選択';
  const note = comment.value.trim() || 'なし';
  const result = `TANJA Sustainability デモへの回答\n方向: ${choice}\nコメント・修正点: ${note}`;
  try {
    await navigator.clipboard.writeText(result);
    status.textContent = 'コピーしました。チャットに貼り付けてください。';
  } catch (_) {
    const selection = document.createElement('textarea');
    selection.value = result;
    selection.setAttribute('readonly', '');
    selection.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(selection);
    selection.select();
    const copied = document.execCommand('copy');
    selection.remove();
    status.textContent = copied ? 'コピーしました。チャットに貼り付けてください。' : result;
  }
});
