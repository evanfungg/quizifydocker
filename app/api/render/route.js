import connectToPostgreSQL from '@/libs/postgres';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from "next/server";

export async function GET(request) {
    let client;

    try {
        const session = await getSession(request);
        if (!session || !session.user) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        // Extract quiz_id from the query parameters
        const url = new URL(request.url);
        const quiz_id = url.searchParams.get("quiz_id");

        client = await connectToPostgreSQL();

        if (quiz_id) {
            // Adjusted query to fetch a specific quiz by quiz_id
            const quizQuery = `
                SELECT quiz_id, quiz_name, quiz_text
                FROM quizzes
                WHERE quiz_id = $1;
            `;
            const quizResult = await client.query(quizQuery, [quiz_id]);

            // Fetch related questions and answers if quiz exists
            let quizData = null;
            if (quizResult.rows.length > 0) {
                const quiz = quizResult.rows[0];
                
                const qnaQuery = `
                    SELECT q.question_id, q.question_text, a.answer_text
                    FROM questions q
                    JOIN answers a ON q.answer_id = a.answer_id
                    WHERE q.quiz_id = $1;
                `;
                const qnaResult = await client.query(qnaQuery, [quiz_id]);

                quizData = {
                    quizId: quiz.quiz_id,
                    quizName: quiz.quiz_name,
                    quizText: quiz.quiz_text,
                    questionsAndAnswers: qnaResult.rows.map(row => ({
                        questionId: row.question_id,
                        questionText: row.question_text,
                        answerText: row.answer_text
                    }))
                };
            }

            return NextResponse.json({ quiz: quizData }, { status: 200, headers: { 'Content-Type': 'application/json' } });

        } else {
            return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 });
        }

    } catch (error) {
        console.error('Failed to fetch quiz:', error);
        return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
    } finally {
        if (client) {
            client.release();
        }
    }
}



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
