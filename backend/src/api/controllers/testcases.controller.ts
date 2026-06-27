import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

export class TestCaseController {
  async list(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: [] }); } catch (e) { next(e); } }
  async getById(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: null }); } catch (e) { next(e); } }
  async update(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: null }); } catch (e) { next(e); } }
  async approve(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: { status: 'approved' } }); } catch (e) { next(e); } }
  async reject(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: { status: 'rejected' } }); } catch (e) { next(e); } }
  async archive(req: AuthRequest, res: Response, next: NextFunction) { try { res.status(204).send(); } catch (e) { next(e); } }
}
