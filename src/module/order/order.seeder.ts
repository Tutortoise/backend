import { container } from "@/container";
import { faker } from "@faker-js/faker";

const learnerRepository = container.learnerRepository;
const tutoriesRepository = container.tutoriesRepository;

const orderRepository = container.orderRepository;

export const seedOrders = async () => {
  const [learners, tutories] = await Promise.all([
    learnerRepository.getLearners(),
    tutoriesRepository.getTutories(),
  ]);

  if (learners.length === 0 || tutories.length === 0) {
    throw new Error("Learners or tutories not found");
  }

  console.log(`Seeding orders with ${learners.length} data...`);
  for (let i = 0; i < learners.length; i++) {
    const sessionTime = faker.date.between({
      from: "2024-01-01",
      to: "2024-11-30",
    });
    const totalHours = faker.number.int({ min: 1, max: 5 });
    const estimatedEndTime = new Date(sessionTime);
    estimatedEndTime.setHours(estimatedEndTime.getHours() + totalHours);

    const randomTutories = faker.helpers.arrayElement(tutories);

    await orderRepository.createOrder({
      learnerId: learners[i].id,
      tutoriesId: randomTutories.id,
      sessionTime,
      totalHours,
      estimatedEndTime,
      typeLesson:
        randomTutories.typeLesson === "both"
          ? "online"
          : randomTutories.typeLesson,
      status: "completed",
      price: randomTutories.hourlyRate * totalHours,
    });
  }
};
