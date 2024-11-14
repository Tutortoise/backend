import { Service } from "typedi";
import { firestore } from "@/config";

@Service()
export class BaseService {
  protected collection(name: string) {
    return firestore.collection(name);
  }
}
