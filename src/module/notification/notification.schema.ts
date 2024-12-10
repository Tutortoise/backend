import { z } from "zod";

const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0),
      "Limit must be a positive number",
    ),
  before: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(new Date(val).getTime()),
      "Before must be a valid date",
    ),
});

export const getNotificationsSchema = z.object({
  query: paginationSchema,
});

export const markAsReadSchema = z.object({
  params: z.object({
    notificationId: z.string().uuid("Invalid notification ID"),
  }),
});

export type GetNotificationsSchema = z.infer<typeof getNotificationsSchema>;
export type MarkAsReadSchema = z.infer<typeof markAsReadSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
