import { Container } from "typedi";
import { SubjectService } from "@services/subject.service";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";

const subjectService = Container.get(SubjectService);

export const getAllSubjects: Controller = async (_req, res) => {
  try {
    const subjects = await subjectService.getAllSubjects();
    res.json({
      status: "success",
      data: subjects,
    });
  } catch (error) {
    logger.error(`Error when getting all subjects: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get all subjects",
    });
  }
};
