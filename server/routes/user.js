import express from 'express';
import { connectLeetCode, getLeetCodeStats } from '../controllers/userController.js';

const router = express.Router();

router.post('/leetcode', connectLeetCode);
router.get('/leetcode/:username', getLeetCodeStats);  // Add this route

export default router;