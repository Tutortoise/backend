import { auth, firestore } from "@/config";

export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  const user = await auth.createUser({ displayName: name, email, password });

  await firestore.collection("users").doc(user.uid).set({
    name,
    createdAt: new Date(),
  });

  return { userId: user.uid };
};
