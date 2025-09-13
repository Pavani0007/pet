import express from 'express';
import { connectLeetCode, getLeetCodeStats } from '../controllers/userController.js';

const router = express.Router();

router.post('https://pet-5qsa.onrender.com/api/leetcode', connectLeetCode);
router.get('https://pet-5qsa.onrender.com/api/leetcode/:username', getLeetCodeStats);  // Add this route

export default router;