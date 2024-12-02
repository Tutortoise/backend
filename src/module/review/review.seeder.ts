import { container } from "@/container";
import { faker } from "@faker-js/faker";

const orderRepository = container.orderRepository;
const reviewRepository = container.reviewRepository;

export const seedReviews = async () => {
  const orders = await orderRepository.getOrders({});

  if (orders.length === 0) {
    throw new Error("Order not found");
  }

  console.log(`Seeding reviews with ${orders.length} data...`);
  for (let i = 0; i < orders.length; i++) {
    await reviewRepository.createReview({
      orderId: orders[i].id,
      rating: faker.number.int({ min: 1, max: 5 }),
      message: faker.lorem.sentence(),
    });
  }
};
