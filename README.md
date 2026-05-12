# 🏠 AI-Powered Real Estate Price Estimation System

An intelligent full-stack web application that predicts Bengaluru house prices using Machine Learning and provides an AI-powered real estate assistant chatbot.

---

# 🚀 Features

- 🏡 Predict house prices based on:
  - Location
  - BHK
  - Bathrooms
  - Square Foot Area

- 📍 Dynamic Location Dropdown
- 🤖 AI-Powered Real Estate Chatbot
- 📊 Machine Learning Based Price Prediction
- 🎨 Responsive UI Design
- ⚡ Fast Flask Backend API
- 🌐 Full Stack Web Application

---

# 🛠️ Tech Stack

## Frontend
- HTML
- CSS
- JavaScript

## Backend
- Flask
- Flask-CORS
- Gunicorn

## Machine Learning
- Scikit-learn
- Pandas
- NumPy

## AI Chatbot
- Transformers
- Sentence Transformers
- FAISS

---

# 📂 Project Structure

```bash
AI-Powered-Real-Estate-Price-Estimator/
│
├── client/
│   ├── index.html
│   ├── app.css
│   ├── app.js
│   ├── favicon.png
│   └── chat.avif
│
├── model/
│   ├── Bengaluru_House_Data.csv
│   ├── Project.ipynb
│   ├── bengaluru_home_price_model.pickel
│   └── columns.json
│
├── server/
│   ├── artifacts/
│   │   ├── bengaluru_home_price_model.pickel
│   │   └── columns.json
│   │
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── server.py
│   ├── util.py
│   └── render.yaml
