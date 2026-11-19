import express from 'express';
import fs from 'fs';
import path from 'path';
import { execFileSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANDROID_ROOT = path.resolve(__dirname, 'android-app');
const APP_ICON_PATH = path.resolve(
  __dirname,
  'src/assets/images/smart_calculator_app_icon_1795062286272.jpg'
);

interface AndroidFileEntry {
  path: string;
  size: number;
  lines: number;
}

function collectAndroidFiles(dir: string, base: string = ''): AndroidFileEntry[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: AndroidFileEntry[] = [];

  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectAndroidFiles(fullPath, relPath));
    } else if (entry.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      files.push({
        path: relPath,
        size: Buffer.byteLength(content, 'utf-8'),
        lines: content.split('\n').length,
      });
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function checkCommand(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/environment/build-status', (_req, res) => {
    const files = collectAndroidFiles(ANDROID_ROOT);
    const hasJava = checkCommand('java');
    const hasGradle = checkCommand('gradle');
    const hasAndroidSdk = Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);

    res.json({
      apkBuildSupported: hasJava && hasAndroidSdk,
      toolchain: {
        java: hasJava,
        gradle: hasGradle,
        androidSdk: hasAndroidSdk,
      },
      projectStats: {
        applicationId: 'com.smarttools.smartcalculator',
        versionName: '1.0.0',
        versionCode: 1,
        minSdk: 24,
        targetSdk: 35,
        fileCount: files.length,
        totalBytes: files.reduce((sum, f) => sum + f.size, 0),
      },
    });
  });

  app.get('/api/android/tree', (_req, res) => {
    const files = collectAndroidFiles(ANDROID_ROOT);
    res.json({ files });
  });

  app.get('/api/android/file', (req, res) => {
    const relPath = typeof req.query.path === 'string' ? req.query.path : '';
    if (!relPath) {
      res.status(400).json({ error: 'Missing path query parameter' });
      return;
    }

    const resolved = path.resolve(ANDROID_ROOT, relPath);
    if (!resolved.startsWith(ANDROID_ROOT + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const content = fs.readFileSync(resolved, 'utf-8');
    res.json({ path: relPath, content });
  });

  app.get('/api/download/android-project.zip', (_req, res) => {
    const tmpZip = path.resolve('/tmp', `SmartCalculator-Android-Project-${Date.now()}.zip`);
    try {
      const pyScript = [
        'import os, sys, zipfile',
        'src = sys.argv[1]',
        'dst = sys.argv[2]',
        'with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zf:',
        '    for root, _, files in os.walk(src):',
        '        for f in sorted(files):',
        '            full = os.path.join(root, f)',
        '            rel = os.path.relpath(full, os.path.dirname(src))',
        '            zf.write(full, rel)',
      ].join('\n');

      execFileSync('python3', ['-c', pyScript, ANDROID_ROOT, tmpZip]);
      res.download(tmpZip, 'SmartCalculator-Android-Project.zip', () => {
        fs.rmSync(tmpZip, { force: true });
      });
    } catch (err) {
      fs.rmSync(tmpZip, { force: true });
      res.status(500).json({ error: 'Failed to package Android project archive' });
    }
  });

  app.get('/api/download/app-icon.jpg', (_req, res) => {
    if (!fs.existsSync(APP_ICON_PATH)) {
      res.status(404).json({ error: 'App icon asset not found' });
      return;
    }
    res.download(APP_ICON_PATH, 'smart-calculator-icon.jpg');
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Calculator server listening on http://localhost:${PORT}`);
  });
}

startServer();
