import { generateSampleData, retryOperation } from "@/common/groq.seeder";
import { container } from "@/container";
import { faker } from "@faker-js/faker";

const orderRepository = container.orderRepository;
const reviewRepository = container.reviewRepository;

function prompt(rating: number, category: string, title: string) {
  return `You are a learner that is learning category ${category}.
You are learning from a tutor about ${title}, your rating is ${rating} out of 5. Explain your experience with the tutor.
The JSON schema should include
{
  "message": "string (min 10 characters, max 1000 characters)",
}`;
}

export const seedReviews = async ({ generateWithGroq = false }) => {
  const orders = await orderRepository.getOrders({});

  if (orders.length === 0) {
    throw new Error("Order not found");
  }

  console.log(`Seeding reviews with ${orders.length} data...`);
  for (let i = 0; i < orders.length; i++) {
    const rating = faker.number.int({ min: 1, max: 5 });
    const { message } = generateWithGroq
      ? await retryOperation(async () => {
          const result = await generateSampleData(
            prompt(rating, orders[i].categoryName, orders[i].name),
          );

          if (result.message.length < 10 || result.message.length > 1000) {
            throw new Error(
              "Message length must be between 10 and 1000 characters",
            );
          }

          return result;
        })
      : faker.lorem.sentence();

    await reviewRepository.createReview({
      orderId: orders[i].id,
      rating,
      message,
    });
  }
};
