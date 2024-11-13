import { firestore } from "@/config";
import { Controller, Subject } from "@/types";
import { logger } from "@middleware/logging.middleware";

export const getAllSubjects: Controller = async (_req, res) => {
  try {
    const subjectsRef = firestore.collection("subjects");
    const snapshot = await subjectsRef.get();

    const subjects = snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        name: doc.data().name,
        iconUrl: doc.data().iconUrl,
      };
    });

    res.json({ status: "success", data: subjects });
  } catch (error) {
    logger.error(`Error when getting all subjects: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get all subjects.",
    });
  }
};
