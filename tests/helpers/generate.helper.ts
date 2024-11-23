import { faker } from "@faker-js/faker";

const emails = faker.helpers.uniqueArray(faker.internet.email, 100);
const usedEmails = new Set<string>();

// Function to generate a random user with a specific role
export function generateUser(role: "learner" | "tutor") {
  let email: string;

  do {
    email = faker.helpers.arrayElement(emails);
  } while (usedEmails.has(email)); // Keep generating until we find an unused email
  // Mark this email as used
  usedEmails.add(email);

  return {
    name: faker.person.fullName(),
    email: email,
    password: faker.internet.password(),
    role,
  };
}
