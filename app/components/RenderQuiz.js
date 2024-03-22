'use client'
import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import './styles.css'
import Link from 'next/link'

export default function RenderQuiz({quiz_id}) {
    const { user } = useUser();
    const [quiz, setQuiz] = useState(null);
    const [visibleAnswers, setVisibleAnswers] = useState(new Set());
    console.log(quiz)

    useEffect(() => {
        const fetchQuizzes = async () => {
            
            if (user && quiz_id) {
                try {
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_RENDER_QUIZ}?quiz_id=${quiz_id}`);
                    // `http://localhost:3000/api/render?quiz_id=${quiz_id}`
                    //`${process.env.NEXT_PUBLIC_DISPLAY_FETCH_QUIZ}?questionId=${questionId}`
                    if (!response.ok) throw new Error("Failed to fetch quiz");
                    const data = await response.json();
                    setQuiz(data.quiz);
                    console.log("New quiz data set:", data.quiz);
                    
                } catch (error) {
                    console.error("Error fetching quiz:", error);
                }
            }
        };
        fetchQuizzes();
    }, [user, quiz_id]); 
    

    useEffect(() => {
        console.log(`Received new quiz_id in RenderQuiz:`, quiz_id);
      
    }, [quiz_id]);

    const toggleAnswerVisibility = (questionId) => {
        const updatedVisibleAnswers = new Set(visibleAnswers);
        updatedVisibleAnswers.has(questionId) ? updatedVisibleAnswers.delete(questionId) : updatedVisibleAnswers.add(questionId);
        setVisibleAnswers(updatedVisibleAnswers);
    };

    const deleteQuestion = async (questionId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_RENDER_QUIZ}?questionId=${questionId}`, {
                // `http://localhost:3000/api/render?questionId=${questionId}`
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete question');
            alert('Question deleted successfully');
            
            setQuiz({
                ...quiz,
                questionsAndAnswers: quiz.questionsAndAnswers.filter(qna => qna.questionId !== questionId),
            });
        } catch (error) {
            console.error('Error deleting question:', error);
            alert('Error deleting question');
        }
    };

    return (
        <div className="main">
    {quiz ? (
        <div className="quiz-container">
            <div className="quiz-header">
                        <div className="quiz-title">{`${quiz.quizName} Quiz`}</div>
                        
                            
                            <button className="logout"><a href="/api/auth/logout">Logout</a></button>
                        
                    </div>
            <div className="questions-wrapper"> 
                {quiz.questionsAndAnswers.map((qna) => (
                    <div key={qna.questionId} className="question-answer-block">
                        <div className="question-flex-container">
                            <span>{qna.questionText}</span>
                            <img src="/angle-down.png" alt="Toggle Answer" className="icon-button" onClick={() => toggleAnswerVisibility(qna.questionId)} />
                            <img src="/trash.png" alt="Delete" className="icon-button" onClick={() => deleteQuestion(qna.questionId)} />
                        </div>
                        {visibleAnswers.has(qna.questionId) && <div className = 'answers'>{qna.answerText}</div>}
                    </div>
                ))}
            </div>
            <Link href="./create-quiz"><button className="create">Create New Quiz</button></Link> 
        </div>
    ) : <p>Loading quizzes...</p>}
</div>
    );
}
