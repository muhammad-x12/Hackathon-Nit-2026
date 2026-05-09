import sys
import docx
import fitz  # PyMuPDF
import json

def read_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text.strip()

def read_docx(file_path):
    doc = docx.Document(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text.strip()

files = [
    "c:\\Users\\Renderverse\\Pictures\\School_BE\\header footer msb dropship final.pdf",
    "c:\\Users\\Renderverse\\Pictures\\School_BE\\msb dropship.pdf",
    "c:\\Users\\Renderverse\\Pictures\\School_BE\\school dashboard.docx",
    "c:\\Users\\Renderverse\\Pictures\\School_BE\\super admin dashboard.docx",
    "c:\\Users\\Renderverse\\Pictures\\School_BE\\supplier dashboard.docx"
]

results = {}
for file in files:
    try:
        if file.endswith('.pdf'):
            results[file.split('\\')[-1]] = read_pdf(file)
        elif file.endswith('.docx'):
            results[file.split('\\')[-1]] = read_docx(file)
    except Exception as e:
        results[file.split('\\')[-1]] = f"Error: {e}"

print(json.dumps(results, indent=2))
