// ═══════════════════════════════════════════════════════════
// QA Forge — Controller Stubs
// Placeholder controllers for all resource endpoints.
// Each will be implemented during the respective MVP phase.
// ═══════════════════════════════════════════════════════════

// projects.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ProjectController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement in Phase 1
      res.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, total_pages: 0, has_next: false, has_prev: false } });
    } catch (error) { next(error); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement in Phase 1
      res.status(201).json({ success: true, data: { id: 'placeholder' } });
    } catch (error) { next(error); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement in Phase 1
      res.json({ success: true, data: null });
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement in Phase 1
      res.json({ success: true, data: null });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement in Phase 1
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
