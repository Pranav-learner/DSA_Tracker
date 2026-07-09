import { Router } from 'express';
import {
  createNotebook,
  listNotebook,
  searchNotebook,
  getNotebookFacets,
  getNotebook,
  updateNotebook,
  deleteNotebook,
} from '../controllers/notebook.controller.js';

const router = Router();

// Static sub-paths MUST precede the `/:id` param route so they aren't swallowed.
router.get('/search', searchNotebook);
router.get('/facets', getNotebookFacets);
router.post('/', createNotebook);
router.get('/', listNotebook);
router.get('/:id', getNotebook);
router.patch('/:id', updateNotebook);
router.delete('/:id', deleteNotebook);

export default router;
