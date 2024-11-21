import { Firestore } from "firebase-admin/firestore";
import { Auth } from "firebase-admin/lib/auth/auth";
import { FCMService } from "@/common/fcm.service";

type AuthServiceDependencies = {
  auth: Auth;
  firestore: Firestore;
  fcmService: FCMService;
};

export class AuthService {
  private auth: Auth;
  private firestore: Firestore;
  private fcmService: FCMService;

  constructor({ auth, firestore, fcmService }: AuthServiceDependencies) {
    this.auth = auth;
    this.firestore = firestore;
    this.fcmService = fcmService;
  }

  async registerLearner(name: string, email: string, password: string) {
    const user = await this.auth.createUser({
      displayName: name,
      email,
      password,
    });

    await Promise.all([
      this.auth.setCustomUserClaims(user.uid, { role: "learner" }), // to insert `role` into jwt payload
      this.firestore.collection("learners").doc(user.uid).set({
        name,
        createdAt: new Date(),
      }),
    ]);

    return { userId: user.uid };
  }

  async registerTutor(name: string, email: string, password: string) {
    const user = await this.auth.createUser({
      displayName: name,
      email,
      password,
    });

    await Promise.all([
      this.auth.setCustomUserClaims(user.uid, { role: "tutor" }), // to insert `role` into jwt payload
      this.firestore.collection("tutors").doc(user.uid).set({
        name,
        createdAt: new Date(),
      }),
    ]);

    return { userId: user.uid };
  }

  async storeFCMToken(userId: string, token: string) {
    await this.fcmService.storeUserToken(userId, token);
  }

  async removeFCMToken(userId: string, token: string) {
    await this.fcmService.removeUserToken(userId, token);
  }
}
