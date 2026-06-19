import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DatabaseError } from "#/lib/errors.ts";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
	throw new DatabaseError(
		"DATABASE_URL is not configured. Check your environment variable.",
	);
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

/*
 	Involves a Drizzle query and converts any connection failure
 	(timeout, db unavailable, etc.) into a typed DatabaseError.
 */
export async function withDatabaseErrorHandling<T>(
	queryFn: () => Promise<T>,
): Promise<T> {
	try {
		return await queryFn();
	} catch (error) {
		// Erros de domínio (NotFoundError, UnauthorizedError, etc.) não devem
		// ser mascarados — só convertemos falhas reais de infraestrutura.
		if (error instanceof DatabaseError) throw error;

		console.error("[Database] Query failed:", error);
		throw new DatabaseError();
	}
}
