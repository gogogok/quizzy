import {Router} from 'express';import {publicSession} from '../controllers/sessionController.js';const r=Router();r.get('/:code',publicSession);export default r;
