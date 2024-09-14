from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import PyPDF2 as pdf
import re
import string
import numpy as np
import tensorflow as tf
import pickle

print(tf.__version__)

from tensorflow.keras.preprocessing.text import Tokenizer  # type: ignore
from tensorflow.keras.preprocessing.sequence import pad_sequences  # type: ignore
from tensorflow import keras

ALLOWED_EXTENSIONS = set(["pdf"])
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "Downloads"))
app = Flask(__name__)
CORS(app) 
app.config["DEBUG"] = True
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1000 * 1000
app.config["CORS_HEADER"] = "application/json"
model_tf = keras.models.load_model("cv_recruitment.keras")

with open("tokenizer.pickle", "rb") as handle:
    tokenizer = pickle.load(handle)

categories = [
    "Advocate",
    "Arts",
    "Automation Testing",
    "Blockchain",
    "Business Analyst",
    "Civil Engineer",
    "Data Science",
    "Database",
    "DevOps Engineer",
    "DotNet Developer",
    "ETL Developer",
    "Electrical Engineering",
    "HR",
    "Hadoop",
    "Health and fitness",
    "Java Developer",
    "Mechanical Engineer",
    "Network Security Engineer",
    "Operations Manager",
    "PMO",
    "Python Developer",
    "SAP Developer",
    "Sales",
    "Testing",
    "Web Designing",
]


def allowedFile(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def clean_text(text):
    text = text.lower()
    text = re.sub(r"https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*", " ", text)
    text = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b", " ", text)
    text = re.sub(r"<.*?>", " ", text)
    text = re.sub(r"\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}", " ", text)
    text = re.sub(r"\b\d+\b", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    text = re.sub(f"[{string.punctuation}]", " ", text)
    text = " ".join(text.split())

    return text


def predict_pdf(text, type):
    predict_clean_text = clean_text(text)
    tokens_new = tokenizer.texts_to_sequences([predict_clean_text])
    pads_new = pad_sequences(tokens_new, maxlen=200, padding="post")
    single_input_new = np.expand_dims(pads_new[0], axis=0)
    prediction = model_tf.predict(single_input_new)

    return_values = {
        "primaryresult": {
            "percentage": None,
            "position": None,
        },
        "otherresults": [],
    }

    for idx, p_1 in enumerate(prediction[0]):
        percentage = (p_1 * 100).round(2)

        if type == categories[idx]:
            return_values["primaryresult"]["percentage"] = percentage
            return_values["primaryresult"]["position"] = type
        else:
            if percentage > 15.0:
                return_values["otherresults"].append(
                    {"percentage": percentage, "position": categories[idx]}
                )

    return return_values


@app.route("/", methods=["GET"])
def home():
    return "<h1>Recruitment API</h1>"


@app.route("/upload", methods=["POST", "GET"])
def fileUpload():
    if request.method == "POST":
        type_category = request.form["type"]
        if type_category is None:
            return jsonify({"msg": "The Type must be in the Form Data"})

        file = request.files.getlist("files")
        for f in file:
            pdf_f = pdf.PdfReader(f)

            text = ""
            for page_num in range(len(pdf_f.pages)):
                page = pdf_f.pages[page_num]
                text += page.extract_text()

        return jsonify(predict_pdf(text, type_category))
    else:
        return jsonify({"status": "Upload API GET Request Running"})


app.run()
