import { auth } from "@/config";
import { learnersCollection, tutorsCollection } from "@/config/db";

export const registerLearner = async (
  name: string,
  email: string,
  password: string,
) => {
  const user = await auth.createUser({ displayName: name, email, password });

  await Promise.all([
    auth.setCustomUserClaims(user.uid, { role: "learner" }), // to insert `role` into jwt payload
    learnersCollection.doc(user.uid).set({
      name,
      createdAt: new Date(),
    }),
  ]);

  return { userId: user.uid };
};

export const registerTutor = async (
  name: string,
  email: string,
  password: string,
) => {
  const user = await auth.createUser({ displayName: name, email, password });

  await Promise.all([
    auth.setCustomUserClaims(user.uid, { role: "tutor" }), // to insert `role` into jwt payload
    tutorsCollection.doc(user.uid).set({
      name,
      createdAt: new Date(),
    }),
  ]);

  return { userId: user.uid };
};
