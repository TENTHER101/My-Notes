const fs = require('fs').promises;
const path = require('path');

async function rmDir(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (err) {
    // ignore
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

(async () => {
  const repoRoot = path.join(__dirname, '..');
  const src = path.join(repoRoot, 'home');
  const dest = path.join(repoRoot, 'build');

  // Clean dest
  await rmDir(dest);

  // Ensure source exists
  try {
    const stat = await fs.stat(src);
    if (!stat.isDirectory()) throw new Error('source not a directory');
  } catch (err) {
    console.error('Source folder "home" not found. Nothing to build.');
    process.exit(1);
  }

  try {
    await copyDir(src, dest);
    console.log('Build completed: copied "home/" -> "build/"');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(2);
  }
})();
