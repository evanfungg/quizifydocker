
from flask import Flask, request, jsonify
import io
from PIL import Image
import pytesseract
import cohere
from flask_cors import CORS
import os
import json
app = Flask(__name__)
CORS(app, resources={r"/flask/*": {"origins": ["http://localhost:3000", "https://quizify-roan.vercel.app", "https://quizify.evanfung.tech"]}})
COHERE_API_KEY = os.environ.get('COHERE_API_KEY')
co = cohere.Client(COHERE_API_KEY)


@app.route('/')
def home():
    return "Welcome to the Quizify API"

@app.route('/flask/image-ocr', methods=['POST'])
def image_ocr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    image = Image.open(io.BytesIO(file.read()))
    extracted_text = pytesseract.image_to_string(image)
    return jsonify({'text': extracted_text})

@app.route('/flask/generate-qa', methods=['POST'])
def generate_qa():
    content = request.json
    text = content.get('text')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    questions_prompt = f"""Given the text: "{text}", efficiently generate a list of 7 unique questions based on the text in one single operation. 
    Format the output as a JSON object with keys as "q1", "q2", ..., "q10", and their corresponding questions as values. 
    For instance, if the text were about penguins, the expected output format would be: 
    {{"q1": "What is the average weight of an Emperor Penguin?", "q2": "Where do penguins live?", ..., "q7": "How do penguins communicate?"}}.
    Please adhere to this structured format strictly and use double quotes for both keys and values and only include the JSON object."""

    questions_response = co.generate(
        prompt=questions_prompt,
        max_tokens=600,
        temperature=0.5,
    )

    
    print("Raw response:", questions_response.generations[0].text)

    questions_dict = json.loads(questions_response.generations[0].text)
    
    answers_prompt = f"""Given the text: "{text}" and the questions: "{questions_dict}", efficiently generate a list of 10 answers based on the text and the questions in one single operation. 
    Format the output as a JSON object with keys as "a1", "a2", ..., "a7", and their corresponding answers as values. a1 should be the answer for q1 and a2 should be the answer for q2.
    For instance, if the text were about penguins, the expected output format would be: 
    {{"a1": "The average weight of an Emperor Penguin is 57 pounds", "a2": Penguins live in the north pole", ..., "a10": "Penguins communicate by flapping"}}.
    Please adhere to this structured format strictly and use double quotes for both keys and values and only include the JSON object."""

    

    answers_response = co.generate(
        prompt=answers_prompt,
        max_tokens=1000,
        temperature=0.5,
    )

    print("Raw response:", answers_response.generations[0].text)
    answers_dict = json.loads(answers_response.generations[0].text)


    qa_pairs = []

    
    for q_key in questions_dict:
        
        a_key = q_key.replace('q', 'a')
       
        qa_pairs.append({
            'question': questions_dict[q_key],
            'answer': answers_dict[a_key]
        })

   
    return jsonify({'qa_pairs': qa_pairs})


if __name__ == '__main__':
    app.run(host='0.0.0.0')


