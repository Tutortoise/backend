import { firestore } from "../config";
import { logger } from "../middleware/logging.middleware";
import { Controller, Subject } from "../types";

export const getAllSubjects: Controller = async (_req, res) => {
  try {
    const subjects = await firestore.collection("subjects").get();
    const data = subjects.docs.map((doc) => doc.data() as Subject);

    res.json({ status: "success", data });
  } catch (error) {
    logger.error(`Error when getting all subjects: ${error}`);
    res.status(400).json({
      status: "fail",
      data: { message: "Failed to get all subjects." },
    });
  }
};
