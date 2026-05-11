from flask import Flask, request, jsonify
from flask_cors import CORS
import util
import pandas as pd
import os
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# -------------------- PRICE PREDICTION APIs --------------------

@app.route('/api/get_location_names')
def get_location_names():
    response = jsonify({
        'locations': util.get_locations()
    })

    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/predict_home_price', methods=['POST'])
def predict_home_price():
    data = request.get_json()
    total_sqft = float(data['total_sqft'])
    location = data['location']
    bhk = int(data['bhk'])
    bath = int(data['bath'])

    return jsonify({
        'estimated_price': util.get_estimated_price(location, total_sqft, bhk, bath)
    })

# -------------------- LOAD DATASET FOR RAG --------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "../model/Bengaluru_House_Data.csv")

data = pd.read_csv(csv_path)

data['location'] = data['location'].str.strip()

# Convert size column to BHK number
data['bhk'] = data['size'].str.extract(r'(\d+)').astype(float)

# Create text data for chatbot
data['text'] = data.apply(lambda row: 
    f"Location: {row['location']}, Sqft: {row['total_sqft']}, "
    f"BHK: {row['bhk']}, Bath: {row['bath']}, Price: {row['price']} lakhs", axis=1)

documents = data['text'].tolist()

# -------------------- EMBEDDING MODEL --------------------
embed_model = SentenceTransformer('all-MiniLM-L6-v2', local_files_only=True)
embeddings = embed_model.encode(documents)

# -------------------- FAISS VECTOR DATABASE --------------------
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

# -------------------- LLM MODEL --------------------
llm = pipeline("text-generation", model="google/flan-t5-small")
# -------------------- CHATBOT API (RAG + LLM) --------------------

last_compared_locations = []

@app.route('/chat', methods=['POST'])
def chat():
    global last_compared_locations
    req = request.get_json()
    user_message = req['message'].lower()

    print("User asked:", user_message)

    # -------- Small Talk --------
    if user_message in ["hi", "hello", "hey"]:
        return jsonify({"reply": "Hello! I am your Bangalore Real Estate Assistant. Ask me about budget, locations, investment, or prices."})

    if "what can you do" in user_message:
        return jsonify({"reply": "I can suggest best locations, affordable areas, investment areas and help you predict house prices in Bangalore."})

    # -------- Budget Filter --------
    import re
    numbers = re.findall(r'\d+', user_message)

    if "under" in user_message and numbers:
        budget = int(numbers[0])
        filtered = data[data['price'] <= budget]

        if not filtered.empty:
            locations = filtered['location'].unique()[:10]
            return jsonify({"reply": f"Locations under {budget} lakhs: " + ", ".join(locations)})
        else:
            return jsonify({"reply": "No locations found under this budget."})

    # Location names
    if "location names" in user_message or "locations" in user_message:
        locations = data['location'].unique()[:20]
        return jsonify({"reply": "Locations: " + ", ".join(locations)})

    # Cheapest areas
    if "cheapest" in user_message or "low price" in user_message:
        low = data.nsmallest(5, 'price')
        locations = low['location'].unique()
        return jsonify({"reply": "Cheapest areas: " + ", ".join(locations)})

    # Most expensive areas
    if "expensive" in user_message or "highest price" in user_message:
        high = data.nlargest(5, 'price')
        locations = high['location'].unique()
        return jsonify({"reply": "Most expensive areas: " + ", ".join(locations)})

    # Price of a specific location
    if "price in" in user_message or "average price in" in user_message:
        words = user_message.split("in")
        if len(words) > 1:
            loc = words[1].strip().title()
            loc_data = data[data['location'] == loc]

            if not loc_data.empty:
                avg_price = round(loc_data['price'].mean(), 2)
                return jsonify({"reply": f"Average price in {loc} is around {avg_price} lakhs."})
            else:
                return jsonify({"reply": "Location not found in dataset."})

    # Compare two locations
    if "compare" in user_message and "and" in user_message:
        parts = user_message.replace("compare", "").split("and")
    
        if len(parts) == 2:
            loc1 = parts[0].strip()
            loc2 = parts[1].strip()

            data1 = data[data['location'].str.contains(loc1, case=False, na=False)]
            data2 = data[data['location'].str.contains(loc2, case=False, na=False)]

            if not data1.empty and not data2.empty:
                avg1 = round(data1['price'].mean(), 2)
                avg2 = round(data2['price'].mean(), 2)

                # STORE MEMORY
                global last_compared_locations
                last_compared_locations = [loc1, loc2, avg1, avg2]


                if avg1 < avg2:
                    cheaper = loc1.title()
                else:
                    cheaper = loc2.title()

                return jsonify({
                "reply": f"{loc1.title()} average price: {avg1} lakhs. {loc2.title()} average price: {avg2} lakhs."
                })
            else:
                return jsonify({"reply": "One of the locations not found in dataset."})


    # -------- Which is better (uses memory) --------
    if ("which one is better" in user_message or
        "which is better" in user_message or
        "which one to choose" in user_message or
        "best among" in user_message or
        "best for above" in user_message or
        "best among above" in user_message or
        "best for above two" in user_message or
        "which is best" in user_message):

        

        if last_compared_locations:
            loc1, loc2, avg1, avg2 = last_compared_locations

            if avg1 < avg2:
                better = loc1.title()
            else:
                better = loc2.title()

            return jsonify({
                "reply": f"Between {loc1.title()} and {loc2.title()}, {better} is better based on lower average price, affordability, and investment value."
            })
        else:
            return jsonify({"reply": "Please compare two locations first."})

    # Price of a specific location
    if "price in" in user_message or "average price in" in user_message:
        words = user_message.split("in")
        if len(words) > 1:
            loc = words[1].strip()

            loc_data = data[data['location'].str.contains(loc, case=False, na=False)]

            if not loc_data.empty:
                avg_price = round(loc_data['price'].mean(), 2)
                return jsonify({"reply": f"Average price in {loc.title()} is around {avg_price} lakhs."})
            else:
                return jsonify({"reply": "Location not found in dataset."})


    # Which is better between two locations
    if "better" in user_message and "and" in user_message:
        parts = user_message.split("and")
        if len(parts) == 2:
            loc1 = parts[0].replace("which one is better", "").replace("better", "").strip()
            loc2 = parts[1].strip()

            data1 = data[data['location'].str.contains(loc1, case=False, na=False)]
            data2 = data[data['location'].str.contains(loc2, case=False, na=False)]

            if not data1.empty and not data2.empty:
                avg1 = round(data1['price'].mean(), 2)
                avg2 = round(data2['price'].mean(), 2)

                if avg1 < avg2:
                    better = loc1.title()
                else:
                    better = loc2.title()

                return jsonify({
                    "reply": f"For budget and affordability, {better} is better. {loc1.title()} avg price: {avg1} lakhs, {loc2.title()} avg price: {avg2} lakhs."
                })

    # -------- Investment Areas --------
    if "investment" in user_message:
        return jsonify({
            "reply": "Best areas for investment in Bangalore are: Devanahalli, Sarjapur Road, Whitefield, Electronic City, and Yelahanka. These areas have high growth potential and upcoming infrastructure."
        })

    # -------- Family Areas --------
    if "family" in user_message:
        return jsonify({
            "reply": "Best areas for families are: JP Nagar, Jayanagar, Yelahanka, RR Nagar, and Banashankari. These areas are safe and have good schools and hospitals."
        })

    # -------- IT Hub Areas --------
    if "it hub" in user_message or "near it" in user_message or "tech" in user_message:
        return jsonify({
            "reply": "Best areas near IT hubs are: Whitefield, Electronic City, Marathahalli, Outer Ring Road, and Bellandur."
        })

    # -------- Metro Areas --------
    if "metro" in user_message:
        return jsonify({
            "reply": "Metro accessible areas include: BTM Layout, Yeshwanthpur, Indiranagar, MG Road, and Jayanagar."
        })
    # -------- RAG --------
    query_embedding = embed_model.encode([user_message])
    k = 5
    distances, indices = index.search(np.array(query_embedding), k)

    retrieved_docs = [documents[i] for i in indices[0]]
    context = "\n".join(retrieved_docs)

    prompt = f"""
    You are a Bangalore real estate assistant.
    Answer the question using the data below.

    Data:
    {context}

    Question: {user_message}
    Answer:
    """

    result = llm(prompt,max_new_tokens=80,do_sample=True,temperature=0.7)
    answer = result[0]['generated_text'].replace(prompt, "").strip()

    return jsonify({"reply": answer})

# -------------------- MAIN --------------------
if __name__ == "__main__":
    print("Starting the Python Flask Server for Home Price Prediction")
    util.load_artifcats()
    app.run(debug=True)