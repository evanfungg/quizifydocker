
'use client'
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import './style.css'

export default function PhotoUpload() {
    const [extractedText, setExtractedText] = useState('');
    const [qaPairs, setQaPairs] = useState([ { question: "What is the capital of France?", answer: "Paris" },
    { question: "Who wrote 'Hamlet'?", answer: "William Shakespeare" },
    { question: "What is the formula for water?", answer: "H2O" },]);
    const [isLoading, setIsLoading] = useState(false);
    const [quizName, setQuizName] = useState('');
    const { user, error} = useUser();
    const [visibleAnswers, setVisibleAnswers] = useState([]); // New state to track visible answers
    
    const toggleAnswerVisibility = (index) => {
        // Use a set for efficient add/remove checks
        const updatedVisibleAnswers = new Set(visibleAnswers);
        if (updatedVisibleAnswers.has(index)) {
            updatedVisibleAnswers.delete(index);
        } else {
            updatedVisibleAnswers.add(index);
        }
        setVisibleAnswers(Array.from(updatedVisibleAnswers));
    };
    

    

    const handleSubmit = async (event) => {
        const user_id = user.sid;
        const user_name = user.name;
        event.preventDefault();
        setIsLoading(true);
        const uploadedFile = event.target.elements.uploadedFile.files[0];

        if (uploadedFile) {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            try {
                const ocrResponse = await fetch(process.env.NEXT_PUBLIC_IMAGE_OCR, {
                    //http://127.0.0.1:5328/flask/image-ocr
                    //https://quizify-556c7d98410b.herokuapp.com/flask/image-ocr
                    method: 'POST',
                    body: formData,
                });

                if (ocrResponse.ok) {
                    const ocrData = await ocrResponse.json();
                    setExtractedText(ocrData.text);

                    const qaResponse = await fetch(process.env.NEXT_PUBLIC_GENERATE_QA, {
                        //https://quizify-556c7d98410b.herokuapp.com/flask/generate-qa
                        //http://127.0.0.1:5328/flask/generate-qa
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: ocrData.text }),
                    });

                    if (qaResponse.ok) {
                        const qaData = await qaResponse.json();
                        
                        setQaPairs(qaData.qa_pairs); 
                        const qa = qaData.qa_pairs
                        
                       
                        try {
                            const res = await fetch(process.env.NEXT_PUBLIC_CREATE_QUIZ_STORE, {
                            //http://localhost:3000/api/quiz
                            method: "POST",
                            headers: {
                                "Content-type": "application/json",
                            },
                            body: JSON.stringify({
                                qa: qa,
                                user_id: user_id,
                                user_name: user_name,
                                quiz_name: quizName,
                                quiz_text: ocrData.text
                                
        
                            }),

                        });

                        

                        if (!res.ok) {
                            throw new Error("Failed to add Quiz");
                          }
                    
                          alert("Quiz added");
                          window.location.href = './display-quiz';
                        } catch (error) {
                          console.error("Error creating quiz:", error);
                          alert("Error creating quiz: " + error.message);
                        }
                           
                    } else {
                        console.error('Failed to generate question-answer pairs.');
                    }
                } else {
                    console.error('OCR processing failed.');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        console.log(qaPairs);
    };

    return (
        <main className="main">
            <div className="container">
                <div className="content">
                    <div className="header">
                        <img src="./quizify.jpg" alt="Quizify Logo" className="logo"/>
                        <div className="title">Quizify</div>
                    </div>
                    {isLoading ? (
                        <div className="loading-message">Generating quiz...</div>
                    ) : (
                        <>
                        <form className="form-container" onSubmit={handleSubmit}>
                            <input className="file-btn" type="file" name="uploadedFile" accept="image/*" />
                            <input className="quiz-name" type="text" placeholder="Enter Quiz Name" onChange={(e) => setQuizName(e.target.value)} value={quizName}/>
                            <button className="submit" type="submit">Create Quiz</button>
                        </form>
                        <div className="disclaimer">For best results, please use a screenshotted image of text of substantial size.</div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
