import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { supabase } from '../supabaseClient';
import { AuthPayload } from '../types';
import { Router, Request, Response } from 'express';


const router = express.Router();

router.post(
  '/register',
  [
    body('username').isString().isLength({ min: 3 }),
    body('password').isString().isLength({ min: 8 }),
    body('email').optional().isEmail(),
    body('fullName').optional().isString(),
    body('village').optional().isInt(),
  ],
  async (req: Request, res:Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payload = req.body as AuthPayload;
    const passwordHash = await bcrypt.hash(payload.password, 10);

    const { data, error } = await supabase
      .from('app_users')
      .insert({
        username: payload.username,
        password_hash: passwordHash,
        email: payload.email,
        full_name: payload.fullName,
        village: payload.village,
      })
      .select('id, username, email, full_name, village')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ user: data });
  }
);

router.post(
  '/login',
  [body('username').isString(), body('password').isString()],
    async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payload = req.body as AuthPayload;
    const { data, error } = await supabase
      .from('app_users')
      .select('id, username, email, password_hash, full_name, village')
      .eq('username', payload.username)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const isValid = await bcrypt.compare(payload.password, data.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const { password_hash, ...safeUser } = data;
    return res.json({ user: safeUser });
  }
);

export default router;
