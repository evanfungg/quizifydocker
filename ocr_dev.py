# from flask import Flask, request, jsonify
# import pytesseract
# from PIL import Image
# import io
# from flask_cors import CORS
# import requests
# import os


# app = Flask(__name__)
# CORS(app, resources={r"/flask/*": {"origins": ["http://localhost:3000", "https://your-production-domain.com"]}})


# HF_API_TOKEN = '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'
# HF_API_URL = "https://api-inference.huggingface.co/models"
# HF_API_HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

# @app.route('/')
# def home():
#     return "Wecome to the Quizify Api"

# def query_huggingface_model(model_name, payload):
#     response = requests.post(f"{HF_API_URL}/{model_name}", headers=HF_API_HEADERS, json=payload)
#     response.raise_for_status()
#     return response.json()

# def split_text_into_chunks(text, max_length=200):
#     sentences = text.split('. ')
#     current_chunk = ""
#     chunks = []

#     for sentence in sentences:
#         if len(current_chunk) + len(sentence) < max_length:
#             current_chunk += sentence + '. '
#         else:
#             chunks.append(current_chunk.strip())
#             current_chunk = sentence + '. '
#     if current_chunk:
#         chunks.append(current_chunk.strip())

#     return chunks


# def generate_questions(text):
#     chunks = split_text_into_chunks(text)
#     all_questions = []

#     for chunk in chunks:
#         payload = {
#             "inputs": f"generate question: {chunk}"
#         }
#         response = query_huggingface_model("mrm8488/t5-base-finetuned-question-generation-ap", payload)
#         questions = [item['generated_text'] for item in response]
#         all_questions.extend(questions)

#     return list(set(all_questions))

# def answer_question(question, context):
#     payload = {
#         "inputs": {
#             "question": question,
#             "context": context
#         }
#     }
#     response = query_huggingface_model("deepset/roberta-base-squad2", payload)
   
#     if response and 'answer' in response:
#         return response['answer']
#     else:
       
#         print(f"Unexpected response format: {response}")
#         return None  


# @app.route('/flask/image-ocr', methods=['POST'])
# def image_ocr():
#     if 'file' not in request.files:
#         return jsonify({'error': 'No file part'}), 400
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({'error': 'No selected file'}), 400
#     image = Image.open(io.BytesIO(file.read()))
#     extracted_text = pytesseract.image_to_string(image)
#     return jsonify({'text': extracted_text})

# @app.route('/flask/generate-qa', methods=['POST'])
# def generate_qa():
#     content = request.json
#     text = content.get('text')
#     if not text:
#         return jsonify({'error': 'No text provided'}), 400
    
#     questions = generate_questions(text)
#     qa_pairs = []
#     unique_answers = set()

#     for question in questions:
#         answer = answer_question(question, text)
        
        
#         if answer and answer not in unique_answers:
#             unique_answers.add(answer)
#             qa_pairs.append({'question': question, 'answer': answer})
#         else:
#             print(f"Duplicate answer detected or no answer found, skipping question: {question}")

#     return jsonify({'qa_pairs': qa_pairs})


# if __name__ == '__main__':
#     app.run(port=5328)


from flask import Flask, request, jsonify
import io
from PIL import Image
import pytesseract
import cohere
from flask_cors import CORS
import json
import requests
import os
app = Flask(__name__)
CORS(app, resources={r"/flask/*": {"origins": ["http://localhost:3000", "https://quizify-roan.vercel.app"]}})
app.debug = True 
co = cohere.Client("0jmZd2S62ns7sgm6cVCZIER9kDsH3TipMwCWpa2Q")

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

    questions_prompt = f"""Given the text: "{text}", efficiently generate a list of 10 unique questions based on the text in one single operation. 
    Format the output as a JSON object with keys as "q1", "q2", ..., "q10", and their corresponding questions as values. 
    For instance, if the text were about penguins, the expected output format would be: 
    {{"q1": "What is the average weight of an Emperor Penguin?", "q2": "Where do penguins live?", ..., "q10": "How do penguins communicate?"}}.
    Please adhere to this structured format strictly and use double quotes for both keys and values and only include the JSON object."""

    questions_response = co.generate(
        prompt=questions_prompt,
        max_tokens=600,
        temperature=0.5,
    )

    # Since the response might not be in perfect JSON format, let's print it for debugging
    print("Raw response:", questions_response.generations[0].text)

    questions_dict = json.loads(questions_response.generations[0].text)
    
    answers_prompt = f"""Given the text: "{text}" and the questions: "{questions_dict}", efficiently generate a list of 10 answers based on the text and the questions in one single operation. 
    Format the output as a JSON object with keys as "a1", "a2", ..., "a10", and their corresponding answers as values. a1 should be the answer for q1 and a2 should be the answer for q2.
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
    app.run(debug=True, port=5328)

# @app.route('/')
# def home():
#     return "Welcome to the Quizify API"

# @app.route('/flask/image-ocr', methods=['POST'])
# def image_ocr():
#     if 'file' not in request.files:
#         return jsonify({'error': 'No file part'}), 400
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({'error': 'No selected file'}), 400
#     image = Image.open(io.BytesIO(file.read()))
#     extracted_text = pytesseract.image_to_string(image)
#     return jsonify({'text': extracted_text})

# @app.route('/flask/generate-qa', methods=['POST'])
# def generate_qa():
#     content = request.json
#     text = content.get('text')
#     if not text:
#         return jsonify({'error': 'No text provided'}), 400
    
#     qa_pairs = []
#     seen_questions = set()
#     while len(qa_pairs) < 2:
        
#         question_response = co.generate(
#             prompt=f"This text: \"{text}\". Generate a question based on the text above.",
#             max_tokens=60,
#             temperature=0.5,
#             stop_sequences=["\n"]
#         )
#         question = question_response.generations[0].text.strip().rstrip("?") + "?"
        
#         if question not in seen_questions:
#             seen_questions.add(question)

            
#             answer_response = co.generate(
#                 prompt=f"The text is \"{text}\". The question is: {question} Answer the question based on the text.",
#                 max_tokens=200,
#                 temperature=0.5,
#                 stop_sequences=["\n"]
#             )
#             answer = answer_response.generations[0].text.strip()

#             qa_pairs.append({'question': question, 'answer': answer})

#     return jsonify({'qa_pairs': qa_pairs})

