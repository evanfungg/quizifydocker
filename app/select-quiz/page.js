'use client'
import React, { useState, useEffect } from 'react';
import RenderQuiz from '../components/RenderQuiz';
import './style.css'; // Assuming this is the CSS file for SelectQuiz
import Link from 'next/link';

export default function SelectQuiz() {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState('');

    useEffect(() => {
        const fetchNames = async () => {
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_FETCH_NAMES);
                // /api/names
                if (!response.ok) throw new Error("Failed to fetch Names");
                const data = await response.json();
                setQuizzes(data.quizzes);
                if (data.quizzes.length > 0) {
                    setSelectedQuizId(data.quizzes[0].quizId);
                }
            } catch (error) {
                console.error("Error fetching Names:", error);
            }
        };
        fetchNames();
    }, []);

    const handleQuizChange = (e) => {
        setSelectedQuizId(e.target.value);
    };

    return (
        <div className="main">
        <div className="content">
            {selectedQuizId && (
                <RenderQuiz key={selectedQuizId} quiz_id={selectedQuizId} />
            )}
            <div className="dropdown-container">
                <select onChange={handleQuizChange} value={selectedQuizId}>
                    {quizzes.map(quiz => (
                        <option key={quiz.quizId} value={quiz.quizId}>{quiz.quizName}</option>
                    ))}
                </select>
            </div>
        </div>
    </div>
    );
}
