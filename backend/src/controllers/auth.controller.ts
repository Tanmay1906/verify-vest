import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../shared/prisma.js';
import { signJwt } from '../shared/auth.js';
import crypto from 'crypto';
import * as naclImport from 'tweetnacl';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Single, clean implementation of auth controller
const nacl: any = (naclImport as any)?.default ?? naclImport;

const nonces = new Map<string, string>();

function hexToUint8Array(hex: string) {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error('Invalid hex string');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) { out[i / 2] = parseInt(h.slice(i, i + 2), 16); }
  return out;
}

function base64ToUint8Array(b64: string) {
  const bin = Buffer.from(b64, 'base64');
  return new Uint8Array(bin);
}

function normalizeToUint8Array(input: any): Uint8Array | null {
  if (input == null) return null;
  if (input instanceof Uint8Array) return input;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return new Uint8Array(input);
  if (Array.isArray(input) && input.every((n) => typeof n === 'number')) return new Uint8Array(input as number[]);
  if (typeof input === 'object') {
    if (Array.isArray((input as any).data)) return new Uint8Array((input as any).data);
    if ((input as any).signature) return normalizeToUint8Array((input as any).signature);
    if ((input as any).sig) return normalizeToUint8Array((input as any).sig);
    if ((input as any).publicKey) return normalizeToUint8Array((input as any).publicKey);
  }
    if (typeof input === 'string') {
    const s = input.trim();
    if (/^0x[0-9a-fA-F]+$/.test(s) || /^[0-9a-fA-F]+$/.test(s)) return hexToUint8Array(s);
    try { return base64ToUint8Array(s); } catch (e) { /* ignore */ }
    try { return normalizeToUint8Array(JSON.parse(s)); } catch (e) { /* ignore */ }
  }
  return null;
}

export async function nonce(req: Request, res: Response, next: NextFunction) {
  try {
    const { address } = req.query as { address?: string };
    if (!address) return res.status(400).json({ message: 'address required' });
    const nonce = crypto.randomBytes(16).toString('hex');
    nonces.set(address.toLowerCase(), nonce);
    res.json({ nonce, message: `Sign this message to login: ${nonce}` });
  } catch (err) {
    next(err);
  }
}

export async function walletLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { address, publicKey, signature } = req.body as { address?: string; publicKey?: any; signature?: any };
    if (!address || !signature) return res.status(400).json({ message: 'missing fields' });

    console.debug('walletLogin attempt', { address, publicKeyLen: publicKey?.length, signatureType: typeof signature });

    const expected = nonces.get(address.toLowerCase());
    if (!expected) return res.status(400).json({ message: 'nonce not found' });

    const msg = Buffer.from(`Sign this message to login: ${expected}`, 'utf8');
    const msgBytes = new Uint8Array(msg);

    let sigBytes = normalizeToUint8Array(signature);
    let pkBytes = normalizeToUint8Array(publicKey);
    if (!sigBytes) sigBytes = normalizeToUint8Array(JSON.stringify(signature));
    if (!sigBytes) return res.status(400).json({ message: 'unable to parse signature' });

    const expectedSigLen = 64;
    const expectedPkLen = 32;

    if (!nacl || !nacl.sign) return res.status(500).json({ message: 'server crypto unavailable' });

    let verified = false;

    // Fast path: detached signature + public key provided
    if (pkBytes && pkBytes.length === expectedPkLen && sigBytes.length === expectedSigLen && typeof (nacl.sign as any).detached?.verify === 'function') {
      try { verified = (nacl.sign as any).detached.verify(msgBytes, sigBytes, pkBytes); } catch (e) { verified = false; }
    }

    // Heuristic: try to parse embedded JSON inside signature blob for nested signature + pubkey
    if (!verified) {
      try {
        const text = new TextDecoder().decode(sigBytes);
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
          const obj = JSON.parse(text.slice(start, end + 1));
          const maybeSig = normalizeToUint8Array(obj?.signature ?? obj?.sig ?? obj?.signedMessage ?? obj?.signatureHex);
          const maybePk = normalizeToUint8Array(obj?.publicKey ?? obj?.pubkey ?? obj?.pk ?? obj?.public_key);
          if (maybeSig && maybePk && maybeSig.length === expectedSigLen && maybePk.length === expectedPkLen) {
            try { if ((nacl.sign as any).detached.verify(msgBytes, maybeSig, maybePk)) { sigBytes = maybeSig; pkBytes = maybePk; verified = true; } } catch (e) { /* ignore */ }
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Fallback: conservative scan of the blob to locate [sig(64) + pubkey(32)] or [pubkey(32)+sig(64)] sequences
    if (!verified) {
      const bs = sigBytes;
      const n = bs.length;
      const maxChecks = 200000; let checks = 0;

      // If public key known length present elsewhere in blob, try aligning signature windows against it
      if (n >= expectedSigLen + expectedPkLen) {
        // try every possible pk position and signature position (bounded)
        for (let pkStart = 0; pkStart + expectedPkLen <= n && !verified; pkStart++) {
          if (++checks > maxChecks) break;
          const pkCand = bs.subarray(pkStart, pkStart + expectedPkLen);
          for (let sigStart = 0; sigStart + expectedSigLen <= n && !verified; sigStart++) {
            if (++checks > maxChecks) break;
            const sigCand = bs.subarray(sigStart, sigStart + expectedSigLen);
            try {
              if ((nacl.sign as any).detached.verify(msgBytes, sigCand, pkCand)) {
                sigBytes = sigCand; pkBytes = pkCand; verified = true; break;
              }
            } catch (e) { /* ignore */ }
          }
        }
      }
    }

    if (!verified) return res.status(400).json({ message: 'invalid signature' });

    nonces.delete(address.toLowerCase());

    let user = await prisma.user.findUnique({ where: { walletAddress: address.toLowerCase() } });
    if (!user) {
      user = await prisma.user.create({ data: { name: address, email: `${address}@wallet.local`, role: 'user', walletAddress: address.toLowerCase() } });
    }

    const token = signJwt({ id: user.id, role: user.role, walletAddress: user.walletAddress ?? undefined, email: user.email, name: user.name });
    res.json({ token, user });
  } catch (err) {
    console.error('walletLogin error', (err as any)?.stack ?? err);
    next(err);
  }
}

// Simple login for development / quick connections: accept address + role and return JWT
export async function walletLoginSimple(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.ALLOW_INSECURE_LOGIN !== 'true') {
      return res.status(403).json({ message: 'Insecure simple wallet login is disabled. Set ALLOW_INSECURE_LOGIN=true in env for development.' });
    }
    const { address, role } = req.body as { address?: string; role?: string };
    if (!address || !role) return res.status(400).json({ message: 'address and role required' });

    // Normalize address
    const addr = address.toLowerCase();

    // Find or create user, set role to provided role
    let user = await prisma.user.findUnique({ where: { walletAddress: addr } });
    if (!user) {
      user = await prisma.user.create({ data: { name: addr, email: `${addr}@wallet.local`, role: role as any, walletAddress: addr } });
    } else if (user.role !== role) {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: role as any } });
    }

    const token = signJwt({ id: user.id, role: user.role, walletAddress: user.walletAddress ?? undefined, email: user.email, name: user.name });
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request & { user?: any }, res: Response) {
  res.json({ user: req.user });
}
