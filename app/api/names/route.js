import connectToPostgreSQL from '@/libs/postgres';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from "next/server"; // Assuming your setup allows for this

export async function GET(request) {
    let client;

    try {
        const session = await getSession(request);

        const userId = session.user.sid; // Using `sub` as the commonly used ID in Auth0, adjust if necessary

        client = await connectToPostgreSQL();

        // This query fetches all quizzes for the user, not just the most recent
        const query = `
            SELECT quiz_id, quiz_name
            FROM quizzes
            WHERE user_id = $1
            ORDER BY quiz_id DESC;
        `;

        const result = await client.query(query, [userId]);

        // Prepare quizzes data
        let quizzes = result.rows.map(row => ({
            quizId: row.quiz_id,
            quizName: row.quiz_name
        }));

        // Respond with quizzes data
        return new NextResponse(JSON.stringify({ quizzes }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Failed to fetch quizzes:', error);
        return new NextResponse(JSON.stringify({ error: "Failed to fetch quizzes" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    } finally {
        if (client) {
            client.release();
        }
    }
}
