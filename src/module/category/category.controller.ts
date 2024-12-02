import { container } from "@/container";
import { CategoryService } from "@/module/category/category.service";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";

const categoryService = new CategoryService({
  categoryRepository: container.categoryRepository,
});

export const getAllCategories: Controller = async (_req, res) => {
  try {
    const categories = await categoryService.getAllCategories();

    res.json({ status: "success", data: categories });
  } catch (error) {
    logger.error(`Error when getting all categories: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get all categories",
    });
  }
};

export const getPopularCategories: Controller = async (_req, res) => {
  try {
    const categories = await categoryService.getPopularCategories();

    res.json({
      status: "success",
      data: categories,
    });
  } catch (error) {
    logger.error(`Error when getting popular categories: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get popular categories",
    });
  }
};

export const getAvailableCategories: Controller = async (req, res) => {
  try {
    const categories = await categoryService.getAvailableCategories(
      req.tutor.id,
    );

    res.json({
      status: "success",
      data: categories,
    });
  } catch (error) {
    logger.error(`Error when getting available categories: ${error}`);
    res.status(400).json({
      status: "fail",
      message: "Failed to get available categories",
    });
  }
};
