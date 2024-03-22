// In your API route file
import connectToPostgreSQL from '@/libs/postgres';
import { NextResponse } from "next/server";
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request) {
    let client;
    try {
        const session = await getSession();
        console.log(session)
        const { user } = session;
        console.log(user)
        
        client = await connectToPostgreSQL(); // This now returns a client

        const {user_id, user_name, qa, quiz_name, quiz_text } = await request.json();

        // Insert user without ON CONFLICT clause
        await client.query('INSERT INTO users (user_id, user_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING;', [user_id, user_name]);

        // Insert quiz using quiz_name from the request
        const quizResult = await client.query('INSERT INTO quizzes (quiz_name, user_id, quiz_text) VALUES ($1, $2, $3) RETURNING quiz_id;', [quiz_name, user_id, quiz_text]);

        const quiz_id = quizResult.rows[0].quiz_id;

        // Insert questions and answers
        for (const pair of qa) {
            const answerResult = await client.query('INSERT INTO answers (answer_text) VALUES ($1) RETURNING answer_id;', [pair.answer]);
            const answer_id = answerResult.rows[0].answer_id;

            await client.query('INSERT INTO questions (question_text, quiz_id, answer_id) VALUES ($1, $2, $3);', [pair.question, quiz_id, answer_id]);
        }

        return NextResponse.json({ message: "Quiz Saved" }, { status: 201 });

    } catch (error) {
        console.error('Failed to insert data:', error);
        return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
    } finally {
        if (client) {
            client.release(); // Release the client back to the pool
        }
    }
}

export async function GET(request) {
    let client;

    try {
        const session = await getSession(request);
        const { user } = session;

        client = await connectToPostgreSQL();

        const userId = user.sid; // Adjust based on your session's user object

        // Use a CTE to first select the most recent quiz for the user
        const query = `
        WITH recent_quiz AS (
            SELECT quiz_id, quiz_name, quiz_text
            FROM quizzes
            WHERE user_id = $1
            ORDER BY quiz_id DESC
            LIMIT 1
        )
        SELECT rq.quiz_id, rq.quiz_name, rq.quiz_text, q.question_id, q.question_text, a.answer_text
        FROM recent_quiz rq
        JOIN questions q ON rq.quiz_id = q.quiz_id
        JOIN answers a ON q.answer_id = a.answer_id;
        
        
        `;

        const result = await client.query(query, [userId]);

        // Structure the result
        let quiz = null;
        if (result.rows.length > 0) {
            quiz = {
                quizId: result.rows[0].quiz_id,
                quizName: result.rows[0].quiz_name,
                quizText: result.rows[0].quiz_text,
                questionsAndAnswers: result.rows.map(row => ({
                    questionId: row.question_id, // Assuming your row has question_id
                    questionText: row.question_text,
                    answerText: row.answer_text
                }))
            };
        }
        

        return NextResponse.json({ quiz }, { status: 200 });

    } catch (error) {
        console.error('Failed to fetch quiz:', error);
        return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
    } finally {
        if (client) {
            client.release();
        }
    }
}

// In your API route file, add a new function to handle DELETE requests.
export async function DELETE(request) {
    let client;
    try {
        const session = await getSession(request);
        if (!session || !session.user) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        // Extract questionId from query parameters instead of the path
        const url = new URL(request.url);
        // Use URLSearchParam's get method to fetch query parameters
        const questionId = url.searchParams.get("questionId");

        if (!questionId) {
            return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
        }

        client = await connectToPostgreSQL();

        // Ensure questionId is converted to the correct type if necessary (e.g., integer)
        await client.query('DELETE FROM questions WHERE question_id = $1;', [parseInt(questionId, 10)]);

        return NextResponse.json({ message: "Question and its answer deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error('Failed to delete question:', error);
        return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
    } finally {
        if (client) {
            client.release();
        }
    }
}
