// ═══════════════════════════════════════════════════════════
// QA Forge — Session, Pipeline, TestCase, Artifact, Upload,
//            Report Controller Stubs
// ═══════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

// ─── Session Controller ──────────────────────────────────
export class SessionController {
  async list(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: [] }); } catch (e) { next(e); } }
  async create(req: AuthRequest, res: Response, next: NextFunction) { try { res.status(201).json({ success: true, data: { id: 'placeholder' } }); } catch (e) { next(e); } }
  async getById(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: null }); } catch (e) { next(e); } }
  async update(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: null }); } catch (e) { next(e); } }
  async delete(req: AuthRequest, res: Response, next: NextFunction) { try { res.status(204).send(); } catch (e) { next(e); } }
}
