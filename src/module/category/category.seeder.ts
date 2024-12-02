import { GCS_BUCKET_NAME } from "@/config";
import { container } from "@/container";
import { Category } from "@/types";

const categoryRepository = container.categoryRepository;

export const seedCategories = async () => {
  const categories: Category[] = [
    {
      name: "Astronomy",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Astronomy.png`,
    },
    {
      name: "Photography",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Photography.png`,
    },
    {
      name: "Computer",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Computer.png`,
    },
    {
      name: "Cooking",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Cooking.png`,
    },
    {
      name: "Driving",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Driving.png`,
    },
    {
      name: "Football",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Football.png`,
    },
    {
      name: "Guitar",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Guitar.png`,
    },
    {
      name: "Karate",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Karate.png`,
    },
    {
      name: "Literature",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Literature.png`,
    },
    {
      name: "Mathematics",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Mathematics.png`,
    },
    {
      name: "Piano",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Piano.png`,
    },
    {
      name: "Public Speaking",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Public Speaking.png`,
    },
    {
      name: "Singing",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Singing.png`,
    },
    {
      name: "Swimming",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Swimming.png`,
    },
    {
      name: "Painting",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Painting.png`,
    },
    {
      name: "English",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/English.png`,
    },
    {
      name: "Tennis",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Tennis.png`,
    },
    {
      name: "Chinese",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Chinese.png`,
    },
    {
      name: "Chemistry",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/categories/Chemistry.png`,
    },
  ];

  if (await categoryRepository.hasCategories()) {
    return;
  }

  console.log(`Seeding categories with ${categories.length} data...`);
  for (const category of categories) {
    await categoryRepository.createCategory(category.name, category.iconUrl);
  }
};
