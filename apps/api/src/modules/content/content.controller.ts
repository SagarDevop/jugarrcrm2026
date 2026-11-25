import { Request, Response, NextFunction } from 'express';
import { ContentItemModel } from '../../models/content.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { config } from '../../config';

export class ContentController {
  static async listContent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.category) filter.category = req.query.category;
      if (req.query.status) filter.status = req.query.status;

      const items = await ContentItemModel.find(filter)
        .populate('createdBy', 'name email avatar')
        .sort({ updatedAt: -1 });

      return ApiResponse.success(res, items);
    } catch (error) {
      next(error);
    }
  }

  static async createContent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const item = await ContentItemModel.create({
        ...req.body,
        organizationId: user.organizationId,
        createdBy: user._id,
      });

      return ApiResponse.success(res, item, 'Content item created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // AI Content Assistant Generation Stub (With safe provider configuration)
  static async generateAiPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { promptType, topic, targetAudience, industry } = req.body;

      if (!topic) throw new AppError('Topic is required for content generation.', 400);

      // Built-in intelligent templating engine
      let generatedDraft = '';
      if (promptType === 'video_script') {
        generatedDraft = `[HOOK (0-3s)]: Are you still struggling with ${topic} in ${industry || 'your business'}? Here is what 99% get wrong.\n\n[PAIN POINT (3-15s)]: Most agencies and businesses waste hundreds of hours manually handling this without a reliable system.\n\n[SOLUTION & VALUE (15-45s)]: Step 1: Standardize the process.\nStep 2: Automate recurring touchpoints.\nStep 3: Measure results every 7 days.\n\n[CALL TO ACTION (45-60s)]: Comment 'SCALE' below or DM us to get our complete checklist.`;
      } else if (promptType === 'reel_idea') {
        generatedDraft = `Title: 3 ${industry || 'Industry'} Secrets About ${topic}\nConcept: B-roll showing high-energy workspace with punchy on-screen text.\nAudio: Trending upbeat lofi / business momentum track.\nCaption: Why nobody talks about the real cost of ignoring ${topic}. Save this before you start your next campaign!`;
      } else {
        generatedDraft = `High-converting copy for ${topic} targeting ${targetAudience || 'business owners'}.\n\nHeadline: Transform How You Approach ${topic}.\nKey Takeaway: Deliver measurable outcomes rather than raw outputs.\nHashtags: #${(industry || 'business').replace(/\s+/g, '')} #${topic.replace(/\s+/g, '')} #agencyos #growth`;
      }

      return ApiResponse.success(res, {
        promptType,
        topic,
        generatedContent: generatedDraft,
        videoApiConfigured: config.videoGen.enabled,
      });
    } catch (error) {
      next(error);
    }
  }
}
