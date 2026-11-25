import { Request, Response, NextFunction } from 'express';
import { CatalogModel } from '../../models/catalog.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { USER_ROLES } from '@agencyos/shared';

export class CatalogController {
  static async listCatalog(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.category) {
        filter.category = req.query.category;
      }
      if (req.query.search) {
        const regex = new RegExp(String(req.query.search), 'i');
        filter.$or = [{ title: regex }, { description: regex }, { techStack: regex }];
      }

      const items = await CatalogModel.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  static async createCatalogItem(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== USER_ROLES.SUPER_ADMIN) {
        throw new AppError('Only Super Admin can publish and configure service catalog pricing.', 403);
      }

      const {
        title,
        category,
        description,
        pricingType,
        basePrice,
        maxPrice,
        deliveryDays,
        timeline,
        deliverables,
        techStack,
        imageUrl,
        targetClient,
        pitchTips,
      } = req.body;

      if (!title || basePrice === undefined) {
        throw new AppError('Package title and base price are required.', 400);
      }

      const newItem = await CatalogModel.create({
        organizationId: user.organizationId,
        title,
        category: category || 'Web Development',
        description: description || '',
        pricingType: pricingType || 'Starting At',
        basePrice: Number(basePrice),
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        deliveryDays: deliveryDays ? Number(deliveryDays) : 21,
        timeline: timeline || '3 - 4 Weeks',
        deliverables: Array.isArray(deliverables) ? deliverables : [],
        techStack: Array.isArray(techStack) ? techStack : [],
        imageUrl: imageUrl || '',
        targetClient: targetClient || '',
        pitchTips: pitchTips || '',
        isActive: true,
        createdBy: user._id,
      });

      return ApiResponse.success(res, newItem, 'Service package successfully created.', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateCatalogItem(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== USER_ROLES.SUPER_ADMIN) {
        throw new AppError('Only Super Admin can update service catalog packages.', 403);
      }

      const { id } = req.params;
      const updated = await CatalogModel.findOneAndUpdate(
        { _id: id, organizationId: user.organizationId },
        { ...req.body },
        { new: true }
      );

      if (!updated) {
        throw new AppError('Service package not found.', 404);
      }

      return ApiResponse.success(res, updated, 'Service package updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  static async deleteCatalogItem(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== USER_ROLES.SUPER_ADMIN) {
        throw new AppError('Only Super Admin can delete service catalog packages.', 403);
      }

      const { id } = req.params;
      const deleted = await CatalogModel.findOneAndDelete({
        _id: id,
        organizationId: user.organizationId,
      });

      if (!deleted) {
        throw new AppError('Service package not found.', 404);
      }

      return ApiResponse.success(res, null, 'Service package deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}
