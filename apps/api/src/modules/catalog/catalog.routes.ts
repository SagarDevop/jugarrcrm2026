import { Router } from 'express';
import { CatalogController } from './catalog.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', CatalogController.listCatalog);
router.post('/', CatalogController.createCatalogItem);
router.put('/:id', CatalogController.updateCatalogItem);
router.delete('/:id', CatalogController.deleteCatalogItem);

export default router;
