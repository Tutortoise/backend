import { Service } from "typedi";
import { auth } from "@/config";
import { BaseService } from "./base.service";
import type { RegisterBody } from "@/types";

@Service()
export class AuthService extends BaseService {
  async register(data: RegisterBody) {
    const user = await auth.createUser({
      displayName: data.name,
      email: data.email,
      password: data.password,
    });

    await this.collection("users").doc(user.uid).set({
      name: data.name,
      createdAt: new Date(),
    });

    return user;
  }
}
