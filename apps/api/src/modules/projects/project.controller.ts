import { Request, Response, NextFunction } from 'express';
import { ProjectModel } from '../../models/project.model';
import { ActivityEventModel } from '../../models/activityEvent.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { emitOrgEvent } from '../../sockets';

const DEFAULT_MILESTONES = [
  { title: 'Requirements & Scope Finalization', status: 'Pending' as const },
  { title: 'UI/UX Wireframes & Prototypes', status: 'Pending' as const },
  { title: 'Frontend Component Architecture', status: 'Pending' as const },
  { title: 'Backend APIs & Database Architecture', status: 'Pending' as const },
  { title: 'Third-party Integrations & Payments', status: 'Pending' as const },
  { title: 'Quality Assurance & Performance Testing', status: 'Pending' as const },
  { title: 'Staging & Client Review', status: 'Pending' as const },
  { title: 'Production Deployment & Handoff', status: 'Pending' as const },
];

export class ProjectController {
  static async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.clientId) filter.clientId = req.query.clientId;
      if (req.query.status) filter.status = req.query.status;

      const projects = await ProjectModel.find(filter)
        .populate('clientId', 'clientName businessName email phone')
        .populate('assignedMembers', 'name email avatar')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, projects);
    } catch (error) {
      next(error);
    }
  }

  static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const data = req.body;

      // Compute total amount if breakdown is provided
      let totalAmount = Number(data.totalAmount || 0);
      if (data.quotationBreakdown && !data.totalAmount) {
        totalAmount = Object.values(data.quotationBreakdown as Record<string, number>).reduce(
          (acc, val) => acc + (Number(val) || 0),
          0
        );
      }

      const milestones = data.milestones && data.milestones.length > 0 ? data.milestones : DEFAULT_MILESTONES;

      const project = await ProjectModel.create({
        ...data,
        organizationId: user.organizationId,
        totalAmount,
        remainingAmount: totalAmount,
        milestones,
        createdBy: user._id,
      });

      const populated = await ProjectModel.findById(project._id)
        .populate('clientId', 'clientName businessName email')
        .populate('assignedMembers', 'name email avatar');

      await ActivityEventModel.create({
        organizationId: user.organizationId,
        entityType: 'project',
        entityId: project._id.toString(),
        title: 'Project Created',
        description: `Project "${project.name}" initialized with total budget of ${totalAmount}`,
        performedBy: user._id,
      });

      emitOrgEvent(user.organizationId, 'project:created', populated);

      return ApiResponse.success(res, populated, 'Project created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const project = await ProjectModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      })
        .populate('clientId')
        .populate('assignedMembers', 'name email avatar');

      if (!project) throw new AppError('Project not found.', 404);

      return ApiResponse.success(res, project);
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const project = await ProjectModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      });

      if (!project) throw new AppError('Project not found.', 404);

      Object.assign(project, req.body);
      await project.save();

      const populated = await ProjectModel.findById(project._id)
        .populate('clientId', 'clientName businessName')
        .populate('assignedMembers', 'name email avatar');

      emitOrgEvent(user.organizationId, 'project:updated', populated);

      return ApiResponse.success(res, populated, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id, milestoneId } = req.params;

      const project = await ProjectModel.findOne({
        _id: id,
        organizationId: user.organizationId,
      });

      if (!project) throw new AppError('Project not found.', 404);

      const milestone = (project.milestones as any).id(milestoneId);
      if (!milestone) throw new AppError('Milestone not found.', 404);

      Object.assign(milestone, req.body);
      if (req.body.status === 'Completed' && !milestone.completionDate) {
        milestone.completionDate = new Date();
      }

      await project.save();
      emitOrgEvent(user.organizationId, 'project:updated', project);

      return ApiResponse.success(res, project, 'Milestone updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
