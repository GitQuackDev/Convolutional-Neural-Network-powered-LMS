import { Router } from 'express';
import { annotationController } from '../controllers/annotationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/annotations
 * @desc Create a new annotation
 * @access Private
 */
router.post('/', authenticateToken as any, (req, res) => annotationController.createAnnotation(req as any, res));

/**
 * @route GET /api/annotations
 * @desc Get annotations with filtering
 * @access Private
 */
router.get('/', authenticateToken as any, (req, res) => annotationController.getAnnotations(req as any, res));

/**
 * @route GET /api/annotations/stats
 * @desc Get annotation statistics for content
 * @access Private
 */
router.get('/stats', authenticateToken as any, (req, res) => annotationController.getAnnotationStats(req as any, res));

/**
 * @route GET /api/annotations/thread/:threadId
 * @desc Get annotation thread (parent + all replies)
 * @access Private
 */
router.get('/thread/:threadId', authenticateToken as any, (req, res) => annotationController.getAnnotationThread(req as any, res));

/**
 * @route PUT /api/annotations/:annotationId
 * @desc Update an annotation
 * @access Private (Author only)
 */
router.put('/:annotationId', authenticateToken as any, (req, res) => annotationController.updateAnnotation(req as any, res));

/**
 * @route DELETE /api/annotations/:annotationId
 * @desc Delete an annotation
 * @access Private (Author/Admin only)
 */
router.delete('/:annotationId', authenticateToken as any, (req, res) => annotationController.deleteAnnotation(req as any, res));

/**
 * @route POST /api/annotations/:annotationId/resolve
 * @desc Resolve an annotation
 * @access Private (Instructor/Admin only)
 */
router.post('/:annotationId/resolve', authenticateToken as any, (req, res) => annotationController.resolveAnnotation(req as any, res));

/**
 * @route POST /api/annotations/:annotationId/moderate
 * @desc Moderate annotation content (hide/show, flag inappropriate)
 * @access Private (Instructor/Admin only)
 */
router.post('/:annotationId/moderate', authenticateToken as any, (req, res) => annotationController.moderateAnnotation(req as any, res));

/**
 * @route PUT /api/annotations/:annotationId/visibility
 * @desc Change annotation visibility settings
 * @access Private (Author/Instructor/Admin only)
 */
router.put('/:annotationId/visibility', authenticateToken as any, (req, res) => annotationController.changeVisibility(req as any, res));

/**
 * @route GET /api/annotations/moderation/queue
 * @desc Get annotations requiring moderation
 * @access Private (Instructor/Admin only)
 */
router.get('/moderation/queue', authenticateToken as any, (req, res) => annotationController.getModerationQueue(req as any, res));

/**
 * @route POST /api/annotations/bulk/moderate
 * @desc Bulk moderate multiple annotations
 * @access Private (Instructor/Admin only)
 */
router.post('/bulk/moderate', authenticateToken as any, (req, res) => annotationController.bulkModerate(req as any, res));

/**
 * @route GET /api/annotations/analytics/:contentId
 * @desc Get annotation analytics for content
 * @access Private (Instructor/Admin only)
 */
router.get('/analytics/:contentId', authenticateToken as any, (req, res) => annotationController.getAnnotationAnalytics(req as any, res));

export default router;
