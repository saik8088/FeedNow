const fs = require('fs');
const path = require('path');

const footerBlock = `
      <div class="sidebar__footer">
        <a href="../../index.html" class="sidebar__footer-link">
          <span class="sidebar__link-icon"><i class="ph ph-house"></i></span> Back to Home
        </a>
        <a href="#" class="sidebar__footer-link sidebar__footer-link--danger" onclick="logout()">
          <span class="sidebar__link-icon"><i class="ph ph-sign-out"></i></span> Logout
        </a>
      </div>
`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('class="sidebar"') && !content.includes('class="sidebar__footer"')) {
    // Inject before </aside>
    content = content.replace('</aside>', footerBlock + '    </aside>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function findHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git'].includes(file)) {
        findHtmlFiles(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      processFile(fullPath);
    }
  }
}

findHtmlFiles(__dirname);
console.log('Done.');
