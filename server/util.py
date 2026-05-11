import json
import pickle
import numpy as np
__locations = None
__data_columns = None
__model = None

def get_estimated_price(location, sqft, bhk, bath):
    try:
        loc_index = __data_columns.index(location.lower())
    except:
        loc_index = -1

    x = np.zeros(len(__data_columns))
    x[0] = sqft
    x[1] = bhk
    x[2] = bath
    if loc_index >= 0:
        x[loc_index] = 1
    return round(__model.predict([x])[0],2)

def get_locations():
    return __locations
 
def load_artifcats():
    print("Loading artifacts...")
    global __locations
    global __data_columns
    global __model

    with open("./artifacts/columns.json", 'r') as f:
        __data_columns = json.load(f)['data_columns']
        __locations = __data_columns[3:]

    with open("./artifacts/bengaluru_home_price_model.pickel", 'rb') as f:
        __model = pickle.load(f)
    
    print("Artificats loaded successfully")

if __name__ == "__main__":
    load_artifcats()
    # print(get_locations())
    # print(get_estimated_price("1st phase jp nagar", 1000 ,3 ,3))
    # print(get_estimated_price("1st phase jp nagar", 1000 ,2 ,2))
    # print(get_estimated_price("Kalhalli", 1000 ,2 ,2))
    # print(get_estimated_price("Ejipura", 1000 ,2 ,2))
    
    
