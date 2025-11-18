import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../supabaseClient';
import { BookPayload } from '../types';
import { Router, Request, Response } from 'express';

const router = express.Router();

async function upsertAuthor(name: string) {
  const { data, error } = await supabase
    .from('authors')
    .upsert({ name }, { onConflict: 'name' })
    .select('id, name')
    .single();
  if (error) throw error;
  return data;
}

async function upsertGenre(name: string) {
  const { data, error } = await supabase
    .from('genres')
    .upsert({ name }, { onConflict: 'name' })
    .select('id, name')
    .single();
  if (error) throw error;
  return data;
}

router.post(
  '/',
  [
    body('title').isString().notEmpty(),
    body('authorName').isString().notEmpty(),
    body('genreName').isString().notEmpty(),
    body('publicationYear').optional().isInt(),
    body('villageId').optional().isInt(),
    body('conditionId').optional().isInt(),
    body('ownerId').optional().isInt(),
    body('language').optional().isString(),
  ],
    async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const payload = req.body as BookPayload;
      const author = await upsertAuthor(payload.authorName);
      const genre = await upsertGenre(payload.genreName);

      const insertPayload = {
        title: payload.title,
        author_id: author?.id,
        genre_id: genre?.id,
        publication_year: payload.publicationYear,
        publisher: payload.publisher,
        description: payload.description,
        language: payload.language || 'italiano',
        condition_id: payload.conditionId,
        village_id: payload.villageId,
        whohasit: payload.ownerId ?? -1,
      };

      const { data, error } = await supabase
        .from('books')
        .insert(insertPayload)
        .select(
          'id, title, publication_year, publisher, description, language, condition_id, village_id, author:authors(id, name), genre:genres(id, name)'
        )
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({ book: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

router.get('/', async (req, res) => {
  const { search, genreId, villageId } = req.query;
  let query = supabase
    .from('books')
    .select(
      'id, title, publication_year, publisher, description, language, whohasit, village_id, condition_id, author:authors(id, name), genre:genres(id, name)'
    )
    .order('title');

  if (search) {
    query = query.textSearch('title', `${search}`);
  }
  if (genreId) {
    query = query.eq('genre_id', Number(genreId));
  }
  if (villageId) {
    query = query.eq('village_id', Number(villageId));
  }

  const { data, error } = await query;
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ books: data });
});

export default router;
