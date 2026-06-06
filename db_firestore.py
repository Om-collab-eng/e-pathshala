import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate('firebase-key.json')
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_user_by_phone(phone, school_code):
    users_ref = db.collection('users')
    query = users_ref.where('phone', '==', phone).where('school_code', '==', school_code).limit(1)
    results = query.stream()
    for doc in results:
        data = doc.to_dict()
        data['id'] = doc.id
        return data
    return None

def create_user(data):
    doc_ref = db.collection('users').document()
    doc_ref.set(data)
    return doc_ref.id

def get_school_by_code(school_code):
    query = db.collection('schools').where('school_code', '==', school_code).limit(1)
    results = query.stream()
    for doc in results:
        data = doc.to_dict()
        data['id'] = doc.id
        return data
    return None

def add_book(data):
    doc_ref = db.collection('books').document()
    doc_ref.set(data)
    return doc_ref.id

# Add more Firestore wrapper functions here to replace SQLite queries
