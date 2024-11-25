import * as schema from "./schema";
import { DATABASE_URL } from "@/config";

import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(DATABASE_URL, { schema });
