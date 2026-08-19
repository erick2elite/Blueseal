import { checkSupabase } from "./supabase.js";
import { checkPostgres, initPostgresTable } from "./postgres.js";

const connectDB = async () => {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    await checkPostgres();
    await initPostgresTable();
    return true;
  }
  return checkSupabase();
};

export default connectDB;
