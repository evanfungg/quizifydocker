from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import io
from flask_cors import CORS
import requests
import os


app = Flask(__name__)
CORS(app, resources={r"/flask/*": {"origins": ["http://localhost:3000", "https://quizify-roan.vercel.app"]}})


HF_API_TOKEN = os.environ.get('HUGGINGFACE_API_TOKEN')
HF_API_URL = "https://api-inference.huggingface.co/models"
HF_API_HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

@app.route('/')
def home():
    return "Wecome to the Quizify Thunderdome"

def query_huggingface_model(model_name, payload):
    response = requests.post(f"{HF_API_URL}/{model_name}", headers=HF_API_HEADERS, json=payload)
    response.raise_for_status()
    return response.json()

def split_text_into_chunks(text, max_length=200):
    sentences = text.split('. ')
    current_chunk = ""
    chunks = []

    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_length:
            current_chunk += sentence + '. '
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + '. '
    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


def generate_questions(text):
    chunks = split_text_into_chunks(text)
    all_questions = []

    for chunk in chunks:
        payload = {
            "inputs": f"generate question: {chunk}"
        }
        response = query_huggingface_model("mrm8488/t5-base-finetuned-question-generation-ap", payload)
        questions = [item['generated_text'] for item in response]
        all_questions.extend(questions)

    return list(set(all_questions))

def answer_question(question, context):
    payload = {
        "inputs": {
            "question": question,
            "context": context
        }
    }
    response = query_huggingface_model("deepset/roberta-base-squad2", payload)
   
    if response and 'answer' in response:
        return response['answer']
    else:
       
        print(f"Unexpected response format: {response}")
        return None  


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
    
    questions = generate_questions(text)
    qa_pairs = []
    unique_answers = set()

    for question in questions:
        answer = answer_question(question, text)
        
        
        if answer and answer not in unique_answers:
            unique_answers.add(answer)
            qa_pairs.append({'question': question, 'answer': answer})
        else:
            print(f"Duplicate answer detected or no answer found, skipping question: {question}")

    return jsonify({'qa_pairs': qa_pairs})


if __name__ == '__main__':
    app.run(host='0.0.0.0')


