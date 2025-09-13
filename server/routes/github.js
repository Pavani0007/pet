import express from 'express';
import { updatePetStats, getUserRepos } from '../controllers/githubController.js';

const router = express.Router();

// Corrected routes
router.get('https://pet-5qsa.onrender.com/api/pet/:username', updatePetStats);
router.get('https://pet-5qsa.onrender.com/api/user-repos/:username', getUserRepos);

export default router;