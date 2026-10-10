import { getDb, createSchema } from "./db";
import { generateVarietyPhotos } from "./generate-photos";

const db = getDb();
createSchema(db);
generateVarietyPhotos(db);
