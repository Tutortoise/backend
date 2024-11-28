import { container } from "@/container";
import { SubjectService } from "@/module/subject/subject.service";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";

const subjectService = new SubjectService({
  subjectRepository: container.subjectRepository,
});

export const getAllSubjects: Controller = async (_req, res) => {
  try {
    const subjects = await subjectService.getAllSubjects();

    res.json({ status: "success", data: subjects });
  } catch (error) {
    logger.error(`Error when getting all subjects: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get all subjects",
    });
  }
};

export const getPopularSubjects: Controller = async (_req, res) => {
  try {
    const subjects = await subjectService.getPopularSubjects();

    res.json({
      status: "success",
      data: subjects,
    });
  } catch (error) {
    logger.error(`Error when getting popular subjects: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get popular subjects",
    });
  }
};

export const getAvailableSubjects: Controller = async (req, res) => {
  try {
    const subjects = await subjectService.getAvailableSubjects(req.tutor.id);

    res.json({
      status: "success",
      data: subjects,
    });
  } catch (error) {
    logger.error(`Error when getting available subjects: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get available subjects",
    });
  }
};
