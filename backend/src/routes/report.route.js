import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { adminRoute } from '../middleware/adminRoute.js';
import { submitReport, getReports, reviewReport } from '../controllers/report.controller.js';

const router = express.Router();

router.post('/', protectRoute, submitReport);
router.get('/', protectRoute, adminRoute, getReports);
router.put('/:id', protectRoute, adminRoute, reviewReport);

export default router;
