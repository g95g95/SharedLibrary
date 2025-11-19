import express from 'express';
import { supabase } from '../supabaseClient';

const router = express.Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('villages')
    .select('id, name, province, region, country, postal_code, latitude, longitude')
    .order('name');

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ villages: data });
});

export default router;
