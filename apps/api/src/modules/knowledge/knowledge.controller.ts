import { Request, Response, NextFunction } from 'express';
import { KnowledgeResourceModel } from '../../models/knowledge.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { USER_ROLES } from '@agencyos/shared';

export class KnowledgeController {
  static async listResources(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (user.role === USER_ROLES.SALES_MEMBER) {
        filter.isPublished = true;
      }
      if (req.query.category) {
        filter.category = req.query.category;
      }
      if (req.query.search) {
        const regex = new RegExp(String(req.query.search), 'i');
        filter.$or = [{ title: regex }, { description: regex }, { searchTags: regex }];
      }

      const resources = await KnowledgeResourceModel.find(filter)
        .populate('createdBy', 'name email avatar')
        .sort({ updatedAt: -1 });

      return ApiResponse.success(res, resources);
    } catch (error) {
      next(error);
    }
  }

  static async createResource(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const resource = await KnowledgeResourceModel.create({
        ...req.body,
        organizationId: user.organizationId,
        createdBy: user._id,
      });

      return ApiResponse.success(res, resource, 'Knowledge resource created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateResource(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const resource = await KnowledgeResourceModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!resource) throw new AppError('Resource not found.', 404);

      Object.assign(resource, req.body);
      await resource.save();

      return ApiResponse.success(res, resource, 'Knowledge resource updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteResource(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const resource = await KnowledgeResourceModel.findOneAndDelete({ _id: id, organizationId: user.organizationId });
      if (!resource) throw new AppError('Resource not found.', 404);

      return ApiResponse.success(res, null, 'Resource deleted');
    } catch (error) {
      next(error);
    }
  }
}
