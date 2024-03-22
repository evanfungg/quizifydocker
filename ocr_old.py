# from flask import Flask, request, jsonify
# from transformers import (
#     T5Tokenizer, 
#     T5ForConditionalGeneration, 
#     AutoTokenizer, 
#     AutoModelForQuestionAnswering,
#     pipeline
# )
# import pytesseract
# from PIL import Image
# import io
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)
# app.debug = True

# @app.route('/')
# def home():
#     return "Welcome to the Quizify Api"

# # Initialize T5 for question generation
# qg_tokenizer = T5Tokenizer.from_pretrained("mrm8488/t5-base-finetuned-question-generation-ap")
# qg_model = T5ForConditionalGeneration.from_pretrained("mrm8488/t5-base-finetuned-question-generation-ap")

# # Initialize model for question answering
# qa_tokenizer = AutoTokenizer.from_pretrained("deepset/roberta-base-squad2")
# qa_model = AutoModelForQuestionAnswering.from_pretrained("deepset/roberta-base-squad2")
# qa_pipeline = pipeline("question-answering", model=qa_model, tokenizer=qa_tokenizer)

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
#         input_text = f"generate question: {chunk}"
#         input_ids = qg_tokenizer.encode(input_text, return_tensors='pt', max_length=512, truncation=True)
#         outputs = qg_model.generate(
#             input_ids, 
#             num_return_sequences=1, 
#             max_length=100, 
#             num_beams=5,
#             temperature=1.0,
#             top_k=50,
#             top_p=0.99
#         )
#         questions = [qg_tokenizer.decode(output, skip_special_tokens=True).replace("question:", "").strip() for output in outputs]
#         all_questions.extend(questions)
    
#     return list(set(all_questions))


# def answer_question(question, context):
#     return qa_pipeline(question=question, context=context)

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
#     unique_answers = set()  # Initialize a set to track unique answers

#     for question in questions:
#         answer_data = answer_question(question, text)
#         answer = answer_data['answer']
        
#         # Check if the answer is unique
#         if answer not in unique_answers:
#             unique_answers.add(answer)  # Add the answer to the set of unique answers
#             qa_pairs.append({'question': question, 'answer': answer})
#         else:
#             print(f"Duplicate answer detected, skipping: {answer}")

#     return jsonify({'qa_pairs': qa_pairs})


# if __name__ == '__main__':
#     app.run(host='0.0.0.0')


