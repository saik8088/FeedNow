const fs = require('fs');
const path = require('path');

const emojiMap = {
  '🍽️': '<i class="ph ph-fork-knife"></i>',
  '🏢': '<i class="ph ph-buildings"></i>',
  '📦': '<i class="ph ph-package"></i>',
  '🔍': '<i class="ph ph-magnifying-glass"></i>',
  '🤝': '<i class="ph ph-handshake"></i>',
  '📍': '<i class="ph ph-map-pin"></i>',
  '⚡': '<i class="ph ph-lightning"></i>',
  '📊': '<i class="ph ph-chart-bar"></i>',
  '🔒': '<i class="ph ph-lock-key"></i>',
  '📱': '<i class="ph ph-device-mobile"></i>',
  '📈': '<i class="ph ph-trend-up"></i>',
  '🌍': '<i class="ph ph-globe-hemisphere-west"></i>',
  '👥': '<i class="ph ph-users"></i>',
  '🌱': '<i class="ph ph-plant"></i>',
  '🍲': '<i class="ph ph-bowl-food"></i>',
  '🍛': '<i class="ph ph-bowl-food"></i>',
  '🍞': '<i class="ph ph-bread"></i>',
  '🍎': '<i class="ph ph-carrot"></i>',
  '🔔': '<i class="ph ph-bell"></i>',
  '👤': '<i class="ph ph-user"></i>',
  '🏠': '<i class="ph ph-house"></i>',
  '🚪': '<i class="ph ph-sign-out"></i>',
  '⏳': '<i class="ph ph-hourglass-high"></i>',
  '📥': '<i class="ph ph-tray-arrow-down"></i>',
  '🔄': '<i class="ph ph-arrows-clockwise"></i>',
  '👁️': '<i class="ph ph-eye"></i>',
  '🙈': '<i class="ph ph-eye-slash"></i>',
  'ℹ️': '<i class="ph ph-info"></i>',
  '🚚': '<i class="ph ph-truck"></i>',
  '🕒': '<i class="ph ph-clock"></i>',
  '📷': '<i class="ph ph-camera"></i>',
  '𝕏': '<i class="ph ph-x-logo"></i>',
  'in': '<i class="ph ph-linkedin-logo"></i>', // Be careful with this one, handled separately below if needed
  '✓': '<i class="ph ph-check"></i>',
  '✨': '<i class="ph ph-sparkle"></i>'
};

const cdnLink = '\n  <!-- Phosphor Icons -->\n  <script src="https://unpkg.com/@phosphor-icons/web"></script>';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add CDN if not present
  if (!content.includes('@phosphor-icons/web')) {
    content = content.replace('</head>', `${cdnLink}\n</head>`);
  }

  // Replace emojis
  for (const [emoji, iconTag] of Object.entries(emojiMap)) {
    // Skip 'in' as it's a regular word, we only want to replace the specific instance in the footer
    if (emoji === 'in') continue;
    
    // Replace globally
    const regex = new RegExp(emoji, 'g');
    content = content.replace(regex, iconTag);
  }

  // Handle 'in' for linkedin and 'X' for twitter specifically in footer
  content = content.replace(/>in<\/a>/g, '><i class="ph ph-linkedin-logo"></i></a>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function findHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // ignore node_modules or .git if present
      if (!['node_modules', '.git'].includes(file)) {
        findHtmlFiles(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      processFile(fullPath);
    }
  }
}

const baseDir = __dirname;
console.log(`Starting scan in ${baseDir}`);
findHtmlFiles(baseDir);
console.log('Done.');
