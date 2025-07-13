import express from 'express';
import { updatePetStats, getUserRepos } from '../controllers/githubController.js';

const router = express.Router();

// Corrected routes
router.get('/pet/:username', updatePetStats);
router.get('/user-repos/:username', getUserRepos);

export default router;