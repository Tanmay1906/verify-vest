import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../shared/prisma.js';
import { signJwt } from '../shared/auth.js';
import crypto from 'crypto';
import { Ed25519PublicKey, HexString } from 'aptos';

const nonces = new Map<string, string>();

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
    const { address, publicKey, signature } = req.body as { address: string; publicKey: string; signature: string };
    if (!address || !publicKey || !signature) return res.status(400).json({ message: 'missing fields' });

    const expected = nonces.get(address.toLowerCase());
    if (!expected) return res.status(400).json({ message: 'nonce not found' });

    const msg = Buffer.from(`Sign this message to login: ${expected}`, 'utf8');
    const sigBytes = HexString.ensure(signature).toUint8Array();
    const pk = new Ed25519PublicKey(HexString.ensure(publicKey).toUint8Array());
    const ok = await pk.verifySignature({
      message: msg,
      signature: sigBytes,
    });
    if (!ok) return res.status(401).json({ message: 'invalid signature' });

    nonces.delete(address.toLowerCase());

    let user = await prisma.user.findUnique({ where: { walletAddress: address.toLowerCase() } });
    if (!user) {
      user = await prisma.user.create({ data: { name: address, email: `${address}@wallet.local`, role: 'user', walletAddress: address.toLowerCase() } });
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
