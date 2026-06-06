import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_DB_FILE = os.path.join(BASE_DIR, 'demo.db')

def seed_demo_publishing():
    if not os.path.exists(DEMO_DB_FILE):
        print("Demo DB not found.")
        return
        
    conn = sqlite3.connect(DEMO_DB_FILE)
    
    # Get student IDs
    students = conn.execute("SELECT id FROM users WHERE role = 'student' AND school_code = 'DEMO'").fetchall()
    if not students:
        print("No demo students found.")
        conn.close()
        return
        
    s1 = students[0][0]
    s2 = students[1][0] if len(students) > 1 else s1
    
    # 1. Clear existing demo content to prevent duplicates if run multiple times
    conn.execute("DELETE FROM digital_content WHERE school_code = 'DEMO'")
    conn.execute("DELETE FROM content_reviews WHERE school_code = 'DEMO'")
    conn.execute("DELETE FROM content_reports WHERE school_code = 'DEMO'")
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    # 2. Insert Published Content
    conn.execute('''
        INSERT INTO digital_content (title, category, description, subject, class, tags, 
                                     cover_url, file_url, student_id, school_code, status, featured, views, downloads, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', 1, 150, 45, ?)
    ''', ("Complete Physics Ray Optics Notes", "Notes", "Detailed diagrams and notes on ray optics for board exams.", 
          "Physics", "Class 12", "optics, physics, boards", 
          "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&q=80", "", s1, "DEMO", now))
    content1_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    
    conn.execute('''
        INSERT INTO digital_content (title, category, description, subject, class, tags, 
                                     cover_url, file_url, student_id, school_code, status, featured, views, downloads, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', 0, 42, 10, ?)
    ''', ("Macbeth Character Analysis", "Research Work", "An in-depth look at Lady Macbeth's psychological descent.", 
          "Literature", "Class 11", "shakespeare, macbeth, english", 
          "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=500&q=80", "", s2, "DEMO", now))
    content2_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    
    # 3. Insert Submitted Content (for admin review queue)
    conn.execute('''
        INSERT INTO digital_content (title, category, description, subject, class, tags, 
                                     cover_url, file_url, student_id, school_code, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?)
    ''', ("Chemistry Lab Manual Answers", "Study Material", "Completed readings and answers for titration lab.", 
          "Chemistry", "Class 12", "lab, chemistry, titration", 
          "https://images.unsplash.com/photo-1603126859591-11406609ca88?w=500&q=80", "", s1, "DEMO", now))
          
    conn.execute('''
        INSERT INTO digital_content (title, category, description, subject, class, tags, 
                                     cover_url, file_url, student_id, school_code, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?)
    ''', ("History of the Mauryan Empire", "Project Report", "A comprehensive timeline of the Mauryan Empire.", 
          "History", "Class 10", "history, mauryan, ashoka", 
          "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=500&q=80", "", s2, "DEMO", now))
          
    # 4. Insert Reviews
    conn.execute('''
        INSERT INTO content_reviews (content_id, student_id, rating, review_title, review_comment, school_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (content1_id, s2, 5, "Amazing Notes!", "These notes saved me during the midterm exams. Highly recommend.", "DEMO", now))
    
    conn.execute('''
        INSERT INTO content_reviews (content_id, student_id, rating, review_title, review_comment, school_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (content2_id, s1, 4, "Good analysis", "Well written, but could use more quotes from act 5.", "DEMO", now))
    
    # 5. Insert a Report
    conn.execute('''
        INSERT INTO content_reports (content_id, reported_by, reason, status, school_code, created_at)
        VALUES (?, ?, ?, 'Open', ?, ?)
    ''', (content2_id, s1, "Spam or misleading information", "DEMO", now))
    
    conn.commit()
    conn.close()
    print("Demo DB successfully seeded with digital publishing features!")

if __name__ == '__main__':
    seed_demo_publishing()
