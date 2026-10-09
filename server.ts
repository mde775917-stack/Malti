import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, '.data');
const COOKIE_STORE_FILE = path.join(DATA_DIR, 'profile-cookies.json');

// Ensure .data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Programmatically generate valid PNG icons for PWA compliance if missing
function createSolidRoundedPng(width: number, height: number, isMaskable: boolean): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = width * (isMaskable ? 0.34 : 0.38);
  const innerRadius = outerRadius * 0.78;

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    rawData[rowStart] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background slate-900 (#0f172a)
      let r = 15;
      let g = 23;
      let b = 42;
      const a = 255;

      // Draw globe ring & meridian in sky-400 (#38bdf8) / blue-600 (#2563eb)
      if (dist <= outerRadius && dist >= innerRadius) {
        r = 56;
        g = 189;
        b = 248;
      } else if (dist < innerRadius) {
        const normX = dx / innerRadius;
        const normY = dy / innerRadius;
        const meridian = Math.abs( Math.abs(normX) - 0.45 * Math.sqrt(Math.max(0, 1 - normY * normY)) );
        const parallel = Math.abs(Math.abs(normY) - 0.35);
        if (meridian < 0.08 || parallel < 0.07) {
          r = 37;
          g = 99;
          b = 235;
        }
      }

      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, makeChunk('IHDR', ihdr), idat, iend]);
}

function ensurePwaIcons() {
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const icons: Array<{ name: string; size: number; maskable: boolean }> = [
    { name: 'pwa-192x192.png', size: 192, maskable: false },
    { name: 'pwa-512x512.png', size: 512, maskable: false },
    { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];
  for (const icon of icons) {
    const filePath = path.join(publicDir, icon.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, createSolidRoundedPng(icon.size, icon.size, icon.maskable));
    }
  }
}

ensurePwaIcons();

// ============================================================================
// Multi-Profile Isolated Cookie Jar Engine (Server-Backed RFC-6265 Store)
// ============================================================================

export interface StoredCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax' | 'Strict' | 'None';
  createdAt: number;
  expiresAt: number | null; // null = session cookie
}

// Persistent profile cookie map: profileId -> StoredCookie[]
let persistentCookieJars: Record<string, StoredCookie[]> = {};
// Ephemeral private mode cookie map: privateSessionId -> StoredCookie[] (RAM only, never written to disk)
const privateCookieJars: Record<string, StoredCookie[]> = {};

// Auth Lab Server-Side Sessions (keyed by sessionToken)
interface AuthLabSession {
  token: string;
  profileId: string;
  username: string;
  email: string;
  role: string;
  signedInAt: string;
  userAgent: string;
}
const authLabSessions: Record<string, AuthLabSession> = {};

function loadPersistentCookies() {
  try {
    if (fs.existsSync(COOKIE_STORE_FILE)) {
      const raw = fs.readFileSync(COOKIE_STORE_FILE, 'utf-8');
      persistentCookieJars = JSON.parse(raw);
    }
  } catch {
    persistentCookieJars = {};
  }
}

function savePersistentCookies() {
  try {
    fs.writeFileSync(COOKIE_STORE_FILE, JSON.stringify(persistentCookieJars, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist profile cookies:', err);
  }
}

loadPersistentCookies();

function getJarForProfile(profileId: string, isPrivate: boolean): StoredCookie[] {
  if (isPrivate) {
    const key = `priv_${profileId}`;
    if (!privateCookieJars[key]) {
      privateCookieJars[key] = [];
    }
    return privateCookieJars[key];
  }
  if (!persistentCookieJars[profileId]) {
    persistentCookieJars[profileId] = [];
  }
  return persistentCookieJars[profileId];
}

function setJarForProfile(profileId: string, isPrivate: boolean, cookies: StoredCookie[]) {
  if (isPrivate) {
    privateCookieJars[`priv_${profileId}`] = cookies;
  } else {
    persistentCookieJars[profileId] = cookies;
    savePersistentCookies();
  }
}

function domainMatches(cookieDomain: string, requestHost: string): boolean {
  const cleanCookie = cookieDomain.replace(/^\./, '').toLowerCase();
  const cleanHost = requestHost.toLowerCase();
  return cleanHost === cleanCookie || cleanHost.endsWith(`.${cleanCookie}`);
}

function getCookiesForUrl(profileId: string, isPrivate: boolean, targetUrl: URL): StoredCookie[] {
  const jar = getJarForProfile(profileId, isPrivate);
  const now = Date.now();
  return jar.filter((c) => {
    if (c.expiresAt && c.expiresAt < now) return false;
    if (!domainMatches(c.domain, targetUrl.hostname)) return false;
    if (targetUrl.pathname && !targetUrl.pathname.startsWith(c.path || '/')) return false;
    return true;
  });
}

function parseAndStoreSetCookieHeaders(
  profileId: string,
  isPrivate: boolean,
  targetUrl: URL,
  setCookieHeaders: string[]
) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return;
  let jar = [...getJarForProfile(profileId, isPrivate)];

  for (const rawHeader of setCookieHeaders) {
    const parts = rawHeader.split(';').map((p) => p.trim());
    if (parts.length === 0) continue;
    const [nameVal, ...attrs] = parts;
    const eqIdx = nameVal.indexOf('=');
    if (eqIdx <= 0) continue;

    const name = nameVal.slice(0, eqIdx).trim();
    const value = nameVal.slice(eqIdx + 1).trim();

    let domain = targetUrl.hostname;
    let cookiePath = '/';
    let httpOnly = false;
    let secure = targetUrl.protocol === 'https:';
    let sameSite: 'Lax' | 'Strict' | 'None' = 'Lax';
    let expiresAt: number | null = null;

    for (const attr of attrs) {
      const [k, v] = attr.split('=').map((s) => s.trim());
      const lowerK = k.toLowerCase();
      if (lowerK === 'domain' && v) {
        domain = v.replace(/^\./, '').toLowerCase();
      } else if (lowerK === 'path' && v) {
        cookiePath = v;
      } else if (lowerK === 'httponly') {
        httpOnly = true;
      } else if (lowerK === 'secure') {
        secure = true;
      } else if (lowerK === 'samesite' && v) {
        const s = v.toLowerCase();
        if (s === 'strict') sameSite = 'Strict';
        else if (s === 'none') sameSite = 'None';
        else sameSite = 'Lax';
      } else if (lowerK === 'max-age' && v) {
        const secs = parseInt(v, 10);
        if (!isNaN(secs)) {
          expiresAt = Date.now() + secs * 1000;
        }
      } else if (lowerK === 'expires' && v) {
        const parsed = Date.parse(v);
        if (!isNaN(parsed)) {
          expiresAt = parsed;
        }
      }
    }

    // Remove existing cookie with same name, domain, path
    jar = jar.filter((c) => !(c.name === name && c.domain === domain && c.path === cookiePath));

    // If value is not deleted/expired immediately, add it
    if (value !== '' && (!expiresAt || expiresAt > Date.now())) {
      jar.push({
        name,
        value,
        domain,
        path: cookiePath,
        httpOnly,
        secure,
        sameSite,
        createdAt: Date.now(),
        expiresAt,
      });
    }
  }

  setJarForProfile(profileId, isPrivate, jar);
}

// ============================================================================
// Injected Client-Side Bridge for Proxied Websites
// ============================================================================
function buildInjectedBridgeScript(
  profileId: string,
  isPrivate: boolean,
  targetOrigin: string,
  targetHref: string,
  textScale: number
): string {
  const storagePrefix = isPrivate ? `uv_priv_${profileId}_${targetOrigin}_` : `uv_prof_${profileId}_${targetOrigin}_`;
  return `
<style id="uv-browser-injected-style">
  html {
    font-size: ${Math.max(70, Math.min(160, textScale))}% !important;
  }
  mark.uv-find-highlight {
    background-color: #fde047 !important;
    color: #0f172a !important;
    padding: 0 2px !important;
    border-radius: 2px !important;
    box-shadow: 0 0 0 1px #eab308 !important;
  }
  mark.uv-find-highlight-active {
    background-color: #f97316 !important;
    color: #ffffff !important;
    box-shadow: 0 0 0 2px #ea580c !important;
  }
</style>
<script>
(function() {
  const PROFILE_ID = ${JSON.stringify(profileId)};
  const IS_PRIVATE = ${JSON.stringify(isPrivate)};
  const TARGET_ORIGIN = ${JSON.stringify(targetOrigin)};
  const TARGET_HREF = ${JSON.stringify(targetHref)};
  const STORAGE_PREFIX = ${JSON.stringify(storagePrefix)};

  // 1. Partition window.localStorage per Profile + Origin so profiles never share DOM storage
  try {
    const rawLS = window.localStorage;
    const isolatedStorage = {
      getItem: function(key) {
        return rawLS.getItem(STORAGE_PREFIX + String(key));
      },
      setItem: function(key, val) {
        rawLS.setItem(STORAGE_PREFIX + String(key), String(val));
        window.parent.postMessage({
          type: 'UV_STORAGE_UPDATED',
          profileId: PROFILE_ID,
          origin: TARGET_ORIGIN
        }, '*');
      },
      removeItem: function(key) {
        rawLS.removeItem(STORAGE_PREFIX + String(key));
      },
      clear: function() {
        const keysToRemove = [];
        for (let i = 0; i < rawLS.length; i++) {
          const k = rawLS.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) keysToRemove.push(k);
        }
        keysToRemove.forEach(k => rawLS.removeItem(k));
      },
      key: function(index) {
        const matching = [];
        for (let i = 0; i < rawLS.length; i++) {
          const k = rawLS.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            matching.push(k.slice(STORAGE_PREFIX.length));
          }
        }
        return matching[index] || null;
      },
      get length() {
        let count = 0;
        for (let i = 0; i < rawLS.length; i++) {
          const k = rawLS.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) count++;
        }
        return count;
      }
    };
    Object.defineProperty(window, 'localStorage', {
      get: function() { return isolatedStorage; },
      configurable: true
    });
  } catch (e) {}

  // 2. Notify parent browser shell of page metadata on load
  function reportPageReady() {
    const title = document.title || TARGET_ORIGIN;
    const metaDesc = document.querySelector('meta[name="description"]');
    window.parent.postMessage({
      type: 'UV_PAGE_LOADED',
      profileId: PROFILE_ID,
      url: TARGET_HREF,
      title: title,
      description: metaDesc ? metaDesc.getAttribute('content') : ''
    }, '*');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reportPageReady);
  } else {
    reportPageReady();
  }

  // 3. Intercept link clicks so navigation stays inside the active profile tab
  document.addEventListener('click', function(e) {
    const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!anchor) return;
    const rawHref = anchor.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;
    try {
      const resolved = new URL(rawHref, TARGET_HREF);
      if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
        e.preventDefault();
        window.parent.postMessage({
          type: 'UV_NAVIGATE',
          profileId: PROFILE_ID,
          url: resolved.href
        }, '*');
      }
    } catch (err) {}
  }, true);

  // 4. Intercept GET forms so search forms on websites work inside the proxy
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    if (method === 'GET') {
      try {
        const action = form.getAttribute('action') || TARGET_HREF;
        const resolved = new URL(action, TARGET_HREF);
        const formData = new FormData(form);
        for (const [k, v] of formData.entries()) {
          if (typeof v === 'string') {
            resolved.searchParams.set(k, v);
          }
        }
        e.preventDefault();
        window.parent.postMessage({
          type: 'UV_NAVIGATE',
          profileId: PROFILE_ID,
          url: resolved.href
        }, '*');
      } catch (err) {}
    }
  }, true);

  // 5. Handle Find-in-Page, Reader Mode Extraction, Text-to-Speech, and Text Scaling
  let currentMarks = [];
  let activeMarkIndex = 0;

  function clearFindHighlights() {
    currentMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    currentMarks = [];
    activeMarkIndex = 0;
  }

  function highlightQuery(query) {
    clearFindHighlights();
    if (!query || !query.trim()) {
      window.parent.postMessage({ type: 'UV_FIND_RESULTS', total: 0, current: 0 }, '*');
      return;
    }
    const q = query.trim().toLowerCase();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'MARK', 'TEXTAREA'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.nodeValue && node.nodeValue.toLowerCase().includes(q)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    });

    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) {
      textNodes.push(n);
      if (textNodes.length > 250) break;
    }

    textNodes.forEach(node => {
      const text = node.nodeValue || '';
      const lower = text.toLowerCase();
      let idx = lower.indexOf(q);
      if (idx === -1) return;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      while (idx !== -1) {
        if (idx > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
        }
        const mark = document.createElement('mark');
        mark.className = 'uv-find-highlight';
        mark.textContent = text.slice(idx, idx + q.length);
        frag.appendChild(mark);
        currentMarks.push(mark);
        lastIdx = idx + q.length;
        idx = lower.indexOf(q, lastIdx);
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      if (node.parentNode) {
        node.parentNode.replaceChild(frag, node);
      }
    });

    if (currentMarks.length > 0) {
      focusMark(0);
    } else {
      window.parent.postMessage({ type: 'UV_FIND_RESULTS', total: 0, current: 0 }, '*');
    }
  }

  function focusMark(index) {
    if (currentMarks.length === 0) return;
    currentMarks.forEach(m => m.classList.remove('uv-find-highlight-active'));
    activeMarkIndex = (index + currentMarks.length) % currentMarks.length;
    const target = currentMarks[activeMarkIndex];
    if (target) {
      target.classList.add('uv-find-highlight-active');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.parent.postMessage({
      type: 'UV_FIND_RESULTS',
      total: currentMarks.length,
      current: activeMarkIndex + 1
    }, '*');
  }

  function extractReadableContent() {
    const root = document.querySelector('article, main, [role="main"]') || document.body;
    const blocks = [];
    const elements = root.querySelectorAll('h1, h2, h3, p, li, blockquote');
    elements.forEach(el => {
      const txt = (el.textContent || '').replace(/\\s+/g, ' ').trim();
      if (txt.length > 25) {
        blocks.push({
          tag: el.tagName.toLowerCase(),
          text: txt
        });
      }
    });
    if (blocks.length === 0) {
      const fallback = (document.body.innerText || '').split('\\n').map(s => s.trim()).filter(s => s.length > 20);
      fallback.slice(0, 50).forEach(t => blocks.push({ tag: 'p', text: t }));
    }
    return {
      title: document.title || TARGET_ORIGIN,
      url: TARGET_HREF,
      blocks: blocks.slice(0, 80)
    };
  }

  window.addEventListener('message', function(e) {
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'UV_FIND_IN_PAGE') {
      highlightQuery(data.query);
    } else if (data.type === 'UV_FIND_NEXT') {
      focusMark(activeMarkIndex + (data.direction === 'prev' ? -1 : 1));
    } else if (data.type === 'UV_FIND_CLEAR') {
      clearFindHighlights();
    } else if (data.type === 'UV_EXTRACT_READER') {
      const content = extractReadableContent();
      window.parent.postMessage({
        type: 'UV_READER_DATA',
        payload: content
      }, '*');
    } else if (data.type === 'UV_EXTRACT_TTS') {
      const content = extractReadableContent();
      const plainText = [content.title, ...content.blocks.map(b => b.text)].join('. ');
      window.parent.postMessage({
        type: 'UV_TTS_DATA',
        text: plainText.slice(0, 6000)
      }, '*');
    } else if (data.type === 'UV_SET_TEXT_SCALE') {
      document.documentElement.style.setProperty('font-size', data.scale + '%', 'important');
    }
  });
})();
</script>
`;
}

// ============================================================================
// Express App & API Routes
// ============================================================================
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 1. Get isolated cookies for a specific profile
  app.get('/api/profiles/:profileId/cookies', (req: Request, res: Response) => {
    const profileId = String(req.params.profileId);
    const isPrivate = req.query.isPrivate === 'true';
    const cookies = getJarForProfile(profileId, isPrivate);
    res.json({
      profileId,
      isPrivate,
      storagePartition: isPrivate
        ? `ram://private_session/${profileId}`
        : `app_webview_${profileId}/Default/Cookies`,
      cookies,
    });
  });

  // 2. Add or update a cookie in a specific profile's isolated jar
  app.post('/api/profiles/:profileId/cookies', (req: Request, res: Response) => {
    const profileId = String(req.params.profileId);
    const isPrivate = req.body.isPrivate === true;
    const { name, value, domain, path: cookiePath = '/', httpOnly = false, secure = true } = req.body;
    if (!name || !domain) {
      res.status(400).json({ error: 'Cookie name and domain are required' });
      return;
    }
    const jar = [...getJarForProfile(profileId, isPrivate)].filter(
      (c) => !(c.name === name && c.domain === domain && c.path === cookiePath)
    );
    jar.push({
      name: String(name),
      value: String(value ?? ''),
      domain: String(domain).replace(/^\./, '').toLowerCase(),
      path: String(cookiePath),
      httpOnly: Boolean(httpOnly),
      secure: Boolean(secure),
      sameSite: 'Lax',
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });
    setJarForProfile(profileId, isPrivate, jar);
    res.json({ ok: true, cookies: jar });
  });

  // 3. Clear cookies for a specific profile (or delete a single cookie)
  app.delete('/api/profiles/:profileId/cookies', (req: Request, res: Response) => {
    const profileId = String(req.params.profileId);
    const isPrivate = req.query.isPrivate === 'true';
    const cookieName = req.query.name ? String(req.query.name) : null;
    const cookieDomain = req.query.domain ? String(req.query.domain) : null;

    if (cookieName && cookieDomain) {
      const filtered = getJarForProfile(profileId, isPrivate).filter(
        (c) => !(c.name === cookieName && c.domain === cookieDomain)
      );
      setJarForProfile(profileId, isPrivate, filtered);
      res.json({ ok: true, cookies: filtered });
      return;
    }

    setJarForProfile(profileId, isPrivate, []);
    res.json({ ok: true, cookies: [] });
  });

  // 4. Interactive Multi-Profile Session & Auth Verification Lab (/api/auth-lab/*)
  app.post('/api/auth-lab/login', (req: Request, res: Response) => {
    const {
      profileId = 'personal',
      isPrivate = false,
      username = 'Alex Rivera',
      email = 'alex@personal.io',
      role = 'Personal Account',
    } = req.body;

    const token = `uv_sess_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    authLabSessions[token] = {
      token,
      profileId: String(profileId),
      username: String(username),
      email: String(email),
      role: String(role),
      signedInAt: new Date().toISOString(),
      userAgent: String(req.headers['user-agent'] || 'UV Mobile Browser'),
    };

    // Store real HttpOnly session cookie in ONLY this profile's isolated Cookie Jar
    const targetUrl = new URL('https://auth-lab.uvbrowser.internal/');
    parseAndStoreSetCookieHeaders(String(profileId), Boolean(isPrivate), targetUrl, [
      `uv_auth_session=${token}; Domain=auth-lab.uvbrowser.internal; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `uv_active_user=${encodeURIComponent(String(email))}; Domain=auth-lab.uvbrowser.internal; Path=/; Secure; SameSite=Lax`,
    ]);

    res.json({
      ok: true,
      session: authLabSessions[token],
      cookies: getCookiesForUrl(String(profileId), Boolean(isPrivate), targetUrl),
    });
  });

  app.post('/api/auth-lab/logout', (req: Request, res: Response) => {
    const { profileId = 'personal', isPrivate = false } = req.body;
    const targetUrl = new URL('https://auth-lab.uvbrowser.internal/');
    const existing = getCookiesForUrl(String(profileId), Boolean(isPrivate), targetUrl);
    for (const c of existing) {
      if (c.name === 'uv_auth_session' && authLabSessions[c.value]) {
        delete authLabSessions[c.value];
      }
    }
    const jar = getJarForProfile(String(profileId), Boolean(isPrivate)).filter(
      (c) => c.domain !== 'auth-lab.uvbrowser.internal'
    );
    setJarForProfile(String(profileId), Boolean(isPrivate), jar);
    res.json({ ok: true });
  });

  app.get('/api/auth-lab/status', (req: Request, res: Response) => {
    const profileId = String(req.query.profileId || 'personal');
    const isPrivate = req.query.isPrivate === 'true';
    const targetUrl = new URL('https://auth-lab.uvbrowser.internal/');
    const matchingCookies = getCookiesForUrl(profileId, isPrivate, targetUrl);
    const sessionCookie = matchingCookies.find((c) => c.name === 'uv_auth_session');
    const activeSession = sessionCookie ? authLabSessions[sessionCookie.value] || null : null;

    res.json({
      profileId,
      isPrivate,
      storageDirectory: isPrivate
        ? `ephemeral_ram://incognito_${profileId}`
        : `/data/user/0/com.uvbrowser.mobile/app_webview_${profileId}`,
      cookieHeaderSent: matchingCookies.map((c) => `${c.name}=${c.value}`).join('; ') || '(none)',
      cookies: matchingCookies,
      authenticated: Boolean(activeSession),
      session: activeSession,
    });
  });

  // 5. Search Autocomplete Suggestions Endpoint
  app.get('/api/search-suggest', async (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.json({ suggestions: [] });
      return;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);
      const resp = await fetch(
        `https://ac.duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (resp.ok) {
        const data = (await resp.json()) as unknown;
        if (Array.isArray(data) && Array.isArray(data[1])) {
          res.json({ suggestions: data[1].slice(0, 6) });
          return;
        }
      }
    } catch {
      // Fallback deterministic suggestions if offline or blocked
    }
    res.json({
      suggestions: [
        q,
        `${q} documentation`,
        `${q} latest news`,
        `${q} mobile web guide`,
        `https://en.wikipedia.org/wiki/${encodeURIComponent(q.replace(/\s+/g, '_'))}`,
      ],
    });
  });

  // 6. Live Webpage Translation Service (/api/translate)
  app.post('/api/translate', async (req: Request, res: Response) => {
    const { blocks = [], targetLang = 'es', title = '' } = req.body;
    const langNames: Record<string, string> = {
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ja: 'Japanese',
      pt: 'Portuguese',
      hi: 'Hindi',
      ar: 'Arabic',
      zh: 'Chinese',
    };

    try {
      // Translate up to 25 blocks using public MyMemory / Google translate endpoint or structured fallback
      const sourceText = [title, ...blocks.slice(0, 15).map((b: { text: string }) => b.text)]
        .join('\n\n')
        .slice(0, 1800);

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        targetLang
      )}&dt=t&q=${encodeURIComponent(sourceText)}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const json = (await response.json()) as unknown[];
        if (Array.isArray(json) && Array.isArray(json[0])) {
          const translatedFull = (json[0] as unknown[][])
            .map((part) => (Array.isArray(part) ? String(part[0] || '') : ''))
            .join('');
          const paragraphs = translatedFull
            .split('\n\n')
            .map((s) => s.trim())
            .filter(Boolean);
          res.json({
            ok: true,
            targetLanguage: langNames[targetLang] || targetLang,
            translatedTitle: paragraphs[0] || title,
            translatedBlocks: paragraphs.slice(1).map((text) => ({ tag: 'p', text })),
          });
          return;
        }
      }
    } catch {
      // Fallback below
    }

    res.json({
      ok: true,
      targetLanguage: langNames[targetLang] || targetLang,
      translatedTitle: `[${(langNames[targetLang] || targetLang).toUpperCase()}] ${title}`,
      translatedBlocks: (blocks as Array<{ tag?: string; text: string }>).map((b) => ({
        tag: b.tag || 'p',
        text: `[${targetLang.toUpperCase()}] ${b.text}`,
      })),
    });
  });

  // 7. Real Profile-Isolated Web Rendering Proxy (/api/proxy)
  app.get('/api/proxy', async (req: Request, res: Response) => {
    const rawUrl = String(req.query.url || '').trim();
    const profileId = String(req.query.profileId || 'personal');
    const isPrivate = req.query.isPrivate === 'true';
    const desktopMode = req.query.desktopMode === 'true';
    const doNotTrack = req.query.doNotTrack !== 'false';
    const javaScriptEnabled = req.query.js !== 'false';
    const safeBrowsing = req.query.safeBrowsing !== 'false';
    const textScale = Number(req.query.textScale) || 100;

    if (!rawUrl) {
      res.status(400).send('Missing URL parameter');
      return;
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(rawUrl);
      if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
        throw new Error('Unsupported protocol');
      }
    } catch {
      res.status(400).send('Invalid URL format');
      return;
    }

    // Safe Browsing check
    const unsafeHosts = ['malware.testing.google.test', 'phishing-test.example.org', 'unsafe.uvbrowser.test'];
    if (safeBrowsing && unsafeHosts.includes(targetUrl.hostname.toLowerCase())) {
      res
        .status(200)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(`<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Security Warning — Safe Browsing</title>
<style>
  body { font-family: system-ui, sans-serif; background: #7f1d1d; color: #fef2f2; margin: 0; padding: 32px 20px; }
  .card { max-width: 480px; margin: 24px auto; background: #991b1b; border: 1px solid #f87171; border-radius: 16px; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  p { font-size: 14px; line-height: 1.6; color: #fecaca; }
  code { font-family: monospace; background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 4px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Deceptive Site Ahead</h1>
    <p>Unlimited Virtual Safe Browsing blocked <code>${targetUrl.hostname}</code> because it is flagged as a harmful or deceptive demonstration host.</p>
    <p>Your active profile (<code>${profileId}</code>) cookies and credentials were protected and not transmitted.</p>
  </div>
</body>
</html>`);
      return;
    }

    // Gather ONLY the active profile's isolated cookies for this target URL
    const profileCookies = getCookiesForUrl(profileId, isPrivate, targetUrl);
    const cookieHeader = profileCookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const userAgent = desktopMode
      ? 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 UVBrowser/2.4'
      : 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 UVBrowser/2.4';

    const requestHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    if (cookieHeader) {
      requestHeaders['Cookie'] = cookieHeader;
    }
    if (doNotTrack) {
      requestHeaders['DNT'] = '1';
      requestHeaders['Sec-GPC'] = '1';
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const upstreamResp = await fetch(targetUrl.href, {
        method: 'GET',
        headers: requestHeaders,
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const finalUrl = new URL(upstreamResp.url || targetUrl.href);

      // Capture Set-Cookie headers from upstream and store strictly in this profile's isolated jar
      const setCookies =
        typeof upstreamResp.headers.getSetCookie === 'function'
          ? upstreamResp.headers.getSetCookie()
          : upstreamResp.headers.get('set-cookie')
            ? [upstreamResp.headers.get('set-cookie') as string]
            : [];

      if (setCookies.length > 0) {
        parseAndStoreSetCookieHeaders(profileId, isPrivate, finalUrl, setCookies);
      }

      const contentType = upstreamResp.headers.get('content-type') || 'text/html; charset=utf-8';

      // Remove framing restrictions so the real page renders cleanly
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
        const rawText = await upstreamResp.text();
        const bridge = buildInjectedBridgeScript(
          profileId,
          isPrivate,
          finalUrl.origin,
          finalUrl.href,
          textScale
        );
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${finalUrl.hostname}${finalUrl.pathname}</title>
  ${bridge}
  <style>
    body {
      margin: 0;
      padding: 16px;
      background: #0f172a;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 13px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid #1e293b;
      color: #94a3b8;
      font-size: 12px;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      background: #1e293b;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="header">
    <span>Origin: ${finalUrl.origin}</span>
    <span>Profile Cookie Jar: ${profileId}${isPrivate ? ' (Private RAM)' : ''}</span>
  </div>
  <pre>${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`);
        return;
      }

      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        const arrayBuf = await upstreamResp.arrayBuffer();
        res.setHeader('Content-Type', contentType);
        res.send(Buffer.from(arrayBuf));
        return;
      }

      let html = await upstreamResp.text();

      // Strip upstream CSP meta tags that might block inline bridge or base tag
      html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

      // If JavaScript is disabled in profile settings, strip <script> blocks from remote HTML
      if (!javaScriptEnabled) {
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }

      const baseAndBridge = `<base href="${finalUrl.href}">\n${buildInjectedBridgeScript(
        profileId,
        isPrivate,
        finalUrl.origin,
        finalUrl.href,
        textScale
      )}`;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${baseAndBridge}`);
      } else {
        html = `${baseAndBridge}\n${html}`;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site Unavailable — ${targetUrl.hostname}</title>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 36px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 75vh;
    }
    .box {
      max-width: 440px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 18px;
      padding: 24px;
    }
    .code {
      font-family: monospace;
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 10px;
      color: #f8fafc;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 16px;
    }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="code">ERR_ADDRESS_UNREACHABLE · ${message}</div>
    <h1>This site can't be reached</h1>
    <p><strong>${targetUrl.hostname}</strong> took too long to respond or refused the proxy connection.</p>
    <button class="btn" onclick="window.location.reload()">Reload Page</button>
  </div>
</body>
</html>`);
    }
  });

  // Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unlimited Virtual Mobile Browser Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
