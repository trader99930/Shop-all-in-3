import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'studious-hydra-440623-u7';

try {
  const possiblePaths = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(process.cwd(), '../../firebase-applet-config.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.projectId) {
        projectId = parsed.projectId;
        break;
      }
    }
  }
} catch (e) {
  console.warn('Error reading firebase-applet-config.json:', e);
}

if (!getApps().length) {
  initializeApp({
    projectId,
  });
}

export const adminAuth = getAuth();
