console.log('Stickers loading...');

let panel = null;

const GITHUB_USER = 'gk-succraft';
const GITHUB_REPO = 'petrovich-meme';
const GITHUB_BRANCH = 'master';
const IMAGES_FOLDER = 'stickers';

const REPO_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${IMAGES_FOLDER}`;

async function fetchImagesFromRepo() {
  try {
    console.log('Scanning GitHub folder...');
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const files = await response.json();

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      return imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    });

    const stickers = imageFiles.map(file => ({
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      url: `${REPO_RAW_URL}/${file.path}`,
      fileName: file.name
    }));

    console.log(`Found ${stickers.length} images in repo`);
    stickers.forEach(s => console.log(`   - ${s.name}`));

    return stickers;

  } catch (err) {
    console.error('Failed to fetch from GitHub API:', err);
    return [];
  }
}

async function copyImageAsPicture(url) {
  window.focus();
  await new Promise(r => setTimeout(r, 100));

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const html = `<img src="${url}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([url], { type: 'text/plain' })
      })
    ]);

    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

async function createPanel() {
  if (panel) {
    await refreshPanel();
    return;
  }

  panel = document.createElement('div');
  panel.id = 'stickers';
  panel.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: #1e1e1e;
    border: 2px solid #ff6b6b;
    border-radius: 16px;
    padding: 12px;
    display: none;
    grid-template-columns: repeat(4, 90px);
    gap: 10px;
    z-index: 9999999;
    background: #2d2d2d;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    max-height: 400px;
    overflow-y: auto;
  `;
  document.body.appendChild(panel);

  await refreshPanel();

  const closeBtn = document.createElement('div');
  closeBtn.textContent = '✖';
  closeBtn.style.cssText = `
    position: sticky;
    top: 0;
    left: 100%;
    cursor: pointer;
    color: #ff6b6b;
    font-size: 20px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    border-radius: 50%;
    margin-bottom: 8px;
  `;
  closeBtn.onclick = () => panel.style.display = 'none';
  panel.appendChild(closeBtn);
}

async function refreshPanel() {
  if (!panel) return;

  const closeBtn = panel.querySelector('#close-btn');
  while (panel.firstChild) {
    if (closeBtn && panel.firstChild === closeBtn) break;
    panel.removeChild(panel.firstChild);
  }

  const loading = document.createElement('div');
  loading.textContent = 'Loading stickers from GitHub...';
  loading.style.cssText = 'grid-column: span 4; text-align: center; color: #aaa; padding: 20px; font-size: 12px;';
  panel.appendChild(loading);

  const stickers = await fetchImagesFromRepo();

  while (panel.firstChild !== closeBtn && panel.firstChild) {
    panel.removeChild(panel.firstChild);
  }

  if (stickers.length === 0) {
    const errorMsg = document.createElement('div');
    errorMsg.innerHTML = 'No images found in repo<br><span style="font-size:10px">Put .png/.jpg files in your repo</span>';
    errorMsg.style.cssText = 'grid-column: span 4; text-align: center; color: #ff6b6b; padding: 20px; font-size: 12px;';
    panel.appendChild(errorMsg);
  }

  for (const sticker of stickers) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      background: #1a1a1a;
      border-radius: 8px;
      padding: 8px;
      transition: transform 0.1s;
    `;

    const img = document.createElement('img');
    img.src = sticker.url;
    img.style.cssText = `
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 8px;
      background: white;
    `;
    img.onerror = () => {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5" fill="red"%3E%3C/circle%3E%3Cpath d="M21 15l-5-4-3 3-4-4-5 5"%3E%3C/path%3E%3C/svg%3E';
      img.style.objectFit = 'contain';
    };

    const label = document.createElement('div');
    label.textContent = sticker.name.length > 12 ? sticker.name.slice(0, 10) + '…' : sticker.name;
    label.style.cssText = `
      color: white;
      font-size: 10px;
      margin-top: 5px;
      text-align: center;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    let isCopying = false;
    container.onclick = async () => {
      if (isCopying) return;
      isCopying = true;

      container.style.opacity = '0.6';
      const success = await copyImageAsPicture(sticker.url);

      const notification = document.createElement('div');
      notification.innerHTML = success ? `
        <div style="position:fixed; bottom:200px; right:20px; background:#4caf50; color:white; padding:10px 16px; border-radius:8px; z-index:9999999; font-family:sans-serif; font-size:13px;">
          ✅ ${sticker.name} copied! Press Ctrl+V
        </div>
      ` : `
        <div style="position:fixed; bottom:200px; right:20px; background:#f44336; color:white; padding:10px 16px; border-radius:8px; z-index:9999999; font-size:13px;">
          ❌ Copy failed, try again
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 1500);

      const input = document.querySelector('[role="combobox"]');
      if (input) input.focus();

      container.style.opacity = '1';
      isCopying = false;

      panel.style.display = 'none';
    };

    container.appendChild(img);
    container.appendChild(label);
    panel.appendChild(container);
  }

  const refreshBtn = document.createElement('div');
  refreshBtn.textContent = '🔄';
  refreshBtn.title = 'Refresh stickers from GitHub';
  refreshBtn.style.cssText = `
    position: sticky;
    top: 0;
    right: 30px;
    cursor: pointer;
    color: #4caf50;
    font-size: 18px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    margin-bottom: 8px;
  `;
  refreshBtn.onclick = async (e) => {
    e.stopPropagation();
    refreshBtn.style.transform = 'rotate(45deg)';
    await refreshPanel();
    refreshBtn.style.transform = 'rotate(0deg)';
  };
  panel.insertBefore(refreshBtn, panel.firstChild);

  const newCloseBtn = document.createElement('div');
  newCloseBtn.id = 'close-btn';
  newCloseBtn.textContent = '✖';
  newCloseBtn.title = 'Close panel';
  newCloseBtn.style.cssText = `
    position: sticky;
    top: 0;
    left: 100%;
    cursor: pointer;
    color: #ff6b6b;
    font-size: 18px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    border-radius: 50%;
    margin-bottom: 8px;
  `;
  newCloseBtn.onclick = () => panel.style.display = 'none';
  panel.appendChild(newCloseBtn);
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyS') {
    e.preventDefault();
    if (!panel) {
      createPanel();
    } else {
      panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
    }
  }
});

createPanel();
console.log('Stickers ready!');
console.log('How to use:');
console.log('1. Press Ctrl+Shift+S');
console.log('2. Click any sticker');
console.log('3. Press Ctrl+V in chat input');
console.log('4. Press Enter to send');