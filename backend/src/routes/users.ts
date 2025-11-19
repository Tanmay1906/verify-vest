import { Router } from 'express';
import * as controller from '../controllers/users.controller.js';

export const router = Router();

router.get('/', controller.listUsers);
router.get('/:id', controller.getUserById);
router.post('/', controller.createUser);
