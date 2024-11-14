import { Service } from "typedi";
import { BaseService } from "./base.service";
import type { Subject } from "@/types";

@Service()
export class SubjectService extends BaseService {
  async getAllSubjects(): Promise<Subject[]> {
    const snapshot = await this.collection("subjects").get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      iconUrl: doc.data().iconUrl,
    }));
  }
}
