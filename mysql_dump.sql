/*M!999999\- enable the sandbox mode */ 
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "achievements" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "name" varchar(150) NOT NULL,
  "description" text DEFAULT NULL,
  "icon" varchar(100) DEFAULT NULL,
  "requirement_type" varchar(100) DEFAULT NULL,
  "requirement_value" int(11) DEFAULT 1,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "achievements" VALUES (1,'First Book Completed','Finished reading your first physical or digital book','?','books',1,'2026-09-10 13:51:22');
INSERT INTO "achievements" VALUES (2,'7 Day Streak','Read books consistently for 7 consecutive days','?','streak',7,'2026-09-10 13:51:22');
INSERT INTO "achievements" VALUES (3,'Top Reader','Read more than 10 books in a single academic term','?','books',10,'2026-09-10 13:51:22');
INSERT INTO "achievements" VALUES (4,'Quiz Master','Passed 5 chapter quizzes with 80%+ score','?','quizzes',5,'2026-09-10 13:51:22');
INSERT INTO "achievements" VALUES (5,'Knowledge Explorer','Explored 10 different e-library research documents','?','digital',10,'2026-09-10 13:51:22');
INSERT INTO "achievements" VALUES (6,'Review Expert','Submitted 5 verified book reviews approved by faculty','??','reviews',5,'2026-09-10 13:51:22');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "acquisition_items" (
  "id" longtext DEFAULT NULL,
  "acquisition_id" longtext DEFAULT NULL,
  "book_id" longtext DEFAULT NULL,
  "isbn" longtext DEFAULT NULL,
  "title" longtext DEFAULT NULL,
  "author" longtext DEFAULT NULL,
  "quantity" longtext DEFAULT NULL,
  "unit_price" longtext DEFAULT NULL,
  "total_price" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "registered_copies" int(11) DEFAULT 0
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "acquisitions" (
  "id" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "bill_number" longtext DEFAULT NULL,
  "bill_date" longtext DEFAULT NULL,
  "vendor_id" longtext DEFAULT NULL,
  "total_books" longtext DEFAULT NULL,
  "total_copies" longtext DEFAULT NULL,
  "total_amount" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "created_by" longtext DEFAULT NULL,
  "created_date" longtext DEFAULT NULL,
  "last_updated" longtext DEFAULT NULL,
  "invoice_image" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "advertisements" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "title" varchar(255) NOT NULL,
  "subtitle" varchar(255) DEFAULT NULL,
  "description" text DEFAULT NULL,
  "cta_text" varchar(100) DEFAULT 'Learn More',
  "target_url" varchar(500) NOT NULL,
  "image_url" varchar(500) DEFAULT NULL,
  "bg_gradient" varchar(255) DEFAULT 'linear-gradient(135deg, #f5f3ff 0%, #edd8ff 100%)',
  "start_time" datetime DEFAULT NULL,
  "end_time" datetime DEFAULT NULL,
  "status" varchar(20) DEFAULT 'active',
  "priority" int(11) DEFAULT 1,
  "target_section" varchar(50) DEFAULT 'all',
  "impressions" int(11) DEFAULT 0,
  "clicks" int(11) DEFAULT 0,
  "created_at" datetime DEFAULT current_timestamp(),
  "type" varchar(50) DEFAULT 'BANNER',
  "media_url" varchar(1000) DEFAULT NULL,
  "thumbnail_url" varchar(1000) DEFAULT NULL,
  "content_text" text DEFAULT NULL,
  "category" varchar(100) DEFAULT NULL,
  "source" varchar(255) DEFAULT NULL,
  "target_type" varchar(50) DEFAULT 'ALL_SCHOOLS',
  "school_code" varchar(100) DEFAULT 'GLOBAL',
  "display_order" int(11) DEFAULT 0,
  "is_active" tinyint(1) DEFAULT 1,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "advertisements" VALUES (1,'Welcome to Librika','Explore Digital & Physical Books','Discover our comprehensive library catalog','Explore Now','/digital-library',NULL,'linear-gradient(135deg, #f5f3ff 0%, #edd8ff 100%)',NULL,NULL,'active',10,'all',43,0,'2026-08-15 17:58:00','BANNER',NULL,NULL,NULL,NULL,NULL,'ALL_SCHOOLS','GLOBAL',0,1);
INSERT INTO "advertisements" VALUES (2,'Octopuses Have Three Hearts',NULL,NULL,'Learn More','#',NULL,'linear-gradient(135deg, #f5f3ff 0%, #edd8ff 100%)',NULL,NULL,'active',1,'all',43,3,'2026-09-10 20:45:16','INTERESTING_FACT',NULL,NULL,'Did You Know? Octopuses have three hearts and blue blood. Two hearts pump blood to the gills, while the third pumps it through the body.','Science & Biology','National Geographic','ALL_SCHOOLS','GLOBAL',1,1);
INSERT INTO "advertisements" VALUES (3,'Class 9 & 10 Mathematics Notes',NULL,NULL,'Explore Notes','/student?module=e-library',NULL,'linear-gradient(135deg, #f5f3ff 0%, #edd8ff 100%)',NULL,NULL,'active',1,'all',43,0,'2026-09-10 20:45:16','TEXT',NULL,NULL,'? New NCERT Mathematics Chapter-wise formula sheets & solved questions are now available in the E-Library!',NULL,NULL,'ALL_SCHOOLS','GLOBAL',2,1);
INSERT INTO "advertisements" VALUES (4,'https://www.youtube.com/watch?v=dQw4w9WgXcQ','123',NULL,'Explore Now','/student#e-library','/uploads/ads/ad_1789455109325_g881lo.png','linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)','2026-09-15 12:21:00','2026-09-17 12:21:00','ACTIVE',1,'all',1,0,'2026-09-15 12:21:49','BANNER','/uploads/ads/ad_1789455109325_g881lo.png','/uploads/ads/ad_1789455109325_g881lo.png','https://www.youtube.com/watch?v=dQw4w9WgXcQ',NULL,NULL,'ALL_SCHOOLS',NULL,0,1);
INSERT INTO "advertisements" VALUES (5,'https://www.youtube.com/watch?v=dQw4w9WgXcQ','123',NULL,'Explore Now','/student#e-library','/uploads/ads/ad_1789455111179_lfcnut.png','linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)','2026-09-15 12:21:00','2026-09-17 12:21:00','ACTIVE',1,'all',1,0,'2026-09-15 12:21:51','BANNER','/uploads/ads/ad_1789455111179_lfcnut.png','/uploads/ads/ad_1789455111179_lfcnut.png','https://www.youtube.com/watch?v=dQw4w9WgXcQ',NULL,NULL,'ALL_SCHOOLS',NULL,0,1);
INSERT INTO "advertisements" VALUES (6,'https://www.youtube.com/watch?v=dQw4w9WgXcQ','123',NULL,'Explore Now','/student#e-library','/uploads/ads/ad_1789455111806_4eyhqu.png','linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)','2026-09-15 12:21:00','2026-09-17 12:21:00','ACTIVE',1,'all',1,0,'2026-09-15 12:21:51','BANNER','/uploads/ads/ad_1789455111806_4eyhqu.png','/uploads/ads/ad_1789455111806_4eyhqu.png','https://www.youtube.com/watch?v=dQw4w9WgXcQ',NULL,NULL,'ALL_SCHOOLS',NULL,0,1);
INSERT INTO "advertisements" VALUES (7,'https://www.youtube.com/watch?v=dQw4w9WgXcQ','123',NULL,'Explore Now','/student#e-library','/uploads/ads/ad_1789455117111_9w1tg6.png','linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)','2026-09-15 12:21:00','2026-09-17 12:21:00','ACTIVE',1,'all',1,0,'2026-09-15 12:21:57','BANNER','/uploads/ads/ad_1789455117111_9w1tg6.png','/uploads/ads/ad_1789455117111_9w1tg6.png','https://www.youtube.com/watch?v=dQw4w9WgXcQ',NULL,NULL,'ALL_SCHOOLS',NULL,0,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "assignment_submissions" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "assignment_id" int(11) DEFAULT NULL,
  "user_id" int(11) DEFAULT NULL,
  "submission_text" text DEFAULT NULL,
  "file_url" varchar(255) DEFAULT NULL,
  "submitted_at" timestamp NULL DEFAULT current_timestamp(),
  "grade" varchar(50) DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "assignments" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "school_code" varchar(50) DEFAULT NULL,
  "class" varchar(50) DEFAULT NULL,
  "title" varchar(255) DEFAULT NULL,
  "description" text DEFAULT NULL,
  "due_date" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "subject" varchar(100) DEFAULT NULL,
  "class_name" varchar(50) DEFAULT NULL,
  "due_at" datetime DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "assignments" VALUES (1,'DPS123',NULL,'Biology: Cellular Respiration Lab Report','Submit a 2-page report summarizing mitochondria experiment observations.',NULL,'2026-09-10 13:51:41','Biology','Class 9','2026-09-15 19:21:41');
INSERT INTO "assignments" VALUES (2,'DPS123',NULL,'History: Indian Independence Movement Essay','Write a structured critical essay on the Salt Satyagraha of 1930.',NULL,'2026-09-10 13:51:41','History','Class 10','2026-09-17 19:21:41');
INSERT INTO "assignments" VALUES (3,'DPS123',NULL,'Literature: Character Study of Portia','Analyze the courtroom scene monologue in Merchant of Venice.',NULL,'2026-09-10 13:51:41','English','Class 9','2026-09-13 19:21:41');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "audit_logs" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "user_id" int(11) DEFAULT NULL,
  "action" varchar(100) NOT NULL,
  "entity_type" varchar(100) DEFAULT NULL,
  "entity_id" int(11) DEFAULT NULL,
  "description" text DEFAULT NULL,
  "ip_address" varchar(50) DEFAULT NULL,
  "school_code" varchar(50) DEFAULT 'DEMO01',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "backup_schedules" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "name" varchar(255) NOT NULL,
  "cron" varchar(100) NOT NULL,
  "target" varchar(50) DEFAULT 'db',
  "retention_days" int(11) DEFAULT 30,
  "enabled" int(11) DEFAULT 1,
  "last_run" timestamp NULL DEFAULT NULL,
  "last_status" varchar(50) DEFAULT NULL,
  "last_error" text DEFAULT NULL,
  "created_by" int(11) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "book_copies" (
  "id" longtext DEFAULT NULL,
  "book_id" longtext DEFAULT NULL,
  "accession_number" longtext DEFAULT NULL,
  "shelf" longtext DEFAULT NULL,
  "rack" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "condition" longtext DEFAULT NULL,
  "acquisition_id" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "book_reviews" (
  "id" longtext DEFAULT NULL,
  "user_id" longtext DEFAULT NULL,
  "book_id" longtext DEFAULT NULL,
  "book_type" longtext DEFAULT NULL,
  "learned" longtext DEFAULT NULL,
  "favorite" longtext DEFAULT NULL,
  "recommend" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  KEY "idx_book_reviews_lookup" ("user_id"(100),"book_id"(100),"book_type"(50))
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "books" (
  "id" bigint(20) NOT NULL AUTO_INCREMENT,
  "title" longtext DEFAULT NULL,
  "author" longtext DEFAULT NULL,
  "genre" longtext DEFAULT NULL,
  "barcode_id" longtext DEFAULT NULL,
  "total_copies" longtext DEFAULT NULL,
  "available_copies" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "cover_url" longtext DEFAULT NULL,
  "description" longtext DEFAULT NULL,
  "shelf_location" longtext DEFAULT NULL,
  "is_banned" longtext DEFAULT NULL,
  "isbn" longtext DEFAULT NULL,
  "publisher" longtext DEFAULT NULL,
  "class" longtext DEFAULT NULL,
  "subject" longtext DEFAULT NULL,
  "pages" longtext DEFAULT NULL,
  "edition" longtext DEFAULT NULL,
  "ddc" longtext DEFAULT NULL,
  "category" longtext DEFAULT NULL,
  "book_type" longtext DEFAULT NULL,
  "language" longtext DEFAULT NULL,
  "quiz" longtext DEFAULT NULL,
  "book_size" varchar(10) DEFAULT 'MEDIUM',
  "offline_borrowing_days" int(11) DEFAULT 15,
  "back_cover_url" varchar(500) DEFAULT '',
  "book_id" varchar(50) DEFAULT NULL,
  "price" varchar(50) DEFAULT NULL,
  "book_condition" varchar(50) DEFAULT 'GOOD',
  "publication_year" varchar(10) DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "books" VALUES (1,'Physics: Principles and Problems','Paul W. Zitzewitz','Science','BK-PHY-001','5','5','GLOBAL','https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&auto=format&fit=crop&q=60','Comprehensive physics textbook covering mechanics, energy, motion laws, optics, and thermodynamics.','Rack A-1, Shelf 2',NULL,'9780078458132','McGraw-Hill','Class 9-12','Science',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MEDIUM',15,'','VBPG20260001',NULL,'GOOD',NULL);
INSERT INTO "books" VALUES (2,'To Kill a Mockingbird','Harper Lee','Fiction','BK-FIC-002','4','3','GLOBAL','https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=60','Pulitzer Prize-winning classic masterpiece exploring empathy, justice, and human dignity in the American South.','Rack B-3, Shelf 1',NULL,'9780061120084','Harper Perennial','All Classes','English Literature',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MEDIUM',15,'','VBPG20260002',NULL,'GOOD',NULL);
INSERT INTO "books" VALUES (3,'Introduction to Algorithms & Data Structures in Python','Thomas Cormen & Guido van Rossum','Technology','BK-TECH-003','6','6','GLOBAL','https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&auto=format&fit=crop&q=60','Fundamental foundations of algorithmic efficiency, recursion, binary search trees, and dynamic programming.','Rack C-2, Shelf 3',NULL,'9780262033848','MIT Press','Class 10-12','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'LARGE',25,'','VBPG20260003',NULL,'GOOD',NULL);
INSERT INTO "books" VALUES (4,'India: A Comprehensive History of a Civilization','John Keay','History','BK-HIST-004','3','2','GLOBAL','https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&auto=format&fit=crop&q=60','Panoramic account spanning five millennia from the Indus Valley culture through the independence movement.','Rack D-1, Shelf 2',NULL,'9780802137975','Grove Press','All Classes','History',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MEDIUM',15,'','VBPG20260004',NULL,'GOOD',NULL);
INSERT INTO "books" VALUES (5,'Advanced Calculus & Coordinate Geometry','James Stewart','Mathematics','BK-MATH-005','8','7','GLOBAL','https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&auto=format&fit=crop&q=60','Standard university-prep textbook with step-by-step problem sets on differentiation, integration, and matrices.','Rack E-4, Shelf 1',NULL,'9781285740621','Cengage Learning','Class 11-12','Mathematics',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MEDIUM',15,'','VBPG20260005',NULL,'GOOD',NULL);
INSERT INTO "books" VALUES (6,'A Brief History of Time','Stephen Hawking','Science','BK-SCI-006','5','4','GLOBAL','https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60','Landmark exploration of space, time, black holes, the Big Bang theory, and the cosmic nature of the universe.','Rack A-2, Shelf 3',NULL,'9780553380163','Bantam Books','All Classes','Science',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'SMALL',7,'','VBPG20260006',NULL,'GOOD',NULL);
INSERT INTO "books" VALUES (7,'Pride and Prejudice','Jane Austen','Fiction','BK-FIC-007','4','4','GLOBAL','https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60','Celebrated literary classic detailing the turbulent relationship between Elizabeth Bennet and Fitzwilliam Darcy.','Rack B-1, Shelf 4',NULL,'9780141439518','Penguin Classics','All Classes','English Literature',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MEDIUM',15,'','VBPG20260007',NULL,'GOOD',NULL);
INSERT INTO "books" VALUES (8,'Clean Code: A Handbook of Agile Software Craftsmanship','Robert C. Martin','Technology','BK-TECH-008','4','3','GLOBAL','https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=60','Even bad code can function, but if code is not clean it can bring a development organization to its knees.','Rack C-1, Shelf 2',NULL,'9780132350884','Prentice Hall','All Classes','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MEDIUM',15,'','VBPG20260008',NULL,'GOOD',NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "course_enrollments" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "course_id" int(11) NOT NULL,
  "user_id" int(11) NOT NULL,
  "user_name" varchar(255) DEFAULT NULL,
  "user_email" varchar(255) DEFAULT NULL,
  "role" varchar(50) DEFAULT 'student',
  "enrolled_at" timestamp NULL DEFAULT current_timestamp(),
  "progress_percent" int(11) DEFAULT 0,
  "status" varchar(50) DEFAULT 'active',
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "course_lessons" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "module_id" int(11) NOT NULL,
  "course_id" int(11) NOT NULL,
  "title" varchar(255) NOT NULL,
  "content_type" varchar(50) DEFAULT 'live_class',
  "video_url" text DEFAULT NULL,
  "pdf_url" text DEFAULT NULL,
  "duration_minutes" int(11) DEFAULT 45,
  "order_index" int(11) DEFAULT 1,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "course_lessons" VALUES (1,1,1,'ES6+ Features, Closures & Event Loop Deep Dive','video',NULL,NULL,50,1,'2026-09-07 14:31:04');
INSERT INTO "course_lessons" VALUES (2,1,1,'Promises, Async/Await & Fetch API Hands-on','video',NULL,NULL,45,2,'2026-09-07 14:31:04');
INSERT INTO "course_lessons" VALUES (3,2,1,'Interactive Live Masterclass: Building React Hooks from Scratch','live_class',NULL,NULL,60,3,'2026-09-07 14:31:04');
INSERT INTO "course_lessons" VALUES (4,3,1,'Live Class: Building Scalable REST APIs & PostgreSQL Integration','live_class',NULL,NULL,75,4,'2026-09-07 14:31:04');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "course_modules" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "course_id" int(11) NOT NULL,
  "title" varchar(255) NOT NULL,
  "order_index" int(11) DEFAULT 1,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "course_modules" VALUES (1,1,'Module 1: Modern JavaScript & Async Programming',1,'2026-09-07 14:31:04');
INSERT INTO "course_modules" VALUES (2,1,'Module 2: React 19 State, Hooks & Component Lifecycle',2,'2026-09-07 14:31:04');
INSERT INTO "course_modules" VALUES (3,1,'Module 3: Backend REST APIs with Node.js & Express',3,'2026-09-07 14:31:04');
INSERT INTO "course_modules" VALUES (4,1,'Module 4: Live Capstone Project & Cloud Deployment',4,'2026-09-07 14:31:04');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "digital_book_readings" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "student_id" bigint(20) unsigned NOT NULL,
  "content_id" bigint(20) unsigned NOT NULL,
  "school_code" varchar(50) DEFAULT 'DPS123',
  "started_at" datetime NOT NULL,
  "last_read_at" datetime NOT NULL,
  "total_reading_time" int(11) DEFAULT 0,
  "pages_read" int(11) DEFAULT 0,
  "total_pages" int(11) DEFAULT 1,
  "progress_percentage" int(11) DEFAULT 0,
  "reading_sessions" int(11) DEFAULT 1,
  "reading_status" varchar(30) DEFAULT 'READING',
  "quiz_status" varchar(30) DEFAULT 'LOCKED',
  "quiz_eligible_at" datetime DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  KEY "idx_dbr_student" ("student_id"),
  KEY "idx_dbr_content" ("content_id"),
  KEY "idx_dbr_school" ("school_code"),
  KEY "idx_dbr_quiz_status" ("quiz_status")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "digital_content" (
  "id" longtext DEFAULT NULL,
  "title" longtext DEFAULT NULL,
  "category" longtext DEFAULT NULL,
  "description" longtext DEFAULT NULL,
  "subject" longtext DEFAULT NULL,
  "class" longtext DEFAULT NULL,
  "tags" longtext DEFAULT NULL,
  "cover_url" longtext DEFAULT NULL,
  "file_url" longtext DEFAULT NULL,
  "student_id" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL,
  "updated_at" longtext DEFAULT NULL,
  "rejection_reason" longtext DEFAULT NULL,
  "suggested_changes" longtext DEFAULT NULL,
  "featured" longtext DEFAULT NULL,
  "views" longtext DEFAULT NULL,
  "downloads" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "digital_documents" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "title" varchar(255) NOT NULL,
  "author" varchar(255) DEFAULT NULL,
  "description" text DEFAULT NULL,
  "file_url" text NOT NULL,
  "cover_url" text DEFAULT NULL,
  "document_type" varchar(50) DEFAULT 'EBOOK',
  "access_level" varchar(50) DEFAULT 'ALL',
  "reading_time_mins" int(11) DEFAULT 15,
  "school_code" varchar(50) DEFAULT 'DEMO01',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "fines" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "loan_id" int(11) DEFAULT NULL,
  "member_id" int(11) NOT NULL,
  "amount" decimal(10,2) NOT NULL DEFAULT 0.00,
  "reason" varchar(255) DEFAULT 'Overdue Loan',
  "status" varchar(50) DEFAULT 'PENDING',
  "paid_at" timestamp NULL DEFAULT NULL,
  "waived_at" timestamp NULL DEFAULT NULL,
  "school_code" varchar(50) DEFAULT 'DEMO01',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "global_sections" (
  "id" longtext DEFAULT NULL,
  "name" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "global_sections" VALUES ('1','Self Help','2026-07-08 15:58');
INSERT INTO "global_sections" VALUES ('2','Science','2026-07-08 15:58');
INSERT INTO "global_sections" VALUES ('3','Technology','2026-07-08 15:58');
INSERT INTO "global_sections" VALUES ('4','Business','2026-07-08 15:58');
INSERT INTO "global_sections" VALUES ('5','Story','2026-07-08 15:58');
INSERT INTO "global_sections" VALUES ('6','Reference','2026-07-08 15:58');
INSERT INTO "global_sections" VALUES ('7','Novel','2026-07-08 15:58');
INSERT INTO "global_sections" VALUES ('8','Fantasy','2026-07-08 17:17');
INSERT INTO "global_sections" VALUES ('9','NCERT','2026-07-24 15:43');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "invoices" (
  "id" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "amount" longtext DEFAULT NULL,
  "tax" longtext DEFAULT NULL,
  "total" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "due_date" longtext DEFAULT NULL,
  "pdf_url" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "invoices" VALUES ('inv_92f0d7d84d','DEMO','999','179.82','1178.82','paid','2026-06-16','null','2026-06-16 17:59:40');
INSERT INTO "invoices" VALUES ('inv_d607683bfd','123','999','179.82','1178.82','paid','2026-06-27','null','2026-06-27 19:16:42');
INSERT INTO "invoices" VALUES ('inv_25b04d9e4c','2321','2999','539.8199999999999','3538.8199999999997','paid','2026-06-29','null','2026-06-29 10:44:10');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "ip_allowlist" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "cidr" varchar(100) NOT NULL,
  "label" varchar(255) DEFAULT NULL,
  "enabled" int(11) DEFAULT 1,
  "created_by" int(11) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "library_settings" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "school_code" varchar(50) DEFAULT 'DEMO01',
  "setting_key" varchar(100) NOT NULL,
  "setting_value" text DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "library_settings" VALUES (1,'DEMO01','loan_duration_days','14','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (2,'DEMO01','student_max_books','3','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (3,'DEMO01','teacher_max_books','10','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (4,'DEMO01','staff_max_books','5','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (5,'DEMO01','fine_per_day','5','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (6,'DEMO01','grace_period_days','2','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (7,'DEMO01','max_renewals','2','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (8,'DEMO01','allow_digital_downloads','true','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (9,'DEMO01','auto_notify_overdue','true','2026-09-10 11:50:47');
INSERT INTO "library_settings" VALUES (10,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-11 16:05:01');
INSERT INTO "library_settings" VALUES (11,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-11 16:05:04');
INSERT INTO "library_settings" VALUES (12,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 06:36:11');
INSERT INTO "library_settings" VALUES (13,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 06:38:04');
INSERT INTO "library_settings" VALUES (14,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 06:38:12');
INSERT INTO "library_settings" VALUES (15,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 06:38:16');
INSERT INTO "library_settings" VALUES (16,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 06:41:28');
INSERT INTO "library_settings" VALUES (17,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 06:41:32');
INSERT INTO "library_settings" VALUES (18,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 14:11:15');
INSERT INTO "library_settings" VALUES (19,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-15 14:11:19');
INSERT INTO "library_settings" VALUES (20,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-20 09:06:50');
INSERT INTO "library_settings" VALUES (21,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-20 09:06:54');
INSERT INTO "library_settings" VALUES (22,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-20 09:38:37');
INSERT INTO "library_settings" VALUES (23,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-20 09:38:40');
INSERT INTO "library_settings" VALUES (24,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-22 07:30:10');
INSERT INTO "library_settings" VALUES (25,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-22 07:30:14');
INSERT INTO "library_settings" VALUES (26,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-22 07:31:01');
INSERT INTO "library_settings" VALUES (27,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-22 07:31:05');
INSERT INTO "library_settings" VALUES (28,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-22 07:37:36');
INSERT INTO "library_settings" VALUES (29,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-22 07:37:40');
INSERT INTO "library_settings" VALUES (30,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 11:39:49');
INSERT INTO "library_settings" VALUES (31,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 11:39:53');
INSERT INTO "library_settings" VALUES (32,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:24:24');
INSERT INTO "library_settings" VALUES (33,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:24:28');
INSERT INTO "library_settings" VALUES (34,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:24:50');
INSERT INTO "library_settings" VALUES (35,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:24:54');
INSERT INTO "library_settings" VALUES (36,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:26:20');
INSERT INTO "library_settings" VALUES (37,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:26:24');
INSERT INTO "library_settings" VALUES (38,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:27:46');
INSERT INTO "library_settings" VALUES (39,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:27:50');
INSERT INTO "library_settings" VALUES (40,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:29:36');
INSERT INTO "library_settings" VALUES (41,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:29:40');
INSERT INTO "library_settings" VALUES (42,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:31:43');
INSERT INTO "library_settings" VALUES (43,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 12:31:47');
INSERT INTO "library_settings" VALUES (44,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:36:16');
INSERT INTO "library_settings" VALUES (45,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:36:19');
INSERT INTO "library_settings" VALUES (46,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:37:45');
INSERT INTO "library_settings" VALUES (47,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:37:48');
INSERT INTO "library_settings" VALUES (48,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:41:07');
INSERT INTO "library_settings" VALUES (49,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:41:11');
INSERT INTO "library_settings" VALUES (50,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:42:30');
INSERT INTO "library_settings" VALUES (51,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-23 14:42:34');
INSERT INTO "library_settings" VALUES (52,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:13:16');
INSERT INTO "library_settings" VALUES (53,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:13:20');
INSERT INTO "library_settings" VALUES (54,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:13:43');
INSERT INTO "library_settings" VALUES (55,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:13:47');
INSERT INTO "library_settings" VALUES (56,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:14:38');
INSERT INTO "library_settings" VALUES (57,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:14:42');
INSERT INTO "library_settings" VALUES (58,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:40:05');
INSERT INTO "library_settings" VALUES (59,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:40:10');
INSERT INTO "library_settings" VALUES (60,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:41:07');
INSERT INTO "library_settings" VALUES (61,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:41:11');
INSERT INTO "library_settings" VALUES (62,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:41:19');
INSERT INTO "library_settings" VALUES (63,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:41:23');
INSERT INTO "library_settings" VALUES (64,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:41:38');
INSERT INTO "library_settings" VALUES (65,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 10:41:42');
INSERT INTO "library_settings" VALUES (66,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 11:02:09');
INSERT INTO "library_settings" VALUES (67,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 11:02:13');
INSERT INTO "library_settings" VALUES (68,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 11:52:51');
INSERT INTO "library_settings" VALUES (69,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 11:52:55');
INSERT INTO "library_settings" VALUES (70,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:11:47');
INSERT INTO "library_settings" VALUES (71,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:11:51');
INSERT INTO "library_settings" VALUES (72,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:28:21');
INSERT INTO "library_settings" VALUES (73,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:28:26');
INSERT INTO "library_settings" VALUES (74,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:29:37');
INSERT INTO "library_settings" VALUES (75,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:29:41');
INSERT INTO "library_settings" VALUES (76,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:46:50');
INSERT INTO "library_settings" VALUES (77,'DPS123','offlineQuizEligibilityRule','RETURNED_BOOK','2026-09-26 12:46:54');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "live_courses" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "title" varchar(255) NOT NULL,
  "subtitle" varchar(500) DEFAULT NULL,
  "description" text DEFAULT NULL,
  "instructor_id" int(11) DEFAULT NULL,
  "instructor_name" varchar(255) DEFAULT NULL,
  "category" varchar(100) DEFAULT 'Technology',
  "level" varchar(50) DEFAULT 'All Levels',
  "price" decimal(10,2) DEFAULT 0.00,
  "cover_image" text DEFAULT NULL,
  "status" varchar(50) DEFAULT 'Published',
  "school_code" varchar(50) DEFAULT 'DPS123',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "live_sessions" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "course_id" int(11) DEFAULT NULL,
  "lesson_id" int(11) DEFAULT NULL,
  "title" varchar(255) NOT NULL,
  "scheduled_start" timestamp NOT NULL,
  "scheduled_end" timestamp NULL DEFAULT NULL,
  "duration_minutes" int(11) DEFAULT 60,
  "meeting_id" varchar(100) NOT NULL,
  "passcode" varchar(50) DEFAULT '123456',
  "host_user_id" int(11) DEFAULT NULL,
  "host_name" varchar(255) DEFAULT NULL,
  "status" varchar(50) DEFAULT 'scheduled',
  "recording_url" text DEFAULT NULL,
  "shareable_token" varchar(255) DEFAULT NULL,
  "max_participants" int(11) DEFAULT 100,
  "school_code" varchar(50) DEFAULT 'DPS123',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "meeting_id" ("meeting_id"),
  UNIQUE KEY "shareable_token" ("shareable_token")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "loans" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "member_id" int(11) NOT NULL,
  "book_id" int(11) NOT NULL,
  "book_copy_id" int(11) DEFAULT NULL,
  "barcode" varchar(100) DEFAULT NULL,
  "issued_at" timestamp NULL DEFAULT current_timestamp(),
  "due_at" timestamp NOT NULL,
  "returned_at" timestamp NULL DEFAULT NULL,
  "status" varchar(50) DEFAULT 'ACTIVE',
  "renewal_count" int(11) DEFAULT 0,
  "fine_amount" decimal(10,2) DEFAULT 0.00,
  "school_code" varchar(50) DEFAULT 'DEMO01',
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "login_history" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) DEFAULT NULL,
  "email" varchar(255) DEFAULT NULL,
  "phone" varchar(30) DEFAULT NULL,
  "role" varchar(50) DEFAULT NULL,
  "ip_address" varchar(45) DEFAULT NULL,
  "user_agent" text DEFAULT NULL,
  "success" int(11) DEFAULT 1,
  "failure_reason" varchar(255) DEFAULT NULL,
  "school_code" varchar(50) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "login_history" VALUES (1,18,'guptaashish123@gmail.com','8527198907','super_admin','122.161.49.143','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',1,NULL,'GLOBAL','2026-08-15 12:33:14');
INSERT INTO "login_history" VALUES (2,57,'JOHNPIG@123','8971','admin','122.161.49.143','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',1,NULL,'4343','2026-08-15 12:36:15');
INSERT INTO "login_history" VALUES (3,NULL,NULL,'8270277153',NULL,'106.192.71.220','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',0,'Invalid login ID or password','GLOBAL','2026-08-18 07:50:54');
INSERT INTO "login_history" VALUES (4,NULL,NULL,'8270277153','student','106.192.71.220','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',1,NULL,'DL-140307','2026-08-18 07:52:07');
INSERT INTO "login_history" VALUES (5,NULL,NULL,'8270277153','student','106.192.71.220','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',1,NULL,'DL-140307','2026-08-18 07:52:32');
INSERT INTO "login_history" VALUES (6,NULL,NULL,'8270277153',NULL,'106.192.71.220','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',0,'Invalid login ID or password','GLOBAL','2026-08-18 07:52:55');
INSERT INTO "login_history" VALUES (7,NULL,NULL,'8270277153','student','106.192.71.220','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',1,NULL,'DL-140307','2026-08-18 07:53:24');
INSERT INTO "login_history" VALUES (8,11,'null','9911914800','admin','167.103.4.106','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'SCH8912','2026-09-07 09:35:23');
INSERT INTO "login_history" VALUES (9,23,'auto_lib@gmail.com','9898989898','admin','167.103.4.106','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'AUTOTEST','2026-09-07 12:49:43');
INSERT INTO "login_history" VALUES (10,12,NULL,'9898989696','student','167.103.4.106','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'DPS123','2026-09-07 12:50:33');
INSERT INTO "login_history" VALUES (11,14,NULL,'9898989696','student','167.103.4.106','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'DPS123','2026-09-07 15:04:34');
INSERT INTO "login_history" VALUES (12,23,'auto_lib@gmail.com','9898989898','admin','167.103.4.106','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'AUTOTEST','2026-09-07 15:04:39');
INSERT INTO "login_history" VALUES (13,14,NULL,'9898989696','student','122.161.50.168','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-07 15:25:23');
INSERT INTO "login_history" VALUES (14,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.168','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-07 15:25:49');
INSERT INTO "login_history" VALUES (15,14,NULL,'9898989696','student','122.161.50.168','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-07 15:28:39');
INSERT INTO "login_history" VALUES (16,14,NULL,'9898989696','student','122.161.50.168','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-07 15:36:06');
INSERT INTO "login_history" VALUES (17,14,NULL,'9898989696','student','122.161.50.168','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-07 15:40:06');
INSERT INTO "login_history" VALUES (18,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 11:56:56');
INSERT INTO "login_history" VALUES (19,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 11:59:21');
INSERT INTO "login_history" VALUES (20,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 11:59:36');
INSERT INTO "login_history" VALUES (21,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','curl/8.7.1',1,NULL,'AUTOTEST','2026-09-10 12:00:38');
INSERT INTO "login_history" VALUES (22,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','curl/8.7.1',1,NULL,'AUTOTEST','2026-09-10 12:19:46');
INSERT INTO "login_history" VALUES (23,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 13:29:43');
INSERT INTO "login_history" VALUES (24,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','curl/8.7.1',1,NULL,'AUTOTEST','2026-09-10 13:31:36');
INSERT INTO "login_history" VALUES (25,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 13:32:08');
INSERT INTO "login_history" VALUES (26,24,'stud1@gmail.com','9797979797','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',0,'Account is banned','AUTOTEST','2026-09-10 13:37:04');
INSERT INTO "login_history" VALUES (27,24,'stud1@gmail.com','9797979797','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',0,'Account is banned','AUTOTEST','2026-09-10 13:37:06');
INSERT INTO "login_history" VALUES (28,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 13:37:08');
INSERT INTO "login_history" VALUES (29,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 13:37:17');
INSERT INTO "login_history" VALUES (30,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 13:45:28');
INSERT INTO "login_history" VALUES (31,9999,NULL,'superadmin','super_admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 13:47:19');
INSERT INTO "login_history" VALUES (32,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 13:47:30');
INSERT INTO "login_history" VALUES (33,NULL,'','',NULL,'122.161.50.162','curl/8.7.1',0,'Missing login ID or password','GLOBAL','2026-09-10 13:51:45');
INSERT INTO "login_history" VALUES (34,NULL,'','',NULL,'122.161.50.162','curl/8.7.1',0,'Missing login ID or password','GLOBAL','2026-09-10 13:51:48');
INSERT INTO "login_history" VALUES (35,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 13:59:50');
INSERT INTO "login_history" VALUES (36,9999,NULL,'superadmin','super_admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 14:17:02');
INSERT INTO "login_history" VALUES (37,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 14:17:12');
INSERT INTO "login_history" VALUES (38,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 14:26:15');
INSERT INTO "login_history" VALUES (39,14,NULL,'9898989696','student','136.226.230.175','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'DPS123','2026-09-10 14:39:07');
INSERT INTO "login_history" VALUES (40,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 14:39:26');
INSERT INTO "login_history" VALUES (41,14,NULL,'9898989696','student','136.226.230.175','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'DPS123','2026-09-10 14:47:25');
INSERT INTO "login_history" VALUES (42,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 14:55:00');
INSERT INTO "login_history" VALUES (43,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-10 14:57:11');
INSERT INTO "login_history" VALUES (44,14,NULL,'9898989696','student','136.226.230.175','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'DPS123','2026-09-10 14:58:06');
INSERT INTO "login_history" VALUES (45,14,NULL,'9898989696','student','136.226.230.175','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',1,NULL,'DPS123','2026-09-10 15:00:03');
INSERT INTO "login_history" VALUES (46,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-10 15:01:36');
INSERT INTO "login_history" VALUES (47,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-11 16:58:44');
INSERT INTO "login_history" VALUES (48,14,NULL,'9898989696','student','122.161.50.162','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',1,NULL,'DPS123','2026-09-11 17:08:17');
INSERT INTO "login_history" VALUES (49,23,'auto_lib@gmail.com','9898989898','admin','103.102.75.200','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-12 03:55:51');
INSERT INTO "login_history" VALUES (50,23,'auto_lib@gmail.com','9898989898','admin','103.102.75.200','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-12 03:55:52');
INSERT INTO "login_history" VALUES (51,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.189','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-15 06:39:40');
INSERT INTO "login_history" VALUES (52,9999,NULL,'superadmin','super_admin','122.161.50.189','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-15 06:44:36');
INSERT INTO "login_history" VALUES (53,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.189','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-15 06:45:02');
INSERT INTO "login_history" VALUES (54,9999,NULL,'superadmin','super_admin','122.161.50.189','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',1,NULL,'DPS123','2026-09-15 06:46:25');
INSERT INTO "login_history" VALUES (55,9999,NULL,'superadmin','super_admin','122.161.50.189','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-15 06:51:02');
INSERT INTO "login_history" VALUES (56,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.189','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-15 06:52:26');
INSERT INTO "login_history" VALUES (57,14,NULL,'9898989696','student','122.161.50.189','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-15 13:57:23');
INSERT INTO "login_history" VALUES (58,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.189','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',1,NULL,'AUTOTEST','2026-09-15 14:14:43');
INSERT INTO "login_history" VALUES (59,23,'auto_lib@gmail.com','9898989898','admin','122.161.48.255','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',1,NULL,'AUTOTEST','2026-09-20 09:08:50');
INSERT INTO "login_history" VALUES (60,24,'stud1@gmail.com','9797979797','student','122.161.48.255','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',0,'Account is banned','AUTOTEST','2026-09-20 09:09:48');
INSERT INTO "login_history" VALUES (61,24,'stud1@gmail.com','9797979797','student','122.161.48.255','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',0,'Account is banned','AUTOTEST','2026-09-20 09:09:55');
INSERT INTO "login_history" VALUES (62,24,'stud1@gmail.com','9797979797','student','122.161.48.255','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',0,'Account is banned','AUTOTEST','2026-09-20 09:10:04');
INSERT INTO "login_history" VALUES (63,24,'stud1@gmail.com','9797979797','student','122.161.48.255','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',0,'Account is banned','AUTOTEST','2026-09-20 09:10:15');
INSERT INTO "login_history" VALUES (64,14,NULL,'9898989696','student','122.161.48.255','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',1,NULL,'DPS123','2026-09-20 09:10:17');
INSERT INTO "login_history" VALUES (65,9999,NULL,'superadmin','super_admin','122.161.48.255','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',1,NULL,'DPS123','2026-09-20 09:46:56');
INSERT INTO "login_history" VALUES (66,23,'auto_lib@gmail.com','9898989898','admin','122.161.50.173','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-22 07:12:38');
INSERT INTO "login_history" VALUES (67,9999,NULL,'superadmin','super_admin','136.226.230.189','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0',1,NULL,'DPS123','2026-09-23 11:37:34');
INSERT INTO "login_history" VALUES (68,14,NULL,'9898989696','student','122.161.48.19','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-23 11:54:44');
INSERT INTO "login_history" VALUES (69,NULL,'','',NULL,'::1','curl/8.5.0',0,'Missing login ID or password','GLOBAL','2026-09-23 12:25:17');
INSERT INTO "login_history" VALUES (70,NULL,'','',NULL,'::1','curl/8.5.0',0,'Missing login ID or password','GLOBAL','2026-09-23 12:25:47');
INSERT INTO "login_history" VALUES (71,NULL,'','',NULL,'::1','curl/8.5.0',0,'Missing login ID or password','GLOBAL','2026-09-23 12:25:52');
INSERT INTO "login_history" VALUES (72,NULL,NULL,'9898989898',NULL,'::1','curl/8.5.0',0,'Invalid login ID or password','GLOBAL','2026-09-23 12:29:56');
INSERT INTO "login_history" VALUES (73,23,'auto_lib@gmail.com','9898989898','admin','::1','curl/8.5.0',1,NULL,'AUTOTEST','2026-09-23 12:30:04');
INSERT INTO "login_history" VALUES (74,14,NULL,'9898989696','student','122.161.48.19','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-23 14:42:17');
INSERT INTO "login_history" VALUES (75,23,'auto_lib@gmail.com','9898989898','admin','122.161.48.19','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-23 14:42:30');
INSERT INTO "login_history" VALUES (76,NULL,'','',NULL,'::ffff:127.0.0.1','',0,'Missing login ID or password','GLOBAL','2026-09-23 14:43:00');
INSERT INTO "login_history" VALUES (77,13,'ayushmangupta003@gmail.com','123','student','::ffff:127.0.0.1','',1,NULL,'dps123','2026-09-23 14:43:26');
INSERT INTO "login_history" VALUES (78,23,'auto_lib@gmail.com','9898989898','admin','136.226.230.189','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0',1,NULL,'AUTOTEST','2026-09-24 05:25:20');
INSERT INTO "login_history" VALUES (79,14,NULL,'9898989696','student','122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-26 10:43:30');
INSERT INTO "login_history" VALUES (80,NULL,NULL,'superadmin',NULL,'122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',0,'Invalid login ID or password','GLOBAL','2026-09-26 10:43:52');
INSERT INTO "login_history" VALUES (81,NULL,NULL,'superadmin',NULL,'122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',0,'Invalid login ID or password','GLOBAL','2026-09-26 10:43:54');
INSERT INTO "login_history" VALUES (82,NULL,NULL,'superadmin',NULL,'122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',0,'Invalid login ID or password','GLOBAL','2026-09-26 10:43:55');
INSERT INTO "login_history" VALUES (83,18,'guptaashish123@gmail.com','8527198907','super_admin','122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'GLOBAL','2026-09-26 10:44:15');
INSERT INTO "login_history" VALUES (84,23,'auto_lib@gmail.com','9898989898','admin','122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-26 12:18:20');
INSERT INTO "login_history" VALUES (85,14,NULL,'9898989696','student','122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'DPS123','2026-09-26 12:41:06');
INSERT INTO "login_history" VALUES (86,23,'auto_lib@gmail.com','9898989898','admin','122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-26 12:48:22');
INSERT INTO "login_history" VALUES (87,23,'auto_lib@gmail.com','9898989898','admin','122.161.49.73','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',1,NULL,'AUTOTEST','2026-09-26 12:48:43');
INSERT INTO "login_history" VALUES (88,NULL,NULL,'superadmin',NULL,'136.226.230.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0',0,'Invalid login ID or password','GLOBAL','2026-09-27 08:14:27');
INSERT INTO "login_history" VALUES (89,NULL,NULL,'superadmin',NULL,'136.226.230.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0',0,'Invalid login ID or password','GLOBAL','2026-09-27 08:14:29');
INSERT INTO "login_history" VALUES (90,NULL,NULL,'superadmin',NULL,'136.226.230.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0',0,'Invalid login ID or password','GLOBAL','2026-09-27 08:14:31');
INSERT INTO "login_history" VALUES (91,11,'null','9911914800','admin','136.226.230.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0',1,NULL,'SCH8912','2026-09-27 08:14:38');
INSERT INTO "login_history" VALUES (92,NULL,'naeemnasreen@hotmail.com',NULL,NULL,'196.200.232.75','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',0,'Invalid login ID or password','GLOBAL','2026-09-30 11:03:37');
INSERT INTO "login_history" VALUES (93,NULL,'naeemnasreen@hotmail.com',NULL,NULL,'196.200.232.75','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',0,'Invalid login ID or password','GLOBAL','2026-09-30 11:03:58');
INSERT INTO "login_history" VALUES (94,NULL,NULL,'superadmin',NULL,'175.107.141.50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',0,'Invalid login ID or password','GLOBAL','2026-10-02 05:17:22');
INSERT INTO "login_history" VALUES (95,11,'null','9911914800','admin','175.107.141.50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',1,NULL,'SCH8912','2026-10-02 05:17:41');
INSERT INTO "login_history" VALUES (96,23,'auto_lib@gmail.com','9898989898','admin','175.107.141.50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',1,NULL,'AUTOTEST','2026-10-02 05:17:48');
INSERT INTO "login_history" VALUES (97,NULL,NULL,'superadmin',NULL,'175.107.141.50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',0,'Invalid login ID or password','GLOBAL','2026-10-02 05:20:10');
INSERT INTO "login_history" VALUES (98,18,'guptaashish123@gmail.com','8527198907','super_admin','175.107.141.50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',1,NULL,'GLOBAL','2026-10-02 05:20:30');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "logs" (
  "id" longtext DEFAULT NULL,
  "user_id" longtext DEFAULT NULL,
  "action" longtext DEFAULT NULL,
  "module" longtext DEFAULT NULL,
  "ip_address" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "details" text DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "logs" VALUES ('1','-1','Created school SCH8912','Schools','null','2026-06-03 22:43','null',NULL);
INSERT INTO "logs" VALUES ('2','11','Imported 1 students','Import','null','2026-06-03 22:50','SCH8912',NULL);
INSERT INTO "logs" VALUES ('3','-1','Updated subscription for ORG33184 to PROFESSIONAL','Billing','null','2026-06-16 17:23','null',NULL);
INSERT INTO "logs" VALUES ('4','-1','Created school SCH8259','Schools','null','2026-06-16 17:40','null',NULL);
INSERT INTO "logs" VALUES ('5','-1','Created school AUTOTEST','Schools','null','2026-06-16 18:05','null',NULL);
INSERT INTO "logs" VALUES ('6','-1','Updated subscription for DPS123 to PROFESSIONAL','Billing','null','2026-06-20 07:07','null',NULL);
INSERT INTO "logs" VALUES ('7','-1','Updated subscription for DPS123 to BASIC','Billing','null','2026-06-23 14:35','null',NULL);
INSERT INTO "logs" VALUES ('8','-1','Updated subscription for DPS123 to PROFESSIONAL','Billing','null','2026-06-23 14:35','null',NULL);
INSERT INTO "logs" VALUES ('9','-1','Created school 2321','Schools','null','2026-06-24 06:31','null',NULL);
INSERT INTO "logs" VALUES ('10','-1','Created school VBPSG','Schools','null','2026-06-24 10:15','null',NULL);
INSERT INTO "logs" VALUES ('11','-1','Created school ABC','Schools','null','2026-06-24 10:20','null',NULL);
INSERT INTO "logs" VALUES ('12','-1','Updated subscription for ABC to PROFESSIONAL','Billing','null','2026-06-24 14:32','null',NULL);
INSERT INTO "logs" VALUES ('13','-1','Created school SAS','Schools','null','2026-06-26 12:18','null',NULL);
INSERT INTO "logs" VALUES ('14','-1','Updated subscription for SAS to PROFESSIONAL','Billing','null','2026-06-26 12:21','null',NULL);
INSERT INTO "logs" VALUES ('15','-1','Created school AKA','Schools','null','2026-06-26 12:25','null',NULL);
INSERT INTO "logs" VALUES ('16','-1','Updated subscription for 2321 to PROFESSIONAL','Billing','null','2026-06-29 10:48','null',NULL);
INSERT INTO "logs" VALUES ('17','-1','Updated subscription for 123 to PROFESSIONAL','Billing','null','2026-06-30 17:11','null',NULL);
INSERT INTO "logs" VALUES ('18','48','Deleted Acquisition #1 (Bill INV-10293)','Acquisition','null','2026-07-07 22:29','2321',NULL);
INSERT INTO "logs" VALUES ('19','48','Deleted Acquisition #2 (Bill INV-10293)','Acquisition','null','2026-07-07 22:34','2321',NULL);
INSERT INTO "logs" VALUES ('20','48','Deleted Acquisition #4 (Bill INV-85310)','Acquisition','null','2026-07-07 23:06','2321',NULL);
INSERT INTO "logs" VALUES ('21','-1','Created school 4343','Schools','null','2026-07-15 05:48','null',NULL);
INSERT INTO "logs" VALUES (NULL,'18','User logged in (super_admin - GLOBAL)','auth','122.161.49.143','2026-08-15 18:03:14','GLOBAL','{\"phone\":\"8527198907\",\"email\":\"guptaashish123@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'57','User logged in (admin - 4343)','auth','122.161.49.143','2026-08-15 18:06:15','4343','{\"phone\":\"8971\",\"email\":\"JOHNPIG@123\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (8270277153)','auth','106.192.71.220','2026-08-18 13:20:54','GLOBAL','{\"phone\":\"8270277153\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','User logged in (student - DL-140307)','auth','106.192.71.220','2026-08-18 13:22:07','DL-140307','{\"phone\":\"8270277153\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','User logged in (student - DL-140307)','auth','106.192.71.220','2026-08-18 13:22:32','DL-140307','{\"phone\":\"8270277153\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (8270277153)','auth','106.192.71.220','2026-08-18 13:22:55','GLOBAL','{\"phone\":\"8270277153\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','User logged in (student - DL-140307)','auth','106.192.71.220','2026-08-18 13:23:24','DL-140307','{\"phone\":\"8270277153\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'11','User logged in (admin - SCH8912)','auth','167.103.4.106','2026-09-07 15:05:23','SCH8912','{\"phone\":\"9911914800\",\"email\":\"null\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','167.103.4.106','2026-09-07 18:19:43','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'12','User logged in (student - DPS123)','auth','167.103.4.106','2026-09-07 18:20:33','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','167.103.4.106','2026-09-07 20:34:34','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','167.103.4.106','2026-09-07 20:34:39','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.168','2026-09-07 20:55:23','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.168','2026-09-07 20:55:49','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.168','2026-09-07 20:58:39','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.168','2026-09-07 21:06:06','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.168','2026-09-07 21:10:06','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 17:26:56','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-10 17:29:21','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 17:29:36','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 17:30:38','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 17:49:46','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 18:59:43','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 19:01:36','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 19:02:08','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'24','Failed login attempt: Account is banned (9797979797)','auth','122.161.50.162','2026-09-10 19:07:04','AUTOTEST','{\"phone\":\"9797979797\",\"email\":\"stud1@gmail.com\",\"success\":0,\"reason\":\"Account is banned\"}');
INSERT INTO "logs" VALUES (NULL,'24','Failed login attempt: Account is banned (9797979797)','auth','122.161.50.162','2026-09-10 19:07:06','AUTOTEST','{\"phone\":\"9797979797\",\"email\":\"stud1@gmail.com\",\"success\":0,\"reason\":\"Account is banned\"}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-10 19:07:08','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 19:07:17','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 19:15:28','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','User logged in (super_admin - DPS123)','auth','122.161.50.162','2026-09-10 19:17:19','DPS123','{\"phone\":\"superadmin\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 19:17:30','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Missing login ID or password (unknown)','auth','122.161.50.162','2026-09-10 19:21:45','GLOBAL','{\"phone\":\"\",\"email\":\"\",\"success\":0,\"reason\":\"Missing login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Missing login ID or password (unknown)','auth','122.161.50.162','2026-09-10 19:21:48','GLOBAL','{\"phone\":\"\",\"email\":\"\",\"success\":0,\"reason\":\"Missing login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-10 19:29:50','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','User logged in (super_admin - DPS123)','auth','122.161.50.162','2026-09-10 19:47:02','DPS123','{\"phone\":\"superadmin\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 19:47:12','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','Deleted Studio Session: Grade 10 Physics: Magnetic Induction','studio','122.161.50.162','2026-09-10 19:56:07','AUTOTEST','{\"sessionId\":1}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-10 19:56:15','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','136.226.230.175','2026-09-10 20:09:07','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 20:09:26','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','Scheduled Live Studio Class: abc (All Students)','studio','122.161.50.162','2026-09-10 20:09:58','AUTOTEST','{\"sessionId\":2,\"meetingCode\":\"LIB-2-183353\",\"jaasRoomName\":\"librika-2-24050614\",\"scheduledStart\":\"2026-09-10T14:39:00.000Z\"}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','136.226.230.175','2026-09-10 20:17:25','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-10 20:25:00','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.162','2026-09-10 20:27:11','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','136.226.230.175','2026-09-10 20:28:06','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','136.226.230.175','2026-09-10 20:30:03','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-10 20:31:36','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','Created Online Meeting: hello bacho (LIB-EAS-T6A)','meeting','122.161.50.162','2026-09-11 20:58:51','AUTOTEST','{\"uid\":\"mtg_9jDfmB9LS8mnHK\",\"meetingCode\":\"LIB-EAS-T6A\",\"jaasRoomName\":\"librika-mtg_9jDfmB9LS8mnHK-993885ab\",\"scheduledStart\":\"2026-09-11 15:28:00\"}');
INSERT INTO "logs" VALUES (NULL,'23','Deleted Studio Session: abc','studio','122.161.50.162','2026-09-11 21:19:51','AUTOTEST','{\"sessionId\":2}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-11 22:28:44','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.162','2026-09-11 22:38:17','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','103.102.75.200','2026-09-12 09:25:51','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','103.102.75.200','2026-09-12 09:25:52','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.189','2026-09-15 12:09:40','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','User logged in (super_admin - DPS123)','auth','122.161.50.189','2026-09-15 12:14:36','DPS123','{\"phone\":\"superadmin\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.189','2026-09-15 12:15:02','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','User logged in (super_admin - DPS123)','auth','122.161.50.189','2026-09-15 12:16:25','DPS123','{\"phone\":\"superadmin\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','User logged in (super_admin - DPS123)','auth','122.161.50.189','2026-09-15 12:21:02','DPS123','{\"phone\":\"superadmin\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','Created advertisement: \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\" [BANNER]','marketing','122.161.50.189','2026-09-15 12:21:49','00000','');
INSERT INTO "logs" VALUES (NULL,'9999','Created advertisement: \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\" [BANNER]','marketing','122.161.50.189','2026-09-15 12:21:51','00000','');
INSERT INTO "logs" VALUES (NULL,'9999','Created advertisement: \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\" [BANNER]','marketing','122.161.50.189','2026-09-15 12:21:51','00000','');
INSERT INTO "logs" VALUES (NULL,'9999','Created advertisement: \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\" [BANNER]','marketing','122.161.50.189','2026-09-15 12:21:57','00000','');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.189','2026-09-15 12:22:26','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.50.189','2026-09-15 19:27:23','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.189','2026-09-15 19:44:43','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.48.255','2026-09-20 14:38:50','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'24','Failed login attempt: Account is banned (9797979797)','auth','122.161.48.255','2026-09-20 14:39:48','AUTOTEST','{\"phone\":\"9797979797\",\"email\":\"stud1@gmail.com\",\"success\":0,\"reason\":\"Account is banned\"}');
INSERT INTO "logs" VALUES (NULL,'24','Failed login attempt: Account is banned (9797979797)','auth','122.161.48.255','2026-09-20 14:39:55','AUTOTEST','{\"phone\":\"9797979797\",\"email\":\"stud1@gmail.com\",\"success\":0,\"reason\":\"Account is banned\"}');
INSERT INTO "logs" VALUES (NULL,'24','Failed login attempt: Account is banned (9797979797)','auth','122.161.48.255','2026-09-20 14:40:04','AUTOTEST','{\"phone\":\"9797979797\",\"email\":\"stud1@gmail.com\",\"success\":0,\"reason\":\"Account is banned\"}');
INSERT INTO "logs" VALUES (NULL,'24','Failed login attempt: Account is banned (9797979797)','auth','122.161.48.255','2026-09-20 14:40:15','AUTOTEST','{\"phone\":\"9797979797\",\"email\":\"stud1@gmail.com\",\"success\":0,\"reason\":\"Account is banned\"}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.48.255','2026-09-20 14:40:17','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','User logged in (super_admin - DPS123)','auth','122.161.48.255','2026-09-20 15:16:56','DPS123','{\"phone\":\"superadmin\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.50.173','2026-09-22 12:42:38','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'9999','User logged in (super_admin - DPS123)','auth','136.226.230.189','2026-09-23 17:07:34','DPS123','{\"phone\":\"superadmin\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.48.19','2026-09-23 17:24:44','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Missing login ID or password (unknown)','auth','::1','2026-09-23 17:55:17','GLOBAL','{\"phone\":\"\",\"email\":\"\",\"success\":0,\"reason\":\"Missing login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Missing login ID or password (unknown)','auth','::1','2026-09-23 17:55:47','GLOBAL','{\"phone\":\"\",\"email\":\"\",\"success\":0,\"reason\":\"Missing login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Missing login ID or password (unknown)','auth','::1','2026-09-23 17:55:52','GLOBAL','{\"phone\":\"\",\"email\":\"\",\"success\":0,\"reason\":\"Missing login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (9898989898)','auth','::1','2026-09-23 17:59:56','GLOBAL','{\"phone\":\"9898989898\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','::1','2026-09-23 18:00:04','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.48.19','2026-09-23 20:12:17','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.48.19','2026-09-23 20:12:30','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Missing login ID or password (unknown)','auth','::ffff:127.0.0.1','2026-09-23 20:13:00','GLOBAL','{\"phone\":\"\",\"email\":\"\",\"success\":0,\"reason\":\"Missing login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'13','User logged in (student - dps123)','auth','::ffff:127.0.0.1','2026-09-23 20:13:26','dps123','{\"phone\":\"123\",\"email\":\"ayushmangupta003@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','136.226.230.189','2026-09-24 10:55:20','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.49.73','2026-09-26 16:13:30','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','122.161.49.73','2026-09-26 16:13:52','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','122.161.49.73','2026-09-26 16:13:54','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','122.161.49.73','2026-09-26 16:13:55','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'18','User logged in (super_admin - GLOBAL)','auth','122.161.49.73','2026-09-26 16:14:15','GLOBAL','{\"phone\":\"8527198907\",\"email\":\"guptaashish123@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.49.73','2026-09-26 17:48:20','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'14','User logged in (student - DPS123)','auth','122.161.49.73','2026-09-26 18:11:06','DPS123','{\"phone\":\"9898989696\",\"email\":null,\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.49.73','2026-09-26 18:18:22','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','122.161.49.73','2026-09-26 18:18:43','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','136.226.230.172','2026-09-27 13:44:27','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','136.226.230.172','2026-09-27 13:44:29','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','136.226.230.172','2026-09-27 13:44:31','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'11','User logged in (admin - SCH8912)','auth','136.226.230.172','2026-09-27 13:44:38','SCH8912','{\"phone\":\"9911914800\",\"email\":\"null\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (naeemnasreen@hotmail.com)','auth','196.200.232.75','2026-09-30 16:33:37','GLOBAL','{\"phone\":null,\"email\":\"naeemnasreen@hotmail.com\",\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (naeemnasreen@hotmail.com)','auth','196.200.232.75','2026-09-30 16:33:58','GLOBAL','{\"phone\":null,\"email\":\"naeemnasreen@hotmail.com\",\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','175.107.141.50','2026-10-02 10:47:22','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'11','User logged in (admin - SCH8912)','auth','175.107.141.50','2026-10-02 10:47:41','SCH8912','{\"phone\":\"9911914800\",\"email\":\"null\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'23','User logged in (admin - AUTOTEST)','auth','175.107.141.50','2026-10-02 10:47:48','AUTOTEST','{\"phone\":\"9898989898\",\"email\":\"auto_lib@gmail.com\",\"success\":1,\"reason\":null}');
INSERT INTO "logs" VALUES (NULL,'0','Failed login attempt: Invalid login ID or password (superadmin)','auth','175.107.141.50','2026-10-02 10:50:10','GLOBAL','{\"phone\":\"superadmin\",\"email\":null,\"success\":0,\"reason\":\"Invalid login ID or password\"}');
INSERT INTO "logs" VALUES (NULL,'18','User logged in (super_admin - GLOBAL)','auth','175.107.141.50','2026-10-02 10:50:30','GLOBAL','{\"phone\":\"8527198907\",\"email\":\"guptaashish123@gmail.com\",\"success\":1,\"reason\":null}');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "meeting_join_requests" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "meeting_id" bigint(20) unsigned NOT NULL,
  "meeting_uid" varchar(30) DEFAULT NULL,
  "user_id" bigint(20) unsigned NOT NULL,
  "user_name" varchar(255) DEFAULT NULL,
  "user_role" varchar(50) DEFAULT NULL,
  "status" varchar(20) DEFAULT 'pending',
  "requested_at" datetime DEFAULT current_timestamp(),
  "decided_at" datetime DEFAULT NULL,
  "decided_by" bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_jr_meeting" ("meeting_id"),
  KEY "idx_jr_user" ("user_id"),
  KEY "idx_jr_status" ("status")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "meeting_participants" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "meeting_id" bigint(20) unsigned NOT NULL,
  "meeting_uid" varchar(30) DEFAULT NULL,
  "user_id" bigint(20) unsigned NOT NULL,
  "user_uid" varchar(30) DEFAULT NULL,
  "user_name" varchar(255) DEFAULT NULL,
  "role" varchar(20) DEFAULT 'participant',
  "invitation_status" varchar(20) DEFAULT 'pending',
  "invited_at" datetime DEFAULT current_timestamp(),
  "responded_at" datetime DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_mp_meeting" ("meeting_id"),
  KEY "idx_mp_user" ("user_id"),
  KEY "idx_mp_status" ("invitation_status")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "meeting_participants" VALUES (1,1,'mtg_Pe3gt6NZ4dBdav',23,'lib_usr_000023','Librarian Auto','host','accepted','2026-09-11 20:27:58',NULL);
INSERT INTO "meeting_participants" VALUES (2,2,'mtg_9jDfmB9LS8mnHK',23,'lib_usr_000023','Librarian Auto','host','accepted','2026-09-11 20:58:51',NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "meeting_recordings" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "meeting_id" bigint(20) unsigned NOT NULL,
  "meeting_uid" varchar(30) DEFAULT NULL,
  "recording_url" text DEFAULT NULL,
  "duration_seconds" int(11) DEFAULT 0,
  "file_size_bytes" bigint(20) DEFAULT 0,
  "status" varchar(20) DEFAULT 'processing',
  "started_at" datetime DEFAULT NULL,
  "ended_at" datetime DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  KEY "idx_mr_meeting" ("meeting_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "meeting_sessions" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "meeting_id" bigint(20) unsigned NOT NULL,
  "meeting_uid" varchar(30) DEFAULT NULL,
  "user_id" bigint(20) unsigned NOT NULL,
  "user_name" varchar(255) DEFAULT NULL,
  "user_role" varchar(50) DEFAULT 'participant',
  "session_token" varchar(64) DEFAULT NULL,
  "joined_at" datetime NOT NULL,
  "left_at" datetime DEFAULT NULL,
  "duration_seconds" int(11) DEFAULT 0,
  "last_heartbeat_at" datetime DEFAULT NULL,
  "join_method" varchar(20) DEFAULT 'direct',
  "device_info" varchar(255) DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_ms_meeting" ("meeting_id"),
  KEY "idx_ms_user" ("user_id"),
  KEY "idx_ms_token" ("session_token")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "meetings" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "uid" varchar(30) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text DEFAULT NULL,
  "meeting_type" varchar(20) DEFAULT 'INVITE_ONLY',
  "session_type" varchar(20) DEFAULT 'CLASS',
  "host_user_id" bigint(20) unsigned NOT NULL,
  "host_name" varchar(255) DEFAULT NULL,
  "host_uid" varchar(30) DEFAULT NULL,
  "meeting_code" varchar(30) DEFAULT NULL,
  "jaas_room_name" varchar(120) DEFAULT NULL,
  "status" varchar(20) DEFAULT 'DRAFT',
  "scheduled_start" datetime DEFAULT NULL,
  "scheduled_end" datetime DEFAULT NULL,
  "duration_minutes" int(11) DEFAULT 60,
  "actual_start" datetime DEFAULT NULL,
  "actual_end" datetime DEFAULT NULL,
  "class_name" varchar(100) DEFAULT 'All Students',
  "school_code" varchar(50) DEFAULT 'DPS123',
  "max_participants" int(11) DEFAULT 100,
  "lobby_enabled" tinyint(1) DEFAULT 1,
  "recording_enabled" tinyint(1) DEFAULT 0,
  "passcode" varchar(50) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "updated_at" timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "uk_meeting_uid" ("uid"),
  UNIQUE KEY "uk_meeting_code" ("meeting_code"),
  KEY "idx_mtg_host" ("host_user_id"),
  KEY "idx_mtg_status" ("status"),
  KEY "idx_mtg_school" ("school_code"),
  KEY "idx_mtg_start" ("scheduled_start")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "meetings" VALUES (1,'mtg_Pe3gt6NZ4dBdav','abc','blhh','CLASS','CLASS',23,'Librarian Auto','lib_usr_000023','LIB-2-183353','librika-2-24050614','SCHEDULED','2026-09-10 14:39:00','2026-09-10 15:39:00',60,NULL,NULL,'All Students','AUTOTEST',100,1,0,NULL,'2026-09-11 14:57:58','2026-09-11 14:57:58');
INSERT INTO "meetings" VALUES (2,'mtg_9jDfmB9LS8mnHK','hello bacho','bla','CLASS','CLASS',23,'Librarian Auto','lib_usr_000023','LIB-EAS-T6A','librika-mtg_9jDfmB9LS8mnHK-993885ab','SCHEDULED','2026-09-11 15:28:00','2026-09-11 16:28:00',60,NULL,NULL,'All Students','GLOBAL',100,1,0,NULL,'2026-09-11 15:28:51','2026-09-11 15:37:41');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "notifications" (
  "id" bigint(20) NOT NULL AUTO_INCREMENT,
  "user_id" longtext DEFAULT NULL,
  "message" longtext DEFAULT NULL,
  "type" longtext DEFAULT NULL,
  "is_read" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "notifications" VALUES (1,'44','Your reservation for \'Anns\' has been placed.','reservation','0','2026-06-23 12:22','DPS123');
INSERT INTO "notifications" VALUES (2,'44','Your reservation for \'Tiny Changes, Remarkable Results\' has been placed.','reservation','0','2026-06-23 12:22','DPS123');
INSERT INTO "notifications" VALUES (3,'44','Your reservation for \'The Psychology of Money\' has been placed.','reservation','0','2026-06-23 13:05','DPS123');
INSERT INTO "notifications" VALUES (4,'44','Your reservation for \'Mathematics\' has been placed.','reservation','0','2026-06-23 18:33','DPS123');
INSERT INTO "notifications" VALUES (5,'49','Your reservation for \'The Psychology of Money\' has been placed.','reservation','0','2026-06-29 10:51','2321');
INSERT INTO "notifications" VALUES (6,'49','Your reservation for \'The Psychology of Money\' has been approved and the book is now issued to you (due 2026-07-21).','reservation_approved','0','2026-07-07 22:34','2321');
INSERT INTO "notifications" VALUES (7,'44','Your reservation for \'Anns\' has been approved and the book is now issued to you (due 2026-07-29).','reservation_approved','0','2026-07-15 05:46','DPS123');
INSERT INTO "notifications" VALUES (8,'44','Your reservation for \'Tiny Changes, Remarkable Results\' has been approved and the book is now issued to you (due 2026-07-29).','reservation_approved','0','2026-07-15 05:46','DPS123');
INSERT INTO "notifications" VALUES (9,'44','Your reservation for \'The Psychology of Money\' has been approved and the book is now issued to you (due 2026-07-29).','reservation_approved','0','2026-07-15 05:46','DPS123');
INSERT INTO "notifications" VALUES (10,'44','Your reservation for \'Mathematics\' has been approved and the book is now issued to you (due 2026-07-29).','reservation_approved','0','2026-07-15 05:46','DPS123');
INSERT INTO "notifications" VALUES (11,'10','Hello all','info','0','2026-08-05 09:47:29','00000');
INSERT INTO "notifications" VALUES (12,'11','Hello all','info','0','2026-08-05 09:47:29','SCH8912');
INSERT INTO "notifications" VALUES (13,'12','Hello all','info','1','2026-08-05 09:47:29','DPSGZB');
INSERT INTO "notifications" VALUES (14,'13','Hello all','info','0','2026-08-05 09:47:29','dps123');
INSERT INTO "notifications" VALUES (15,'14','Hello all','info','0','2026-08-05 09:47:29','dps123');
INSERT INTO "notifications" VALUES (16,'17','Hello all','info','0','2026-08-05 09:47:29','DPS123');
INSERT INTO "notifications" VALUES (17,'18','Hello all','info','1','2026-08-05 09:47:29','GLOBAL');
INSERT INTO "notifications" VALUES (18,'19','Hello all','info','0','2026-08-05 09:47:29','ORG33184');
INSERT INTO "notifications" VALUES (19,'20','Hello all','info','0','2026-08-05 09:47:29','SCH8259');
INSERT INTO "notifications" VALUES (20,'21','Hello all','info','0','2026-08-05 09:47:29','codex');
INSERT INTO "notifications" VALUES (21,'22','Hello all','info','0','2026-08-05 09:47:29','12345678');
INSERT INTO "notifications" VALUES (22,'23','Hello all','info','1','2026-08-05 09:47:29','AUTOTEST');
INSERT INTO "notifications" VALUES (23,'24','Hello all','info','1','2026-08-05 09:47:29','AUTOTEST');
INSERT INTO "notifications" VALUES (24,'25','Hello all','info','1','2026-08-05 09:47:29','AUTOTEST');
INSERT INTO "notifications" VALUES (25,'26','Hello all','info','1','2026-08-05 09:47:29','GLOBAL');
INSERT INTO "notifications" VALUES (26,'27','Hello all','info','0','2026-08-05 09:47:29','SCH8259');
INSERT INTO "notifications" VALUES (27,'28','Hello all','info','0','2026-08-05 09:47:29','PERS_1686430576');
INSERT INTO "notifications" VALUES (28,'29','Hello all','info','0','2026-08-05 09:47:29','PERS_1686469424');
INSERT INTO "notifications" VALUES (29,'30','Hello all','info','0','2026-08-05 09:47:29','PERS_1687169676');
INSERT INTO "notifications" VALUES (30,'31','Hello all','info','0','2026-08-05 09:47:29','PERS_1010');
INSERT INTO "notifications" VALUES (31,'32','Hello all','info','0','2026-08-05 09:47:29','PERS_1687915531');
INSERT INTO "notifications" VALUES (32,'33','Hello all','info','0','2026-08-05 09:47:29','PERS_1688425985');
INSERT INTO "notifications" VALUES (33,'34','Hello all','info','0','2026-08-05 09:47:29','PERS_1698080521');
INSERT INTO "notifications" VALUES (34,'35','Hello all','info','0','2026-08-05 09:47:29','PERS_1698635237');
INSERT INTO "notifications" VALUES (35,'36','Hello all','info','0','2026-08-05 09:47:29','PERS_1698664310');
INSERT INTO "notifications" VALUES (36,'37','Hello all','info','0','2026-08-05 09:47:29','PERS_1698985699');
INSERT INTO "notifications" VALUES (37,'38','Hello all','info','0','2026-08-05 09:47:29','PERS_1699721478');
INSERT INTO "notifications" VALUES (38,'39','Hello all','info','1','2026-08-05 09:47:29','GLOBAL');
INSERT INTO "notifications" VALUES (39,'40','Hello all','info','0','2026-08-05 09:47:29','DPS123');
INSERT INTO "notifications" VALUES (40,'41','Hello all','info','0','2026-08-05 09:47:29','DPS123');
INSERT INTO "notifications" VALUES (41,'42','Hello all','info','0','2026-08-05 09:47:29','ORG67207');
INSERT INTO "notifications" VALUES (42,'43','Hello all','info','0','2026-08-05 09:47:29','DPS123');
INSERT INTO "notifications" VALUES (43,'44','Hello all','info','0','2026-08-05 09:47:29','DPS123');
INSERT INTO "notifications" VALUES (44,'45','Hello all','info','0','2026-08-05 09:47:29','PERS_2220685710');
INSERT INTO "notifications" VALUES (45,'46','Hello all','info','0','2026-08-05 09:47:29','PERS_2220723439');
INSERT INTO "notifications" VALUES (46,'47','Hello all','info','0','2026-08-05 09:47:29','PERS_2221315654');
INSERT INTO "notifications" VALUES (47,'48','Hello all','info','0','2026-08-05 09:47:29','2321');
INSERT INTO "notifications" VALUES (48,'49','Hello all','info','0','2026-08-05 09:47:29','2321');
INSERT INTO "notifications" VALUES (49,'50','Hello all','info','0','2026-08-05 09:47:29','ABC');
INSERT INTO "notifications" VALUES (50,'51','Hello all','info','0','2026-08-05 09:47:29','ABC');
INSERT INTO "notifications" VALUES (51,'52','Hello all','info','0','2026-08-05 09:47:29','PERS_1111');
INSERT INTO "notifications" VALUES (52,'53','Hello all','info','0','2026-08-05 09:47:29','SAS');
INSERT INTO "notifications" VALUES (53,'55','Hello all','info','0','2026-08-05 09:47:29','123');
INSERT INTO "notifications" VALUES (54,'56','Hello all','info','0','2026-08-05 09:47:29','123');
INSERT INTO "notifications" VALUES (55,'57','Hello all','info','1','2026-08-05 09:47:29','4343');
INSERT INTO "notifications" VALUES (56,'9999','Hello all','info','0','2026-08-05 09:47:29','00000');
INSERT INTO "notifications" VALUES (57,'9998','Hello all','info','0','2026-08-05 09:47:29','00000');
INSERT INTO "notifications" VALUES (58,'10','Hello Ll','info','0','2026-08-05 15:06:50','00000');
INSERT INTO "notifications" VALUES (59,'11','Hello Ll','info','0','2026-08-05 15:06:50','SCH8912');
INSERT INTO "notifications" VALUES (60,'12','Hello Ll','info','0','2026-08-05 15:06:50','DPSGZB');
INSERT INTO "notifications" VALUES (61,'13','Hello Ll','info','0','2026-08-05 15:06:50','dps123');
INSERT INTO "notifications" VALUES (62,'14','Hello Ll','info','0','2026-08-05 15:06:50','dps123');
INSERT INTO "notifications" VALUES (63,'17','Hello Ll','info','0','2026-08-05 15:06:50','DPS123');
INSERT INTO "notifications" VALUES (64,'18','Hello Ll','info','1','2026-08-05 15:06:50','GLOBAL');
INSERT INTO "notifications" VALUES (65,'19','Hello Ll','info','0','2026-08-05 15:06:50','ORG33184');
INSERT INTO "notifications" VALUES (66,'20','Hello Ll','info','0','2026-08-05 15:06:50','SCH8259');
INSERT INTO "notifications" VALUES (67,'21','Hello Ll','info','0','2026-08-05 15:06:50','codex');
INSERT INTO "notifications" VALUES (68,'22','Hello Ll','info','0','2026-08-05 15:06:50','12345678');
INSERT INTO "notifications" VALUES (69,'23','Hello Ll','info','1','2026-08-05 15:06:50','AUTOTEST');
INSERT INTO "notifications" VALUES (70,'24','Hello Ll','info','1','2026-08-05 15:06:50','AUTOTEST');
INSERT INTO "notifications" VALUES (71,'25','Hello Ll','info','1','2026-08-05 15:06:50','AUTOTEST');
INSERT INTO "notifications" VALUES (72,'26','Hello Ll','info','1','2026-08-05 15:06:50','GLOBAL');
INSERT INTO "notifications" VALUES (73,'27','Hello Ll','info','0','2026-08-05 15:06:50','SCH8259');
INSERT INTO "notifications" VALUES (74,'28','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1686430576');
INSERT INTO "notifications" VALUES (75,'29','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1686469424');
INSERT INTO "notifications" VALUES (76,'30','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1687169676');
INSERT INTO "notifications" VALUES (77,'31','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1010');
INSERT INTO "notifications" VALUES (78,'32','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1687915531');
INSERT INTO "notifications" VALUES (79,'33','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1688425985');
INSERT INTO "notifications" VALUES (80,'34','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1698080521');
INSERT INTO "notifications" VALUES (81,'35','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1698635237');
INSERT INTO "notifications" VALUES (82,'36','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1698664310');
INSERT INTO "notifications" VALUES (83,'37','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1698985699');
INSERT INTO "notifications" VALUES (84,'38','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1699721478');
INSERT INTO "notifications" VALUES (85,'39','Hello Ll','info','1','2026-08-05 15:06:50','GLOBAL');
INSERT INTO "notifications" VALUES (86,'40','Hello Ll','info','0','2026-08-05 15:06:50','DPS123');
INSERT INTO "notifications" VALUES (87,'41','Hello Ll','info','0','2026-08-05 15:06:50','DPS123');
INSERT INTO "notifications" VALUES (88,'42','Hello Ll','info','0','2026-08-05 15:06:50','ORG67207');
INSERT INTO "notifications" VALUES (89,'43','Hello Ll','info','0','2026-08-05 15:06:50','DPS123');
INSERT INTO "notifications" VALUES (90,'44','Hello Ll','info','0','2026-08-05 15:06:50','DPS123');
INSERT INTO "notifications" VALUES (91,'45','Hello Ll','info','0','2026-08-05 15:06:50','PERS_2220685710');
INSERT INTO "notifications" VALUES (92,'46','Hello Ll','info','0','2026-08-05 15:06:50','PERS_2220723439');
INSERT INTO "notifications" VALUES (93,'47','Hello Ll','info','0','2026-08-05 15:06:50','PERS_2221315654');
INSERT INTO "notifications" VALUES (94,'48','Hello Ll','info','0','2026-08-05 15:06:50','2321');
INSERT INTO "notifications" VALUES (95,'49','Hello Ll','info','0','2026-08-05 15:06:50','2321');
INSERT INTO "notifications" VALUES (96,'50','Hello Ll','info','0','2026-08-05 15:06:50','ABC');
INSERT INTO "notifications" VALUES (97,'51','Hello Ll','info','0','2026-08-05 15:06:50','ABC');
INSERT INTO "notifications" VALUES (98,'52','Hello Ll','info','0','2026-08-05 15:06:50','PERS_1111');
INSERT INTO "notifications" VALUES (99,'53','Hello Ll','info','0','2026-08-05 15:06:50','SAS');
INSERT INTO "notifications" VALUES (100,'55','Hello Ll','info','0','2026-08-05 15:06:50','123');
INSERT INTO "notifications" VALUES (101,'56','Hello Ll','info','0','2026-08-05 15:06:50','123');
INSERT INTO "notifications" VALUES (102,'57','Hello Ll','info','1','2026-08-05 15:06:50','4343');
INSERT INTO "notifications" VALUES (103,'9999','Hello Ll','info','0','2026-08-05 15:06:50','00000');
INSERT INTO "notifications" VALUES (104,'9998','Hello Ll','info','0','2026-08-05 15:06:50','00000');
INSERT INTO "notifications" VALUES (105,'10','Hello Ll','info','0','2026-08-05 15:06:52','00000');
INSERT INTO "notifications" VALUES (106,'11','Hello Ll','info','0','2026-08-05 15:06:52','SCH8912');
INSERT INTO "notifications" VALUES (107,'12','Hello Ll','info','0','2026-08-05 15:06:52','DPSGZB');
INSERT INTO "notifications" VALUES (108,'13','Hello Ll','info','0','2026-08-05 15:06:52','dps123');
INSERT INTO "notifications" VALUES (109,'14','Hello Ll','info','0','2026-08-05 15:06:52','dps123');
INSERT INTO "notifications" VALUES (110,'17','Hello Ll','info','0','2026-08-05 15:06:52','DPS123');
INSERT INTO "notifications" VALUES (111,'18','Hello Ll','info','1','2026-08-05 15:06:52','GLOBAL');
INSERT INTO "notifications" VALUES (112,'19','Hello Ll','info','0','2026-08-05 15:06:52','ORG33184');
INSERT INTO "notifications" VALUES (113,'20','Hello Ll','info','0','2026-08-05 15:06:52','SCH8259');
INSERT INTO "notifications" VALUES (114,'21','Hello Ll','info','0','2026-08-05 15:06:52','codex');
INSERT INTO "notifications" VALUES (115,'22','Hello Ll','info','0','2026-08-05 15:06:52','12345678');
INSERT INTO "notifications" VALUES (116,'23','Hello Ll','info','1','2026-08-05 15:06:52','AUTOTEST');
INSERT INTO "notifications" VALUES (117,'24','Hello Ll','info','1','2026-08-05 15:06:52','AUTOTEST');
INSERT INTO "notifications" VALUES (118,'25','Hello Ll','info','1','2026-08-05 15:06:52','AUTOTEST');
INSERT INTO "notifications" VALUES (119,'26','Hello Ll','info','1','2026-08-05 15:06:52','GLOBAL');
INSERT INTO "notifications" VALUES (120,'27','Hello Ll','info','0','2026-08-05 15:06:52','SCH8259');
INSERT INTO "notifications" VALUES (121,'28','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1686430576');
INSERT INTO "notifications" VALUES (122,'29','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1686469424');
INSERT INTO "notifications" VALUES (123,'30','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1687169676');
INSERT INTO "notifications" VALUES (124,'31','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1010');
INSERT INTO "notifications" VALUES (125,'32','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1687915531');
INSERT INTO "notifications" VALUES (126,'33','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1688425985');
INSERT INTO "notifications" VALUES (127,'34','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1698080521');
INSERT INTO "notifications" VALUES (128,'35','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1698635237');
INSERT INTO "notifications" VALUES (129,'36','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1698664310');
INSERT INTO "notifications" VALUES (130,'37','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1698985699');
INSERT INTO "notifications" VALUES (131,'38','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1699721478');
INSERT INTO "notifications" VALUES (132,'39','Hello Ll','info','1','2026-08-05 15:06:52','GLOBAL');
INSERT INTO "notifications" VALUES (133,'40','Hello Ll','info','0','2026-08-05 15:06:52','DPS123');
INSERT INTO "notifications" VALUES (134,'41','Hello Ll','info','0','2026-08-05 15:06:52','DPS123');
INSERT INTO "notifications" VALUES (135,'42','Hello Ll','info','0','2026-08-05 15:06:52','ORG67207');
INSERT INTO "notifications" VALUES (136,'43','Hello Ll','info','0','2026-08-05 15:06:52','DPS123');
INSERT INTO "notifications" VALUES (137,'44','Hello Ll','info','0','2026-08-05 15:06:52','DPS123');
INSERT INTO "notifications" VALUES (138,'45','Hello Ll','info','0','2026-08-05 15:06:52','PERS_2220685710');
INSERT INTO "notifications" VALUES (139,'46','Hello Ll','info','0','2026-08-05 15:06:52','PERS_2220723439');
INSERT INTO "notifications" VALUES (140,'47','Hello Ll','info','0','2026-08-05 15:06:52','PERS_2221315654');
INSERT INTO "notifications" VALUES (141,'48','Hello Ll','info','0','2026-08-05 15:06:52','2321');
INSERT INTO "notifications" VALUES (142,'49','Hello Ll','info','0','2026-08-05 15:06:52','2321');
INSERT INTO "notifications" VALUES (143,'50','Hello Ll','info','0','2026-08-05 15:06:52','ABC');
INSERT INTO "notifications" VALUES (144,'51','Hello Ll','info','0','2026-08-05 15:06:52','ABC');
INSERT INTO "notifications" VALUES (145,'52','Hello Ll','info','0','2026-08-05 15:06:52','PERS_1111');
INSERT INTO "notifications" VALUES (146,'53','Hello Ll','info','0','2026-08-05 15:06:52','SAS');
INSERT INTO "notifications" VALUES (147,'55','Hello Ll','info','0','2026-08-05 15:06:52','123');
INSERT INTO "notifications" VALUES (148,'56','Hello Ll','info','0','2026-08-05 15:06:52','123');
INSERT INTO "notifications" VALUES (149,'57','Hello Ll','info','1','2026-08-05 15:06:52','4343');
INSERT INTO "notifications" VALUES (150,'9999','Hello Ll','info','0','2026-08-05 15:06:52','00000');
INSERT INTO "notifications" VALUES (151,'9998','Hello Ll','info','0','2026-08-05 15:06:52','00000');
INSERT INTO "notifications" VALUES (152,'10','Hello Ll','info','0','2026-08-05 15:07:10','00000');
INSERT INTO "notifications" VALUES (153,'11','Hello Ll','info','0','2026-08-05 15:07:10','SCH8912');
INSERT INTO "notifications" VALUES (154,'12','Hello Ll','info','0','2026-08-05 15:07:10','DPSGZB');
INSERT INTO "notifications" VALUES (155,'13','Hello Ll','info','0','2026-08-05 15:07:10','dps123');
INSERT INTO "notifications" VALUES (156,'14','Hello Ll','info','0','2026-08-05 15:07:10','dps123');
INSERT INTO "notifications" VALUES (157,'17','Hello Ll','info','0','2026-08-05 15:07:10','DPS123');
INSERT INTO "notifications" VALUES (158,'18','Hello Ll','info','1','2026-08-05 15:07:10','GLOBAL');
INSERT INTO "notifications" VALUES (159,'19','Hello Ll','info','0','2026-08-05 15:07:10','ORG33184');
INSERT INTO "notifications" VALUES (160,'20','Hello Ll','info','0','2026-08-05 15:07:10','SCH8259');
INSERT INTO "notifications" VALUES (161,'21','Hello Ll','info','0','2026-08-05 15:07:10','codex');
INSERT INTO "notifications" VALUES (162,'22','Hello Ll','info','0','2026-08-05 15:07:10','12345678');
INSERT INTO "notifications" VALUES (163,'23','Hello Ll','info','1','2026-08-05 15:07:10','AUTOTEST');
INSERT INTO "notifications" VALUES (164,'24','Hello Ll','info','1','2026-08-05 15:07:10','AUTOTEST');
INSERT INTO "notifications" VALUES (165,'25','Hello Ll','info','1','2026-08-05 15:07:10','AUTOTEST');
INSERT INTO "notifications" VALUES (166,'26','Hello Ll','info','1','2026-08-05 15:07:10','GLOBAL');
INSERT INTO "notifications" VALUES (167,'27','Hello Ll','info','0','2026-08-05 15:07:10','SCH8259');
INSERT INTO "notifications" VALUES (168,'28','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1686430576');
INSERT INTO "notifications" VALUES (169,'29','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1686469424');
INSERT INTO "notifications" VALUES (170,'30','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1687169676');
INSERT INTO "notifications" VALUES (171,'31','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1010');
INSERT INTO "notifications" VALUES (172,'32','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1687915531');
INSERT INTO "notifications" VALUES (173,'33','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1688425985');
INSERT INTO "notifications" VALUES (174,'34','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1698080521');
INSERT INTO "notifications" VALUES (175,'35','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1698635237');
INSERT INTO "notifications" VALUES (176,'36','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1698664310');
INSERT INTO "notifications" VALUES (177,'37','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1698985699');
INSERT INTO "notifications" VALUES (178,'38','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1699721478');
INSERT INTO "notifications" VALUES (179,'39','Hello Ll','info','1','2026-08-05 15:07:10','GLOBAL');
INSERT INTO "notifications" VALUES (180,'40','Hello Ll','info','0','2026-08-05 15:07:10','DPS123');
INSERT INTO "notifications" VALUES (181,'41','Hello Ll','info','0','2026-08-05 15:07:10','DPS123');
INSERT INTO "notifications" VALUES (182,'42','Hello Ll','info','0','2026-08-05 15:07:10','ORG67207');
INSERT INTO "notifications" VALUES (183,'43','Hello Ll','info','0','2026-08-05 15:07:10','DPS123');
INSERT INTO "notifications" VALUES (184,'44','Hello Ll','info','0','2026-08-05 15:07:10','DPS123');
INSERT INTO "notifications" VALUES (185,'45','Hello Ll','info','0','2026-08-05 15:07:10','PERS_2220685710');
INSERT INTO "notifications" VALUES (186,'46','Hello Ll','info','0','2026-08-05 15:07:10','PERS_2220723439');
INSERT INTO "notifications" VALUES (187,'47','Hello Ll','info','0','2026-08-05 15:07:10','PERS_2221315654');
INSERT INTO "notifications" VALUES (188,'48','Hello Ll','info','0','2026-08-05 15:07:10','2321');
INSERT INTO "notifications" VALUES (189,'49','Hello Ll','info','0','2026-08-05 15:07:10','2321');
INSERT INTO "notifications" VALUES (190,'50','Hello Ll','info','0','2026-08-05 15:07:10','ABC');
INSERT INTO "notifications" VALUES (191,'51','Hello Ll','info','0','2026-08-05 15:07:10','ABC');
INSERT INTO "notifications" VALUES (192,'52','Hello Ll','info','0','2026-08-05 15:07:10','PERS_1111');
INSERT INTO "notifications" VALUES (193,'53','Hello Ll','info','0','2026-08-05 15:07:10','SAS');
INSERT INTO "notifications" VALUES (194,'55','Hello Ll','info','0','2026-08-05 15:07:10','123');
INSERT INTO "notifications" VALUES (195,'56','Hello Ll','info','0','2026-08-05 15:07:10','123');
INSERT INTO "notifications" VALUES (196,'57','Hello Ll','info','1','2026-08-05 15:07:10','4343');
INSERT INTO "notifications" VALUES (197,'9999','Hello Ll','info','0','2026-08-05 15:07:10','00000');
INSERT INTO "notifications" VALUES (198,'9998','Hello Ll','info','0','2026-08-05 15:07:10','00000');
INSERT INTO "notifications" VALUES (199,'10','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (200,'11','Hello Ll','info','0','2026-08-05 15:07:12','SCH8912');
INSERT INTO "notifications" VALUES (201,'12','Hello Ll','info','0','2026-08-05 15:07:12','DPSGZB');
INSERT INTO "notifications" VALUES (202,'13','Hello Ll','info','0','2026-08-05 15:07:12','dps123');
INSERT INTO "notifications" VALUES (203,'14','Hello Ll','info','0','2026-08-05 15:07:12','dps123');
INSERT INTO "notifications" VALUES (204,'17','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (205,'18','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (206,'19','Hello Ll','info','0','2026-08-05 15:07:12','ORG33184');
INSERT INTO "notifications" VALUES (207,'20','Hello Ll','info','0','2026-08-05 15:07:12','SCH8259');
INSERT INTO "notifications" VALUES (208,'21','Hello Ll','info','0','2026-08-05 15:07:12','codex');
INSERT INTO "notifications" VALUES (209,'22','Hello Ll','info','0','2026-08-05 15:07:12','12345678');
INSERT INTO "notifications" VALUES (210,'23','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (211,'24','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (212,'25','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (213,'26','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (214,'27','Hello Ll','info','0','2026-08-05 15:07:12','SCH8259');
INSERT INTO "notifications" VALUES (215,'28','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1686430576');
INSERT INTO "notifications" VALUES (216,'29','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1686469424');
INSERT INTO "notifications" VALUES (217,'30','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1687169676');
INSERT INTO "notifications" VALUES (218,'31','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1010');
INSERT INTO "notifications" VALUES (219,'32','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1687915531');
INSERT INTO "notifications" VALUES (220,'33','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1688425985');
INSERT INTO "notifications" VALUES (221,'34','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698080521');
INSERT INTO "notifications" VALUES (222,'35','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698635237');
INSERT INTO "notifications" VALUES (223,'36','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698664310');
INSERT INTO "notifications" VALUES (224,'37','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698985699');
INSERT INTO "notifications" VALUES (225,'38','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1699721478');
INSERT INTO "notifications" VALUES (226,'39','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (227,'40','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (228,'41','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (229,'42','Hello Ll','info','0','2026-08-05 15:07:12','ORG67207');
INSERT INTO "notifications" VALUES (230,'43','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (231,'44','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (232,'45','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2220685710');
INSERT INTO "notifications" VALUES (233,'46','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2220723439');
INSERT INTO "notifications" VALUES (234,'47','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2221315654');
INSERT INTO "notifications" VALUES (235,'48','Hello Ll','info','0','2026-08-05 15:07:12','2321');
INSERT INTO "notifications" VALUES (236,'49','Hello Ll','info','0','2026-08-05 15:07:12','2321');
INSERT INTO "notifications" VALUES (237,'50','Hello Ll','info','0','2026-08-05 15:07:12','ABC');
INSERT INTO "notifications" VALUES (238,'51','Hello Ll','info','0','2026-08-05 15:07:12','ABC');
INSERT INTO "notifications" VALUES (239,'52','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1111');
INSERT INTO "notifications" VALUES (240,'53','Hello Ll','info','0','2026-08-05 15:07:12','SAS');
INSERT INTO "notifications" VALUES (241,'55','Hello Ll','info','0','2026-08-05 15:07:12','123');
INSERT INTO "notifications" VALUES (242,'56','Hello Ll','info','0','2026-08-05 15:07:12','123');
INSERT INTO "notifications" VALUES (243,'57','Hello Ll','info','1','2026-08-05 15:07:12','4343');
INSERT INTO "notifications" VALUES (244,'9999','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (245,'9998','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (246,'10','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (247,'11','Hello Ll','info','0','2026-08-05 15:07:12','SCH8912');
INSERT INTO "notifications" VALUES (248,'12','Hello Ll','info','0','2026-08-05 15:07:12','DPSGZB');
INSERT INTO "notifications" VALUES (249,'13','Hello Ll','info','0','2026-08-05 15:07:12','dps123');
INSERT INTO "notifications" VALUES (250,'14','Hello Ll','info','0','2026-08-05 15:07:12','dps123');
INSERT INTO "notifications" VALUES (251,'17','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (252,'18','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (253,'19','Hello Ll','info','0','2026-08-05 15:07:12','ORG33184');
INSERT INTO "notifications" VALUES (254,'20','Hello Ll','info','0','2026-08-05 15:07:12','SCH8259');
INSERT INTO "notifications" VALUES (255,'21','Hello Ll','info','0','2026-08-05 15:07:12','codex');
INSERT INTO "notifications" VALUES (256,'22','Hello Ll','info','0','2026-08-05 15:07:12','12345678');
INSERT INTO "notifications" VALUES (257,'23','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (258,'24','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (259,'25','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (260,'26','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (261,'27','Hello Ll','info','0','2026-08-05 15:07:12','SCH8259');
INSERT INTO "notifications" VALUES (262,'28','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1686430576');
INSERT INTO "notifications" VALUES (263,'29','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1686469424');
INSERT INTO "notifications" VALUES (264,'30','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1687169676');
INSERT INTO "notifications" VALUES (265,'31','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1010');
INSERT INTO "notifications" VALUES (266,'32','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1687915531');
INSERT INTO "notifications" VALUES (267,'33','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1688425985');
INSERT INTO "notifications" VALUES (268,'34','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698080521');
INSERT INTO "notifications" VALUES (269,'35','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698635237');
INSERT INTO "notifications" VALUES (270,'36','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698664310');
INSERT INTO "notifications" VALUES (271,'37','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698985699');
INSERT INTO "notifications" VALUES (272,'38','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1699721478');
INSERT INTO "notifications" VALUES (273,'39','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (274,'40','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (275,'41','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (276,'42','Hello Ll','info','0','2026-08-05 15:07:12','ORG67207');
INSERT INTO "notifications" VALUES (277,'43','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (278,'44','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (279,'45','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2220685710');
INSERT INTO "notifications" VALUES (280,'46','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2220723439');
INSERT INTO "notifications" VALUES (281,'47','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2221315654');
INSERT INTO "notifications" VALUES (282,'48','Hello Ll','info','0','2026-08-05 15:07:12','2321');
INSERT INTO "notifications" VALUES (283,'49','Hello Ll','info','0','2026-08-05 15:07:12','2321');
INSERT INTO "notifications" VALUES (284,'50','Hello Ll','info','0','2026-08-05 15:07:12','ABC');
INSERT INTO "notifications" VALUES (285,'51','Hello Ll','info','0','2026-08-05 15:07:12','ABC');
INSERT INTO "notifications" VALUES (286,'52','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1111');
INSERT INTO "notifications" VALUES (287,'53','Hello Ll','info','0','2026-08-05 15:07:12','SAS');
INSERT INTO "notifications" VALUES (288,'55','Hello Ll','info','0','2026-08-05 15:07:12','123');
INSERT INTO "notifications" VALUES (289,'56','Hello Ll','info','0','2026-08-05 15:07:12','123');
INSERT INTO "notifications" VALUES (290,'57','Hello Ll','info','1','2026-08-05 15:07:12','4343');
INSERT INTO "notifications" VALUES (291,'9999','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (292,'9998','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (293,'10','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (294,'11','Hello Ll','info','0','2026-08-05 15:07:12','SCH8912');
INSERT INTO "notifications" VALUES (295,'12','Hello Ll','info','0','2026-08-05 15:07:12','DPSGZB');
INSERT INTO "notifications" VALUES (296,'13','Hello Ll','info','0','2026-08-05 15:07:12','dps123');
INSERT INTO "notifications" VALUES (297,'14','Hello Ll','info','0','2026-08-05 15:07:12','dps123');
INSERT INTO "notifications" VALUES (298,'17','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (299,'18','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (300,'19','Hello Ll','info','0','2026-08-05 15:07:12','ORG33184');
INSERT INTO "notifications" VALUES (301,'20','Hello Ll','info','0','2026-08-05 15:07:12','SCH8259');
INSERT INTO "notifications" VALUES (302,'21','Hello Ll','info','0','2026-08-05 15:07:12','codex');
INSERT INTO "notifications" VALUES (303,'22','Hello Ll','info','0','2026-08-05 15:07:12','12345678');
INSERT INTO "notifications" VALUES (304,'23','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (305,'24','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (306,'25','Hello Ll','info','1','2026-08-05 15:07:12','AUTOTEST');
INSERT INTO "notifications" VALUES (307,'26','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (308,'27','Hello Ll','info','0','2026-08-05 15:07:12','SCH8259');
INSERT INTO "notifications" VALUES (309,'28','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1686430576');
INSERT INTO "notifications" VALUES (310,'29','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1686469424');
INSERT INTO "notifications" VALUES (311,'30','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1687169676');
INSERT INTO "notifications" VALUES (312,'31','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1010');
INSERT INTO "notifications" VALUES (313,'32','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1687915531');
INSERT INTO "notifications" VALUES (314,'33','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1688425985');
INSERT INTO "notifications" VALUES (315,'34','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698080521');
INSERT INTO "notifications" VALUES (316,'35','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698635237');
INSERT INTO "notifications" VALUES (317,'36','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698664310');
INSERT INTO "notifications" VALUES (318,'37','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1698985699');
INSERT INTO "notifications" VALUES (319,'38','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1699721478');
INSERT INTO "notifications" VALUES (320,'39','Hello Ll','info','1','2026-08-05 15:07:12','GLOBAL');
INSERT INTO "notifications" VALUES (321,'40','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (322,'41','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (323,'42','Hello Ll','info','0','2026-08-05 15:07:12','ORG67207');
INSERT INTO "notifications" VALUES (324,'43','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (325,'44','Hello Ll','info','0','2026-08-05 15:07:12','DPS123');
INSERT INTO "notifications" VALUES (326,'45','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2220685710');
INSERT INTO "notifications" VALUES (327,'46','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2220723439');
INSERT INTO "notifications" VALUES (328,'47','Hello Ll','info','0','2026-08-05 15:07:12','PERS_2221315654');
INSERT INTO "notifications" VALUES (329,'48','Hello Ll','info','0','2026-08-05 15:07:12','2321');
INSERT INTO "notifications" VALUES (330,'49','Hello Ll','info','0','2026-08-05 15:07:12','2321');
INSERT INTO "notifications" VALUES (331,'50','Hello Ll','info','0','2026-08-05 15:07:12','ABC');
INSERT INTO "notifications" VALUES (332,'51','Hello Ll','info','0','2026-08-05 15:07:12','ABC');
INSERT INTO "notifications" VALUES (333,'52','Hello Ll','info','0','2026-08-05 15:07:12','PERS_1111');
INSERT INTO "notifications" VALUES (334,'53','Hello Ll','info','0','2026-08-05 15:07:12','SAS');
INSERT INTO "notifications" VALUES (335,'55','Hello Ll','info','0','2026-08-05 15:07:12','123');
INSERT INTO "notifications" VALUES (336,'56','Hello Ll','info','0','2026-08-05 15:07:12','123');
INSERT INTO "notifications" VALUES (337,'57','Hello Ll','info','1','2026-08-05 15:07:12','4343');
INSERT INTO "notifications" VALUES (338,'9999','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (339,'9998','Hello Ll','info','0','2026-08-05 15:07:12','00000');
INSERT INTO "notifications" VALUES (340,'10','Hello Ll','info','0','2026-08-05 15:07:15','00000');
INSERT INTO "notifications" VALUES (341,'11','Hello Ll','info','0','2026-08-05 15:07:15','SCH8912');
INSERT INTO "notifications" VALUES (342,'12','Hello Ll','info','0','2026-08-05 15:07:15','DPSGZB');
INSERT INTO "notifications" VALUES (343,'13','Hello Ll','info','0','2026-08-05 15:07:15','dps123');
INSERT INTO "notifications" VALUES (344,'14','Hello Ll','info','0','2026-08-05 15:07:15','dps123');
INSERT INTO "notifications" VALUES (345,'17','Hello Ll','info','0','2026-08-05 15:07:15','DPS123');
INSERT INTO "notifications" VALUES (346,'18','Hello Ll','info','1','2026-08-05 15:07:15','GLOBAL');
INSERT INTO "notifications" VALUES (347,'19','Hello Ll','info','0','2026-08-05 15:07:15','ORG33184');
INSERT INTO "notifications" VALUES (348,'20','Hello Ll','info','0','2026-08-05 15:07:15','SCH8259');
INSERT INTO "notifications" VALUES (349,'21','Hello Ll','info','0','2026-08-05 15:07:15','codex');
INSERT INTO "notifications" VALUES (350,'22','Hello Ll','info','0','2026-08-05 15:07:15','12345678');
INSERT INTO "notifications" VALUES (351,'23','Hello Ll','info','1','2026-08-05 15:07:15','AUTOTEST');
INSERT INTO "notifications" VALUES (352,'24','Hello Ll','info','1','2026-08-05 15:07:15','AUTOTEST');
INSERT INTO "notifications" VALUES (353,'25','Hello Ll','info','1','2026-08-05 15:07:15','AUTOTEST');
INSERT INTO "notifications" VALUES (354,'26','Hello Ll','info','1','2026-08-05 15:07:15','GLOBAL');
INSERT INTO "notifications" VALUES (355,'27','Hello Ll','info','0','2026-08-05 15:07:15','SCH8259');
INSERT INTO "notifications" VALUES (356,'28','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1686430576');
INSERT INTO "notifications" VALUES (357,'29','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1686469424');
INSERT INTO "notifications" VALUES (358,'30','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1687169676');
INSERT INTO "notifications" VALUES (359,'31','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1010');
INSERT INTO "notifications" VALUES (360,'32','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1687915531');
INSERT INTO "notifications" VALUES (361,'33','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1688425985');
INSERT INTO "notifications" VALUES (362,'34','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1698080521');
INSERT INTO "notifications" VALUES (363,'35','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1698635237');
INSERT INTO "notifications" VALUES (364,'36','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1698664310');
INSERT INTO "notifications" VALUES (365,'37','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1698985699');
INSERT INTO "notifications" VALUES (366,'38','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1699721478');
INSERT INTO "notifications" VALUES (367,'39','Hello Ll','info','1','2026-08-05 15:07:15','GLOBAL');
INSERT INTO "notifications" VALUES (368,'40','Hello Ll','info','0','2026-08-05 15:07:15','DPS123');
INSERT INTO "notifications" VALUES (369,'41','Hello Ll','info','0','2026-08-05 15:07:15','DPS123');
INSERT INTO "notifications" VALUES (370,'42','Hello Ll','info','0','2026-08-05 15:07:15','ORG67207');
INSERT INTO "notifications" VALUES (371,'43','Hello Ll','info','0','2026-08-05 15:07:15','DPS123');
INSERT INTO "notifications" VALUES (372,'44','Hello Ll','info','0','2026-08-05 15:07:15','DPS123');
INSERT INTO "notifications" VALUES (373,'45','Hello Ll','info','0','2026-08-05 15:07:15','PERS_2220685710');
INSERT INTO "notifications" VALUES (374,'46','Hello Ll','info','0','2026-08-05 15:07:15','PERS_2220723439');
INSERT INTO "notifications" VALUES (375,'47','Hello Ll','info','0','2026-08-05 15:07:15','PERS_2221315654');
INSERT INTO "notifications" VALUES (376,'48','Hello Ll','info','0','2026-08-05 15:07:15','2321');
INSERT INTO "notifications" VALUES (377,'49','Hello Ll','info','0','2026-08-05 15:07:15','2321');
INSERT INTO "notifications" VALUES (378,'50','Hello Ll','info','0','2026-08-05 15:07:15','ABC');
INSERT INTO "notifications" VALUES (379,'51','Hello Ll','info','0','2026-08-05 15:07:15','ABC');
INSERT INTO "notifications" VALUES (380,'52','Hello Ll','info','0','2026-08-05 15:07:15','PERS_1111');
INSERT INTO "notifications" VALUES (381,'53','Hello Ll','info','0','2026-08-05 15:07:15','SAS');
INSERT INTO "notifications" VALUES (382,'55','Hello Ll','info','0','2026-08-05 15:07:15','123');
INSERT INTO "notifications" VALUES (383,'56','Hello Ll','info','0','2026-08-05 15:07:15','123');
INSERT INTO "notifications" VALUES (384,'57','Hello Ll','info','1','2026-08-05 15:07:15','4343');
INSERT INTO "notifications" VALUES (385,'9999','Hello Ll','info','0','2026-08-05 15:07:15','00000');
INSERT INTO "notifications" VALUES (386,'9998','Hello Ll','info','0','2026-08-05 15:07:15','00000');
INSERT INTO "notifications" VALUES (387,'10','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (388,'11','Hello Ll','info','0','2026-08-05 15:07:16','SCH8912');
INSERT INTO "notifications" VALUES (389,'12','Hello Ll','info','0','2026-08-05 15:07:16','DPSGZB');
INSERT INTO "notifications" VALUES (390,'13','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (391,'14','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (392,'17','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (393,'18','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (394,'19','Hello Ll','info','0','2026-08-05 15:07:16','ORG33184');
INSERT INTO "notifications" VALUES (395,'20','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (396,'21','Hello Ll','info','0','2026-08-05 15:07:16','codex');
INSERT INTO "notifications" VALUES (397,'22','Hello Ll','info','0','2026-08-05 15:07:16','12345678');
INSERT INTO "notifications" VALUES (398,'23','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (399,'24','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (400,'25','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (401,'26','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (402,'27','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (403,'28','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686430576');
INSERT INTO "notifications" VALUES (404,'29','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686469424');
INSERT INTO "notifications" VALUES (405,'30','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687169676');
INSERT INTO "notifications" VALUES (406,'31','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1010');
INSERT INTO "notifications" VALUES (407,'32','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687915531');
INSERT INTO "notifications" VALUES (408,'33','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1688425985');
INSERT INTO "notifications" VALUES (409,'34','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698080521');
INSERT INTO "notifications" VALUES (410,'35','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698635237');
INSERT INTO "notifications" VALUES (411,'36','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698664310');
INSERT INTO "notifications" VALUES (412,'37','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698985699');
INSERT INTO "notifications" VALUES (413,'38','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1699721478');
INSERT INTO "notifications" VALUES (414,'39','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (415,'40','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (416,'41','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (417,'42','Hello Ll','info','0','2026-08-05 15:07:16','ORG67207');
INSERT INTO "notifications" VALUES (418,'43','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (419,'44','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (420,'45','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220685710');
INSERT INTO "notifications" VALUES (421,'46','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220723439');
INSERT INTO "notifications" VALUES (422,'47','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2221315654');
INSERT INTO "notifications" VALUES (423,'48','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (424,'49','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (425,'50','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (426,'51','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (427,'52','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1111');
INSERT INTO "notifications" VALUES (428,'53','Hello Ll','info','0','2026-08-05 15:07:16','SAS');
INSERT INTO "notifications" VALUES (429,'55','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (430,'56','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (431,'57','Hello Ll','info','1','2026-08-05 15:07:16','4343');
INSERT INTO "notifications" VALUES (432,'9999','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (433,'9998','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (434,'10','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (435,'11','Hello Ll','info','0','2026-08-05 15:07:16','SCH8912');
INSERT INTO "notifications" VALUES (436,'12','Hello Ll','info','0','2026-08-05 15:07:16','DPSGZB');
INSERT INTO "notifications" VALUES (437,'13','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (438,'14','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (439,'17','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (440,'18','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (441,'19','Hello Ll','info','0','2026-08-05 15:07:16','ORG33184');
INSERT INTO "notifications" VALUES (442,'20','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (443,'21','Hello Ll','info','0','2026-08-05 15:07:16','codex');
INSERT INTO "notifications" VALUES (444,'22','Hello Ll','info','0','2026-08-05 15:07:16','12345678');
INSERT INTO "notifications" VALUES (445,'23','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (446,'24','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (447,'25','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (448,'26','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (449,'27','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (450,'28','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686430576');
INSERT INTO "notifications" VALUES (451,'29','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686469424');
INSERT INTO "notifications" VALUES (452,'30','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687169676');
INSERT INTO "notifications" VALUES (453,'31','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1010');
INSERT INTO "notifications" VALUES (454,'32','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687915531');
INSERT INTO "notifications" VALUES (455,'33','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1688425985');
INSERT INTO "notifications" VALUES (456,'34','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698080521');
INSERT INTO "notifications" VALUES (457,'35','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698635237');
INSERT INTO "notifications" VALUES (458,'36','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698664310');
INSERT INTO "notifications" VALUES (459,'37','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698985699');
INSERT INTO "notifications" VALUES (460,'38','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1699721478');
INSERT INTO "notifications" VALUES (461,'39','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (462,'40','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (463,'41','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (464,'42','Hello Ll','info','0','2026-08-05 15:07:16','ORG67207');
INSERT INTO "notifications" VALUES (465,'43','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (466,'44','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (467,'45','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220685710');
INSERT INTO "notifications" VALUES (468,'46','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220723439');
INSERT INTO "notifications" VALUES (469,'47','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2221315654');
INSERT INTO "notifications" VALUES (470,'48','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (471,'49','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (472,'50','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (473,'51','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (474,'52','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1111');
INSERT INTO "notifications" VALUES (475,'53','Hello Ll','info','0','2026-08-05 15:07:16','SAS');
INSERT INTO "notifications" VALUES (476,'55','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (477,'56','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (478,'57','Hello Ll','info','1','2026-08-05 15:07:16','4343');
INSERT INTO "notifications" VALUES (479,'9999','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (480,'9998','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (481,'10','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (482,'11','Hello Ll','info','0','2026-08-05 15:07:16','SCH8912');
INSERT INTO "notifications" VALUES (483,'12','Hello Ll','info','0','2026-08-05 15:07:16','DPSGZB');
INSERT INTO "notifications" VALUES (484,'13','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (485,'14','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (486,'17','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (487,'18','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (488,'19','Hello Ll','info','0','2026-08-05 15:07:16','ORG33184');
INSERT INTO "notifications" VALUES (489,'20','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (490,'21','Hello Ll','info','0','2026-08-05 15:07:16','codex');
INSERT INTO "notifications" VALUES (491,'22','Hello Ll','info','0','2026-08-05 15:07:16','12345678');
INSERT INTO "notifications" VALUES (492,'23','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (493,'24','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (494,'25','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (495,'26','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (496,'27','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (497,'28','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686430576');
INSERT INTO "notifications" VALUES (498,'29','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686469424');
INSERT INTO "notifications" VALUES (499,'30','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687169676');
INSERT INTO "notifications" VALUES (500,'31','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1010');
INSERT INTO "notifications" VALUES (501,'32','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687915531');
INSERT INTO "notifications" VALUES (502,'33','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1688425985');
INSERT INTO "notifications" VALUES (503,'34','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698080521');
INSERT INTO "notifications" VALUES (504,'35','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698635237');
INSERT INTO "notifications" VALUES (505,'36','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698664310');
INSERT INTO "notifications" VALUES (506,'37','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698985699');
INSERT INTO "notifications" VALUES (507,'38','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1699721478');
INSERT INTO "notifications" VALUES (508,'39','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (509,'40','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (510,'41','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (511,'42','Hello Ll','info','0','2026-08-05 15:07:16','ORG67207');
INSERT INTO "notifications" VALUES (512,'43','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (513,'44','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (514,'45','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220685710');
INSERT INTO "notifications" VALUES (515,'46','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220723439');
INSERT INTO "notifications" VALUES (516,'47','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2221315654');
INSERT INTO "notifications" VALUES (517,'48','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (518,'49','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (519,'50','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (520,'51','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (521,'52','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1111');
INSERT INTO "notifications" VALUES (522,'53','Hello Ll','info','0','2026-08-05 15:07:16','SAS');
INSERT INTO "notifications" VALUES (523,'55','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (524,'56','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (525,'57','Hello Ll','info','1','2026-08-05 15:07:16','4343');
INSERT INTO "notifications" VALUES (526,'9999','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (527,'9998','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (528,'10','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (529,'11','Hello Ll','info','0','2026-08-05 15:07:16','SCH8912');
INSERT INTO "notifications" VALUES (530,'12','Hello Ll','info','0','2026-08-05 15:07:16','DPSGZB');
INSERT INTO "notifications" VALUES (531,'13','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (532,'14','Hello Ll','info','0','2026-08-05 15:07:16','dps123');
INSERT INTO "notifications" VALUES (533,'17','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (534,'18','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (535,'19','Hello Ll','info','0','2026-08-05 15:07:16','ORG33184');
INSERT INTO "notifications" VALUES (536,'20','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (537,'21','Hello Ll','info','0','2026-08-05 15:07:16','codex');
INSERT INTO "notifications" VALUES (538,'22','Hello Ll','info','0','2026-08-05 15:07:16','12345678');
INSERT INTO "notifications" VALUES (539,'23','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (540,'24','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (541,'25','Hello Ll','info','1','2026-08-05 15:07:16','AUTOTEST');
INSERT INTO "notifications" VALUES (542,'26','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (543,'27','Hello Ll','info','0','2026-08-05 15:07:16','SCH8259');
INSERT INTO "notifications" VALUES (544,'28','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686430576');
INSERT INTO "notifications" VALUES (545,'29','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1686469424');
INSERT INTO "notifications" VALUES (546,'30','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687169676');
INSERT INTO "notifications" VALUES (547,'31','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1010');
INSERT INTO "notifications" VALUES (548,'32','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1687915531');
INSERT INTO "notifications" VALUES (549,'33','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1688425985');
INSERT INTO "notifications" VALUES (550,'34','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698080521');
INSERT INTO "notifications" VALUES (551,'35','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698635237');
INSERT INTO "notifications" VALUES (552,'36','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698664310');
INSERT INTO "notifications" VALUES (553,'37','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1698985699');
INSERT INTO "notifications" VALUES (554,'38','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1699721478');
INSERT INTO "notifications" VALUES (555,'39','Hello Ll','info','1','2026-08-05 15:07:16','GLOBAL');
INSERT INTO "notifications" VALUES (556,'40','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (557,'41','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (558,'42','Hello Ll','info','0','2026-08-05 15:07:16','ORG67207');
INSERT INTO "notifications" VALUES (559,'43','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (560,'44','Hello Ll','info','0','2026-08-05 15:07:16','DPS123');
INSERT INTO "notifications" VALUES (561,'45','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220685710');
INSERT INTO "notifications" VALUES (562,'46','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2220723439');
INSERT INTO "notifications" VALUES (563,'47','Hello Ll','info','0','2026-08-05 15:07:16','PERS_2221315654');
INSERT INTO "notifications" VALUES (564,'48','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (565,'49','Hello Ll','info','0','2026-08-05 15:07:16','2321');
INSERT INTO "notifications" VALUES (566,'50','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (567,'51','Hello Ll','info','0','2026-08-05 15:07:16','ABC');
INSERT INTO "notifications" VALUES (568,'52','Hello Ll','info','0','2026-08-05 15:07:16','PERS_1111');
INSERT INTO "notifications" VALUES (569,'53','Hello Ll','info','0','2026-08-05 15:07:16','SAS');
INSERT INTO "notifications" VALUES (570,'55','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (571,'56','Hello Ll','info','0','2026-08-05 15:07:16','123');
INSERT INTO "notifications" VALUES (572,'57','Hello Ll','info','1','2026-08-05 15:07:16','4343');
INSERT INTO "notifications" VALUES (573,'9999','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (574,'9998','Hello Ll','info','0','2026-08-05 15:07:16','00000');
INSERT INTO "notifications" VALUES (575,'10','Hello Ll','info','0','2026-08-05 15:07:17','00000');
INSERT INTO "notifications" VALUES (576,'11','Hello Ll','info','0','2026-08-05 15:07:17','SCH8912');
INSERT INTO "notifications" VALUES (577,'12','Hello Ll','info','0','2026-08-05 15:07:17','DPSGZB');
INSERT INTO "notifications" VALUES (578,'13','Hello Ll','info','0','2026-08-05 15:07:17','dps123');
INSERT INTO "notifications" VALUES (579,'14','Hello Ll','info','0','2026-08-05 15:07:17','dps123');
INSERT INTO "notifications" VALUES (580,'17','Hello Ll','info','0','2026-08-05 15:07:17','DPS123');
INSERT INTO "notifications" VALUES (581,'18','Hello Ll','info','1','2026-08-05 15:07:17','GLOBAL');
INSERT INTO "notifications" VALUES (582,'19','Hello Ll','info','0','2026-08-05 15:07:17','ORG33184');
INSERT INTO "notifications" VALUES (583,'20','Hello Ll','info','0','2026-08-05 15:07:17','SCH8259');
INSERT INTO "notifications" VALUES (584,'21','Hello Ll','info','0','2026-08-05 15:07:17','codex');
INSERT INTO "notifications" VALUES (585,'22','Hello Ll','info','0','2026-08-05 15:07:17','12345678');
INSERT INTO "notifications" VALUES (586,'23','Hello Ll','info','1','2026-08-05 15:07:17','AUTOTEST');
INSERT INTO "notifications" VALUES (587,'24','Hello Ll','info','1','2026-08-05 15:07:17','AUTOTEST');
INSERT INTO "notifications" VALUES (588,'25','Hello Ll','info','1','2026-08-05 15:07:17','AUTOTEST');
INSERT INTO "notifications" VALUES (589,'26','Hello Ll','info','1','2026-08-05 15:07:17','GLOBAL');
INSERT INTO "notifications" VALUES (590,'27','Hello Ll','info','0','2026-08-05 15:07:17','SCH8259');
INSERT INTO "notifications" VALUES (591,'28','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1686430576');
INSERT INTO "notifications" VALUES (592,'29','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1686469424');
INSERT INTO "notifications" VALUES (593,'30','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1687169676');
INSERT INTO "notifications" VALUES (594,'31','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1010');
INSERT INTO "notifications" VALUES (595,'32','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1687915531');
INSERT INTO "notifications" VALUES (596,'33','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1688425985');
INSERT INTO "notifications" VALUES (597,'34','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1698080521');
INSERT INTO "notifications" VALUES (598,'35','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1698635237');
INSERT INTO "notifications" VALUES (599,'36','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1698664310');
INSERT INTO "notifications" VALUES (600,'37','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1698985699');
INSERT INTO "notifications" VALUES (601,'38','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1699721478');
INSERT INTO "notifications" VALUES (602,'39','Hello Ll','info','1','2026-08-05 15:07:17','GLOBAL');
INSERT INTO "notifications" VALUES (603,'40','Hello Ll','info','0','2026-08-05 15:07:17','DPS123');
INSERT INTO "notifications" VALUES (604,'41','Hello Ll','info','0','2026-08-05 15:07:17','DPS123');
INSERT INTO "notifications" VALUES (605,'42','Hello Ll','info','0','2026-08-05 15:07:17','ORG67207');
INSERT INTO "notifications" VALUES (606,'43','Hello Ll','info','0','2026-08-05 15:07:17','DPS123');
INSERT INTO "notifications" VALUES (607,'44','Hello Ll','info','0','2026-08-05 15:07:17','DPS123');
INSERT INTO "notifications" VALUES (608,'45','Hello Ll','info','0','2026-08-05 15:07:17','PERS_2220685710');
INSERT INTO "notifications" VALUES (609,'46','Hello Ll','info','0','2026-08-05 15:07:17','PERS_2220723439');
INSERT INTO "notifications" VALUES (610,'47','Hello Ll','info','0','2026-08-05 15:07:17','PERS_2221315654');
INSERT INTO "notifications" VALUES (611,'48','Hello Ll','info','0','2026-08-05 15:07:17','2321');
INSERT INTO "notifications" VALUES (612,'49','Hello Ll','info','0','2026-08-05 15:07:17','2321');
INSERT INTO "notifications" VALUES (613,'50','Hello Ll','info','0','2026-08-05 15:07:17','ABC');
INSERT INTO "notifications" VALUES (614,'51','Hello Ll','info','0','2026-08-05 15:07:17','ABC');
INSERT INTO "notifications" VALUES (615,'52','Hello Ll','info','0','2026-08-05 15:07:17','PERS_1111');
INSERT INTO "notifications" VALUES (616,'53','Hello Ll','info','0','2026-08-05 15:07:17','SAS');
INSERT INTO "notifications" VALUES (617,'55','Hello Ll','info','0','2026-08-05 15:07:17','123');
INSERT INTO "notifications" VALUES (618,'56','Hello Ll','info','0','2026-08-05 15:07:17','123');
INSERT INTO "notifications" VALUES (619,'57','Hello Ll','info','1','2026-08-05 15:07:17','4343');
INSERT INTO "notifications" VALUES (620,'9999','Hello Ll','info','0','2026-08-05 15:07:17','00000');
INSERT INTO "notifications" VALUES (621,'9998','Hello Ll','info','0','2026-08-05 15:07:17','00000');
INSERT INTO "notifications" VALUES (622,'10','Hello Ll','info','0','2026-08-05 15:07:18','00000');
INSERT INTO "notifications" VALUES (623,'11','Hello Ll','info','0','2026-08-05 15:07:18','SCH8912');
INSERT INTO "notifications" VALUES (624,'12','Hello Ll','info','0','2026-08-05 15:07:18','DPSGZB');
INSERT INTO "notifications" VALUES (625,'13','Hello Ll','info','0','2026-08-05 15:07:18','dps123');
INSERT INTO "notifications" VALUES (626,'14','Hello Ll','info','0','2026-08-05 15:07:18','dps123');
INSERT INTO "notifications" VALUES (627,'17','Hello Ll','info','0','2026-08-05 15:07:18','DPS123');
INSERT INTO "notifications" VALUES (628,'18','Hello Ll','info','1','2026-08-05 15:07:18','GLOBAL');
INSERT INTO "notifications" VALUES (629,'19','Hello Ll','info','0','2026-08-05 15:07:18','ORG33184');
INSERT INTO "notifications" VALUES (630,'20','Hello Ll','info','0','2026-08-05 15:07:18','SCH8259');
INSERT INTO "notifications" VALUES (631,'21','Hello Ll','info','0','2026-08-05 15:07:18','codex');
INSERT INTO "notifications" VALUES (632,'22','Hello Ll','info','0','2026-08-05 15:07:18','12345678');
INSERT INTO "notifications" VALUES (633,'23','Hello Ll','info','1','2026-08-05 15:07:18','AUTOTEST');
INSERT INTO "notifications" VALUES (634,'24','Hello Ll','info','1','2026-08-05 15:07:18','AUTOTEST');
INSERT INTO "notifications" VALUES (635,'25','Hello Ll','info','1','2026-08-05 15:07:18','AUTOTEST');
INSERT INTO "notifications" VALUES (636,'26','Hello Ll','info','1','2026-08-05 15:07:18','GLOBAL');
INSERT INTO "notifications" VALUES (637,'27','Hello Ll','info','0','2026-08-05 15:07:18','SCH8259');
INSERT INTO "notifications" VALUES (638,'28','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1686430576');
INSERT INTO "notifications" VALUES (639,'29','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1686469424');
INSERT INTO "notifications" VALUES (640,'30','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1687169676');
INSERT INTO "notifications" VALUES (641,'31','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1010');
INSERT INTO "notifications" VALUES (642,'32','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1687915531');
INSERT INTO "notifications" VALUES (643,'33','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1688425985');
INSERT INTO "notifications" VALUES (644,'34','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1698080521');
INSERT INTO "notifications" VALUES (645,'35','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1698635237');
INSERT INTO "notifications" VALUES (646,'36','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1698664310');
INSERT INTO "notifications" VALUES (647,'37','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1698985699');
INSERT INTO "notifications" VALUES (648,'38','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1699721478');
INSERT INTO "notifications" VALUES (649,'39','Hello Ll','info','1','2026-08-05 15:07:18','GLOBAL');
INSERT INTO "notifications" VALUES (650,'40','Hello Ll','info','0','2026-08-05 15:07:18','DPS123');
INSERT INTO "notifications" VALUES (651,'41','Hello Ll','info','0','2026-08-05 15:07:18','DPS123');
INSERT INTO "notifications" VALUES (652,'42','Hello Ll','info','0','2026-08-05 15:07:18','ORG67207');
INSERT INTO "notifications" VALUES (653,'43','Hello Ll','info','0','2026-08-05 15:07:18','DPS123');
INSERT INTO "notifications" VALUES (654,'44','Hello Ll','info','0','2026-08-05 15:07:18','DPS123');
INSERT INTO "notifications" VALUES (655,'45','Hello Ll','info','0','2026-08-05 15:07:18','PERS_2220685710');
INSERT INTO "notifications" VALUES (656,'46','Hello Ll','info','0','2026-08-05 15:07:18','PERS_2220723439');
INSERT INTO "notifications" VALUES (657,'47','Hello Ll','info','0','2026-08-05 15:07:18','PERS_2221315654');
INSERT INTO "notifications" VALUES (658,'48','Hello Ll','info','0','2026-08-05 15:07:18','2321');
INSERT INTO "notifications" VALUES (659,'49','Hello Ll','info','0','2026-08-05 15:07:18','2321');
INSERT INTO "notifications" VALUES (660,'50','Hello Ll','info','0','2026-08-05 15:07:18','ABC');
INSERT INTO "notifications" VALUES (661,'51','Hello Ll','info','0','2026-08-05 15:07:18','ABC');
INSERT INTO "notifications" VALUES (662,'52','Hello Ll','info','0','2026-08-05 15:07:18','PERS_1111');
INSERT INTO "notifications" VALUES (663,'53','Hello Ll','info','0','2026-08-05 15:07:18','SAS');
INSERT INTO "notifications" VALUES (664,'55','Hello Ll','info','0','2026-08-05 15:07:18','123');
INSERT INTO "notifications" VALUES (665,'56','Hello Ll','info','0','2026-08-05 15:07:18','123');
INSERT INTO "notifications" VALUES (666,'57','Hello Ll','info','1','2026-08-05 15:07:18','4343');
INSERT INTO "notifications" VALUES (667,'9999','Hello Ll','info','0','2026-08-05 15:07:18','00000');
INSERT INTO "notifications" VALUES (668,'9998','Hello Ll','info','0','2026-08-05 15:07:18','00000');
INSERT INTO "notifications" VALUES (669,'10','Hello','info','0','2026-08-05 15:09:09','00000');
INSERT INTO "notifications" VALUES (670,'11','Hello','info','0','2026-08-05 15:09:09','SCH8912');
INSERT INTO "notifications" VALUES (671,'12','Hello','info','0','2026-08-05 15:09:09','DPSGZB');
INSERT INTO "notifications" VALUES (672,'13','Hello','info','0','2026-08-05 15:09:09','dps123');
INSERT INTO "notifications" VALUES (673,'14','Hello','info','0','2026-08-05 15:09:09','dps123');
INSERT INTO "notifications" VALUES (674,'17','Hello','info','0','2026-08-05 15:09:09','DPS123');
INSERT INTO "notifications" VALUES (675,'18','Hello','info','1','2026-08-05 15:09:09','GLOBAL');
INSERT INTO "notifications" VALUES (676,'19','Hello','info','0','2026-08-05 15:09:09','ORG33184');
INSERT INTO "notifications" VALUES (677,'20','Hello','info','0','2026-08-05 15:09:09','SCH8259');
INSERT INTO "notifications" VALUES (678,'21','Hello','info','0','2026-08-05 15:09:09','codex');
INSERT INTO "notifications" VALUES (679,'22','Hello','info','0','2026-08-05 15:09:09','12345678');
INSERT INTO "notifications" VALUES (680,'23','Hello','info','1','2026-08-05 15:09:09','AUTOTEST');
INSERT INTO "notifications" VALUES (681,'24','Hello','info','1','2026-08-05 15:09:09','AUTOTEST');
INSERT INTO "notifications" VALUES (682,'25','Hello','info','1','2026-08-05 15:09:09','AUTOTEST');
INSERT INTO "notifications" VALUES (683,'26','Hello','info','1','2026-08-05 15:09:09','GLOBAL');
INSERT INTO "notifications" VALUES (684,'27','Hello','info','0','2026-08-05 15:09:09','SCH8259');
INSERT INTO "notifications" VALUES (685,'28','Hello','info','0','2026-08-05 15:09:09','PERS_1686430576');
INSERT INTO "notifications" VALUES (686,'29','Hello','info','0','2026-08-05 15:09:09','PERS_1686469424');
INSERT INTO "notifications" VALUES (687,'30','Hello','info','0','2026-08-05 15:09:09','PERS_1687169676');
INSERT INTO "notifications" VALUES (688,'31','Hello','info','0','2026-08-05 15:09:09','PERS_1010');
INSERT INTO "notifications" VALUES (689,'32','Hello','info','0','2026-08-05 15:09:09','PERS_1687915531');
INSERT INTO "notifications" VALUES (690,'33','Hello','info','0','2026-08-05 15:09:09','PERS_1688425985');
INSERT INTO "notifications" VALUES (691,'34','Hello','info','0','2026-08-05 15:09:09','PERS_1698080521');
INSERT INTO "notifications" VALUES (692,'35','Hello','info','0','2026-08-05 15:09:09','PERS_1698635237');
INSERT INTO "notifications" VALUES (693,'36','Hello','info','0','2026-08-05 15:09:09','PERS_1698664310');
INSERT INTO "notifications" VALUES (694,'37','Hello','info','0','2026-08-05 15:09:09','PERS_1698985699');
INSERT INTO "notifications" VALUES (695,'38','Hello','info','0','2026-08-05 15:09:09','PERS_1699721478');
INSERT INTO "notifications" VALUES (696,'39','Hello','info','1','2026-08-05 15:09:09','GLOBAL');
INSERT INTO "notifications" VALUES (697,'40','Hello','info','0','2026-08-05 15:09:09','DPS123');
INSERT INTO "notifications" VALUES (698,'41','Hello','info','0','2026-08-05 15:09:09','DPS123');
INSERT INTO "notifications" VALUES (699,'42','Hello','info','0','2026-08-05 15:09:09','ORG67207');
INSERT INTO "notifications" VALUES (700,'43','Hello','info','0','2026-08-05 15:09:09','DPS123');
INSERT INTO "notifications" VALUES (701,'44','Hello','info','0','2026-08-05 15:09:09','DPS123');
INSERT INTO "notifications" VALUES (702,'45','Hello','info','0','2026-08-05 15:09:09','PERS_2220685710');
INSERT INTO "notifications" VALUES (703,'46','Hello','info','0','2026-08-05 15:09:09','PERS_2220723439');
INSERT INTO "notifications" VALUES (704,'47','Hello','info','0','2026-08-05 15:09:09','PERS_2221315654');
INSERT INTO "notifications" VALUES (705,'48','Hello','info','0','2026-08-05 15:09:09','2321');
INSERT INTO "notifications" VALUES (706,'49','Hello','info','0','2026-08-05 15:09:09','2321');
INSERT INTO "notifications" VALUES (707,'50','Hello','info','0','2026-08-05 15:09:09','ABC');
INSERT INTO "notifications" VALUES (708,'51','Hello','info','0','2026-08-05 15:09:09','ABC');
INSERT INTO "notifications" VALUES (709,'52','Hello','info','0','2026-08-05 15:09:09','PERS_1111');
INSERT INTO "notifications" VALUES (710,'53','Hello','info','0','2026-08-05 15:09:09','SAS');
INSERT INTO "notifications" VALUES (711,'55','Hello','info','0','2026-08-05 15:09:09','123');
INSERT INTO "notifications" VALUES (712,'56','Hello','info','0','2026-08-05 15:09:09','123');
INSERT INTO "notifications" VALUES (713,'57','Hello','info','1','2026-08-05 15:09:09','4343');
INSERT INTO "notifications" VALUES (714,'9999','Hello','info','0','2026-08-05 15:09:09','00000');
INSERT INTO "notifications" VALUES (715,'9998','Hello','info','0','2026-08-05 15:09:09','00000');
INSERT INTO "notifications" VALUES (716,'10','Hello','info','0','2026-08-05 15:09:11','00000');
INSERT INTO "notifications" VALUES (717,'11','Hello','info','0','2026-08-05 15:09:11','SCH8912');
INSERT INTO "notifications" VALUES (718,'12','Hello','info','0','2026-08-05 15:09:11','DPSGZB');
INSERT INTO "notifications" VALUES (719,'13','Hello','info','0','2026-08-05 15:09:11','dps123');
INSERT INTO "notifications" VALUES (720,'14','Hello','info','0','2026-08-05 15:09:11','dps123');
INSERT INTO "notifications" VALUES (721,'17','Hello','info','0','2026-08-05 15:09:11','DPS123');
INSERT INTO "notifications" VALUES (722,'18','Hello','info','1','2026-08-05 15:09:11','GLOBAL');
INSERT INTO "notifications" VALUES (723,'19','Hello','info','0','2026-08-05 15:09:11','ORG33184');
INSERT INTO "notifications" VALUES (724,'20','Hello','info','0','2026-08-05 15:09:11','SCH8259');
INSERT INTO "notifications" VALUES (725,'21','Hello','info','0','2026-08-05 15:09:11','codex');
INSERT INTO "notifications" VALUES (726,'22','Hello','info','0','2026-08-05 15:09:11','12345678');
INSERT INTO "notifications" VALUES (727,'23','Hello','info','1','2026-08-05 15:09:11','AUTOTEST');
INSERT INTO "notifications" VALUES (728,'24','Hello','info','1','2026-08-05 15:09:11','AUTOTEST');
INSERT INTO "notifications" VALUES (729,'25','Hello','info','1','2026-08-05 15:09:11','AUTOTEST');
INSERT INTO "notifications" VALUES (730,'26','Hello','info','1','2026-08-05 15:09:11','GLOBAL');
INSERT INTO "notifications" VALUES (731,'27','Hello','info','0','2026-08-05 15:09:11','SCH8259');
INSERT INTO "notifications" VALUES (732,'28','Hello','info','0','2026-08-05 15:09:11','PERS_1686430576');
INSERT INTO "notifications" VALUES (733,'29','Hello','info','0','2026-08-05 15:09:11','PERS_1686469424');
INSERT INTO "notifications" VALUES (734,'30','Hello','info','0','2026-08-05 15:09:11','PERS_1687169676');
INSERT INTO "notifications" VALUES (735,'31','Hello','info','0','2026-08-05 15:09:11','PERS_1010');
INSERT INTO "notifications" VALUES (736,'32','Hello','info','0','2026-08-05 15:09:11','PERS_1687915531');
INSERT INTO "notifications" VALUES (737,'33','Hello','info','0','2026-08-05 15:09:11','PERS_1688425985');
INSERT INTO "notifications" VALUES (738,'34','Hello','info','0','2026-08-05 15:09:11','PERS_1698080521');
INSERT INTO "notifications" VALUES (739,'35','Hello','info','0','2026-08-05 15:09:11','PERS_1698635237');
INSERT INTO "notifications" VALUES (740,'36','Hello','info','0','2026-08-05 15:09:11','PERS_1698664310');
INSERT INTO "notifications" VALUES (741,'37','Hello','info','0','2026-08-05 15:09:11','PERS_1698985699');
INSERT INTO "notifications" VALUES (742,'38','Hello','info','0','2026-08-05 15:09:11','PERS_1699721478');
INSERT INTO "notifications" VALUES (743,'39','Hello','info','1','2026-08-05 15:09:11','GLOBAL');
INSERT INTO "notifications" VALUES (744,'40','Hello','info','0','2026-08-05 15:09:11','DPS123');
INSERT INTO "notifications" VALUES (745,'41','Hello','info','0','2026-08-05 15:09:11','DPS123');
INSERT INTO "notifications" VALUES (746,'42','Hello','info','0','2026-08-05 15:09:11','ORG67207');
INSERT INTO "notifications" VALUES (747,'43','Hello','info','0','2026-08-05 15:09:11','DPS123');
INSERT INTO "notifications" VALUES (748,'44','Hello','info','0','2026-08-05 15:09:11','DPS123');
INSERT INTO "notifications" VALUES (749,'45','Hello','info','0','2026-08-05 15:09:11','PERS_2220685710');
INSERT INTO "notifications" VALUES (750,'46','Hello','info','0','2026-08-05 15:09:11','PERS_2220723439');
INSERT INTO "notifications" VALUES (751,'47','Hello','info','0','2026-08-05 15:09:11','PERS_2221315654');
INSERT INTO "notifications" VALUES (752,'48','Hello','info','0','2026-08-05 15:09:11','2321');
INSERT INTO "notifications" VALUES (753,'49','Hello','info','0','2026-08-05 15:09:11','2321');
INSERT INTO "notifications" VALUES (754,'50','Hello','info','0','2026-08-05 15:09:11','ABC');
INSERT INTO "notifications" VALUES (755,'51','Hello','info','0','2026-08-05 15:09:11','ABC');
INSERT INTO "notifications" VALUES (756,'52','Hello','info','0','2026-08-05 15:09:11','PERS_1111');
INSERT INTO "notifications" VALUES (757,'53','Hello','info','0','2026-08-05 15:09:11','SAS');
INSERT INTO "notifications" VALUES (758,'55','Hello','info','0','2026-08-05 15:09:11','123');
INSERT INTO "notifications" VALUES (759,'56','Hello','info','0','2026-08-05 15:09:11','123');
INSERT INTO "notifications" VALUES (760,'57','Hello','info','1','2026-08-05 15:09:11','4343');
INSERT INTO "notifications" VALUES (761,'9999','Hello','info','0','2026-08-05 15:09:11','00000');
INSERT INTO "notifications" VALUES (762,'9998','Hello','info','0','2026-08-05 15:09:11','00000');
INSERT INTO "notifications" VALUES (763,'10','Hello','info','0','2026-08-05 15:10:16','00000');
INSERT INTO "notifications" VALUES (764,'11','Hello','info','0','2026-08-05 15:10:16','SCH8912');
INSERT INTO "notifications" VALUES (765,'12','Hello','info','0','2026-08-05 15:10:16','DPSGZB');
INSERT INTO "notifications" VALUES (766,'13','Hello','info','0','2026-08-05 15:10:16','dps123');
INSERT INTO "notifications" VALUES (767,'14','Hello','info','0','2026-08-05 15:10:16','dps123');
INSERT INTO "notifications" VALUES (768,'17','Hello','info','0','2026-08-05 15:10:16','DPS123');
INSERT INTO "notifications" VALUES (769,'18','Hello','info','1','2026-08-05 15:10:16','GLOBAL');
INSERT INTO "notifications" VALUES (770,'19','Hello','info','0','2026-08-05 15:10:16','ORG33184');
INSERT INTO "notifications" VALUES (771,'20','Hello','info','0','2026-08-05 15:10:16','SCH8259');
INSERT INTO "notifications" VALUES (772,'21','Hello','info','0','2026-08-05 15:10:16','codex');
INSERT INTO "notifications" VALUES (773,'22','Hello','info','0','2026-08-05 15:10:16','12345678');
INSERT INTO "notifications" VALUES (774,'23','Hello','info','1','2026-08-05 15:10:16','AUTOTEST');
INSERT INTO "notifications" VALUES (775,'24','Hello','info','1','2026-08-05 15:10:16','AUTOTEST');
INSERT INTO "notifications" VALUES (776,'25','Hello','info','1','2026-08-05 15:10:16','AUTOTEST');
INSERT INTO "notifications" VALUES (777,'26','Hello','info','1','2026-08-05 15:10:16','GLOBAL');
INSERT INTO "notifications" VALUES (778,'27','Hello','info','0','2026-08-05 15:10:16','SCH8259');
INSERT INTO "notifications" VALUES (779,'28','Hello','info','0','2026-08-05 15:10:16','PERS_1686430576');
INSERT INTO "notifications" VALUES (780,'29','Hello','info','0','2026-08-05 15:10:16','PERS_1686469424');
INSERT INTO "notifications" VALUES (781,'30','Hello','info','0','2026-08-05 15:10:16','PERS_1687169676');
INSERT INTO "notifications" VALUES (782,'31','Hello','info','0','2026-08-05 15:10:16','PERS_1010');
INSERT INTO "notifications" VALUES (783,'32','Hello','info','0','2026-08-05 15:10:16','PERS_1687915531');
INSERT INTO "notifications" VALUES (784,'33','Hello','info','0','2026-08-05 15:10:16','PERS_1688425985');
INSERT INTO "notifications" VALUES (785,'34','Hello','info','0','2026-08-05 15:10:16','PERS_1698080521');
INSERT INTO "notifications" VALUES (786,'35','Hello','info','0','2026-08-05 15:10:16','PERS_1698635237');
INSERT INTO "notifications" VALUES (787,'36','Hello','info','0','2026-08-05 15:10:16','PERS_1698664310');
INSERT INTO "notifications" VALUES (788,'37','Hello','info','0','2026-08-05 15:10:16','PERS_1698985699');
INSERT INTO "notifications" VALUES (789,'38','Hello','info','0','2026-08-05 15:10:16','PERS_1699721478');
INSERT INTO "notifications" VALUES (790,'39','Hello','info','1','2026-08-05 15:10:16','GLOBAL');
INSERT INTO "notifications" VALUES (791,'40','Hello','info','0','2026-08-05 15:10:16','DPS123');
INSERT INTO "notifications" VALUES (792,'41','Hello','info','0','2026-08-05 15:10:16','DPS123');
INSERT INTO "notifications" VALUES (793,'42','Hello','info','0','2026-08-05 15:10:16','ORG67207');
INSERT INTO "notifications" VALUES (794,'43','Hello','info','0','2026-08-05 15:10:16','DPS123');
INSERT INTO "notifications" VALUES (795,'44','Hello','info','0','2026-08-05 15:10:16','DPS123');
INSERT INTO "notifications" VALUES (796,'45','Hello','info','0','2026-08-05 15:10:16','PERS_2220685710');
INSERT INTO "notifications" VALUES (797,'46','Hello','info','0','2026-08-05 15:10:16','PERS_2220723439');
INSERT INTO "notifications" VALUES (798,'47','Hello','info','0','2026-08-05 15:10:16','PERS_2221315654');
INSERT INTO "notifications" VALUES (799,'48','Hello','info','0','2026-08-05 15:10:16','2321');
INSERT INTO "notifications" VALUES (800,'49','Hello','info','0','2026-08-05 15:10:16','2321');
INSERT INTO "notifications" VALUES (801,'50','Hello','info','0','2026-08-05 15:10:16','ABC');
INSERT INTO "notifications" VALUES (802,'51','Hello','info','0','2026-08-05 15:10:16','ABC');
INSERT INTO "notifications" VALUES (803,'52','Hello','info','0','2026-08-05 15:10:16','PERS_1111');
INSERT INTO "notifications" VALUES (804,'53','Hello','info','0','2026-08-05 15:10:16','SAS');
INSERT INTO "notifications" VALUES (805,'55','Hello','info','0','2026-08-05 15:10:16','123');
INSERT INTO "notifications" VALUES (806,'56','Hello','info','0','2026-08-05 15:10:16','123');
INSERT INTO "notifications" VALUES (807,'57','Hello','info','1','2026-08-05 15:10:16','4343');
INSERT INTO "notifications" VALUES (808,'9999','Hello','info','0','2026-08-05 15:10:16','00000');
INSERT INTO "notifications" VALUES (809,'9998','Hello','info','0','2026-08-05 15:10:16','00000');
INSERT INTO "notifications" VALUES (810,'10','Hello','info','0','2026-08-05 15:10:17','00000');
INSERT INTO "notifications" VALUES (811,'11','Hello','info','0','2026-08-05 15:10:17','SCH8912');
INSERT INTO "notifications" VALUES (812,'12','Hello','info','0','2026-08-05 15:10:17','DPSGZB');
INSERT INTO "notifications" VALUES (813,'13','Hello','info','0','2026-08-05 15:10:17','dps123');
INSERT INTO "notifications" VALUES (814,'14','Hello','info','0','2026-08-05 15:10:17','dps123');
INSERT INTO "notifications" VALUES (815,'17','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (816,'18','Hello','info','1','2026-08-05 15:10:17','GLOBAL');
INSERT INTO "notifications" VALUES (817,'19','Hello','info','0','2026-08-05 15:10:17','ORG33184');
INSERT INTO "notifications" VALUES (818,'20','Hello','info','0','2026-08-05 15:10:17','SCH8259');
INSERT INTO "notifications" VALUES (819,'21','Hello','info','0','2026-08-05 15:10:17','codex');
INSERT INTO "notifications" VALUES (820,'22','Hello','info','0','2026-08-05 15:10:17','12345678');
INSERT INTO "notifications" VALUES (821,'23','Hello','info','1','2026-08-05 15:10:17','AUTOTEST');
INSERT INTO "notifications" VALUES (822,'24','Hello','info','1','2026-08-05 15:10:17','AUTOTEST');
INSERT INTO "notifications" VALUES (823,'25','Hello','info','1','2026-08-05 15:10:17','AUTOTEST');
INSERT INTO "notifications" VALUES (824,'26','Hello','info','1','2026-08-05 15:10:17','GLOBAL');
INSERT INTO "notifications" VALUES (825,'27','Hello','info','0','2026-08-05 15:10:17','SCH8259');
INSERT INTO "notifications" VALUES (826,'28','Hello','info','0','2026-08-05 15:10:17','PERS_1686430576');
INSERT INTO "notifications" VALUES (827,'29','Hello','info','0','2026-08-05 15:10:17','PERS_1686469424');
INSERT INTO "notifications" VALUES (828,'30','Hello','info','0','2026-08-05 15:10:17','PERS_1687169676');
INSERT INTO "notifications" VALUES (829,'31','Hello','info','0','2026-08-05 15:10:17','PERS_1010');
INSERT INTO "notifications" VALUES (830,'32','Hello','info','0','2026-08-05 15:10:17','PERS_1687915531');
INSERT INTO "notifications" VALUES (831,'33','Hello','info','0','2026-08-05 15:10:17','PERS_1688425985');
INSERT INTO "notifications" VALUES (832,'34','Hello','info','0','2026-08-05 15:10:17','PERS_1698080521');
INSERT INTO "notifications" VALUES (833,'35','Hello','info','0','2026-08-05 15:10:17','PERS_1698635237');
INSERT INTO "notifications" VALUES (834,'36','Hello','info','0','2026-08-05 15:10:17','PERS_1698664310');
INSERT INTO "notifications" VALUES (835,'37','Hello','info','0','2026-08-05 15:10:17','PERS_1698985699');
INSERT INTO "notifications" VALUES (836,'38','Hello','info','0','2026-08-05 15:10:17','PERS_1699721478');
INSERT INTO "notifications" VALUES (837,'39','Hello','info','1','2026-08-05 15:10:17','GLOBAL');
INSERT INTO "notifications" VALUES (838,'40','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (839,'41','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (840,'42','Hello','info','0','2026-08-05 15:10:17','ORG67207');
INSERT INTO "notifications" VALUES (841,'43','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (842,'44','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (843,'45','Hello','info','0','2026-08-05 15:10:17','PERS_2220685710');
INSERT INTO "notifications" VALUES (844,'46','Hello','info','0','2026-08-05 15:10:17','PERS_2220723439');
INSERT INTO "notifications" VALUES (845,'47','Hello','info','0','2026-08-05 15:10:17','PERS_2221315654');
INSERT INTO "notifications" VALUES (846,'48','Hello','info','0','2026-08-05 15:10:17','2321');
INSERT INTO "notifications" VALUES (847,'49','Hello','info','0','2026-08-05 15:10:17','2321');
INSERT INTO "notifications" VALUES (848,'50','Hello','info','0','2026-08-05 15:10:17','ABC');
INSERT INTO "notifications" VALUES (849,'51','Hello','info','0','2026-08-05 15:10:17','ABC');
INSERT INTO "notifications" VALUES (850,'52','Hello','info','0','2026-08-05 15:10:17','PERS_1111');
INSERT INTO "notifications" VALUES (851,'53','Hello','info','0','2026-08-05 15:10:17','SAS');
INSERT INTO "notifications" VALUES (852,'55','Hello','info','0','2026-08-05 15:10:17','123');
INSERT INTO "notifications" VALUES (853,'56','Hello','info','0','2026-08-05 15:10:17','123');
INSERT INTO "notifications" VALUES (854,'57','Hello','info','1','2026-08-05 15:10:17','4343');
INSERT INTO "notifications" VALUES (855,'9999','Hello','info','0','2026-08-05 15:10:17','00000');
INSERT INTO "notifications" VALUES (856,'9998','Hello','info','0','2026-08-05 15:10:17','00000');
INSERT INTO "notifications" VALUES (857,'10','Hello','info','0','2026-08-05 15:10:17','00000');
INSERT INTO "notifications" VALUES (858,'11','Hello','info','0','2026-08-05 15:10:17','SCH8912');
INSERT INTO "notifications" VALUES (859,'12','Hello','info','0','2026-08-05 15:10:17','DPSGZB');
INSERT INTO "notifications" VALUES (860,'13','Hello','info','0','2026-08-05 15:10:17','dps123');
INSERT INTO "notifications" VALUES (861,'14','Hello','info','0','2026-08-05 15:10:17','dps123');
INSERT INTO "notifications" VALUES (862,'17','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (863,'18','Hello','info','1','2026-08-05 15:10:17','GLOBAL');
INSERT INTO "notifications" VALUES (864,'19','Hello','info','0','2026-08-05 15:10:17','ORG33184');
INSERT INTO "notifications" VALUES (865,'20','Hello','info','0','2026-08-05 15:10:17','SCH8259');
INSERT INTO "notifications" VALUES (866,'21','Hello','info','0','2026-08-05 15:10:17','codex');
INSERT INTO "notifications" VALUES (867,'22','Hello','info','0','2026-08-05 15:10:17','12345678');
INSERT INTO "notifications" VALUES (868,'23','Hello','info','1','2026-08-05 15:10:17','AUTOTEST');
INSERT INTO "notifications" VALUES (869,'24','Hello','info','1','2026-08-05 15:10:17','AUTOTEST');
INSERT INTO "notifications" VALUES (870,'25','Hello','info','1','2026-08-05 15:10:17','AUTOTEST');
INSERT INTO "notifications" VALUES (871,'26','Hello','info','1','2026-08-05 15:10:17','GLOBAL');
INSERT INTO "notifications" VALUES (872,'27','Hello','info','0','2026-08-05 15:10:17','SCH8259');
INSERT INTO "notifications" VALUES (873,'28','Hello','info','0','2026-08-05 15:10:17','PERS_1686430576');
INSERT INTO "notifications" VALUES (874,'29','Hello','info','0','2026-08-05 15:10:17','PERS_1686469424');
INSERT INTO "notifications" VALUES (875,'30','Hello','info','0','2026-08-05 15:10:17','PERS_1687169676');
INSERT INTO "notifications" VALUES (876,'31','Hello','info','0','2026-08-05 15:10:17','PERS_1010');
INSERT INTO "notifications" VALUES (877,'32','Hello','info','0','2026-08-05 15:10:17','PERS_1687915531');
INSERT INTO "notifications" VALUES (878,'33','Hello','info','0','2026-08-05 15:10:17','PERS_1688425985');
INSERT INTO "notifications" VALUES (879,'34','Hello','info','0','2026-08-05 15:10:17','PERS_1698080521');
INSERT INTO "notifications" VALUES (880,'35','Hello','info','0','2026-08-05 15:10:17','PERS_1698635237');
INSERT INTO "notifications" VALUES (881,'36','Hello','info','0','2026-08-05 15:10:17','PERS_1698664310');
INSERT INTO "notifications" VALUES (882,'37','Hello','info','0','2026-08-05 15:10:17','PERS_1698985699');
INSERT INTO "notifications" VALUES (883,'38','Hello','info','0','2026-08-05 15:10:17','PERS_1699721478');
INSERT INTO "notifications" VALUES (884,'39','Hello','info','1','2026-08-05 15:10:17','GLOBAL');
INSERT INTO "notifications" VALUES (885,'40','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (886,'41','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (887,'42','Hello','info','0','2026-08-05 15:10:17','ORG67207');
INSERT INTO "notifications" VALUES (888,'43','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (889,'44','Hello','info','0','2026-08-05 15:10:17','DPS123');
INSERT INTO "notifications" VALUES (890,'45','Hello','info','0','2026-08-05 15:10:17','PERS_2220685710');
INSERT INTO "notifications" VALUES (891,'46','Hello','info','0','2026-08-05 15:10:17','PERS_2220723439');
INSERT INTO "notifications" VALUES (892,'47','Hello','info','0','2026-08-05 15:10:17','PERS_2221315654');
INSERT INTO "notifications" VALUES (893,'48','Hello','info','0','2026-08-05 15:10:17','2321');
INSERT INTO "notifications" VALUES (894,'49','Hello','info','0','2026-08-05 15:10:17','2321');
INSERT INTO "notifications" VALUES (895,'50','Hello','info','0','2026-08-05 15:10:17','ABC');
INSERT INTO "notifications" VALUES (896,'51','Hello','info','0','2026-08-05 15:10:17','ABC');
INSERT INTO "notifications" VALUES (897,'52','Hello','info','0','2026-08-05 15:10:17','PERS_1111');
INSERT INTO "notifications" VALUES (898,'53','Hello','info','0','2026-08-05 15:10:17','SAS');
INSERT INTO "notifications" VALUES (899,'55','Hello','info','0','2026-08-05 15:10:17','123');
INSERT INTO "notifications" VALUES (900,'56','Hello','info','0','2026-08-05 15:10:17','123');
INSERT INTO "notifications" VALUES (901,'57','Hello','info','1','2026-08-05 15:10:17','4343');
INSERT INTO "notifications" VALUES (902,'9999','Hello','info','0','2026-08-05 15:10:17','00000');
INSERT INTO "notifications" VALUES (903,'9998','Hello','info','0','2026-08-05 15:10:17','00000');
INSERT INTO "notifications" VALUES (904,'11','Hello','info','0','2026-08-05 15:12:10','SCH8912');
INSERT INTO "notifications" VALUES (905,'11','Hello','info','0','2026-08-05 15:12:11','SCH8912');
INSERT INTO "notifications" VALUES (906,'11','Hello','info','0','2026-08-05 15:12:22','SCH8912');
INSERT INTO "notifications" VALUES (907,'10','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (908,'11','Hello','info','0','2026-08-05 15:12:25','SCH8912');
INSERT INTO "notifications" VALUES (909,'12','Hello','info','0','2026-08-05 15:12:25','DPSGZB');
INSERT INTO "notifications" VALUES (910,'13','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (911,'14','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (912,'17','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (913,'18','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (914,'19','Hello','info','0','2026-08-05 15:12:25','ORG33184');
INSERT INTO "notifications" VALUES (915,'20','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (916,'21','Hello','info','0','2026-08-05 15:12:25','codex');
INSERT INTO "notifications" VALUES (917,'22','Hello','info','0','2026-08-05 15:12:25','12345678');
INSERT INTO "notifications" VALUES (918,'23','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (919,'24','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (920,'25','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (921,'26','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (922,'27','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (923,'28','Hello','info','0','2026-08-05 15:12:25','PERS_1686430576');
INSERT INTO "notifications" VALUES (924,'29','Hello','info','0','2026-08-05 15:12:25','PERS_1686469424');
INSERT INTO "notifications" VALUES (925,'30','Hello','info','0','2026-08-05 15:12:25','PERS_1687169676');
INSERT INTO "notifications" VALUES (926,'31','Hello','info','0','2026-08-05 15:12:25','PERS_1010');
INSERT INTO "notifications" VALUES (927,'32','Hello','info','0','2026-08-05 15:12:25','PERS_1687915531');
INSERT INTO "notifications" VALUES (928,'33','Hello','info','0','2026-08-05 15:12:25','PERS_1688425985');
INSERT INTO "notifications" VALUES (929,'34','Hello','info','0','2026-08-05 15:12:25','PERS_1698080521');
INSERT INTO "notifications" VALUES (930,'35','Hello','info','0','2026-08-05 15:12:25','PERS_1698635237');
INSERT INTO "notifications" VALUES (931,'36','Hello','info','0','2026-08-05 15:12:25','PERS_1698664310');
INSERT INTO "notifications" VALUES (932,'37','Hello','info','0','2026-08-05 15:12:25','PERS_1698985699');
INSERT INTO "notifications" VALUES (933,'38','Hello','info','0','2026-08-05 15:12:25','PERS_1699721478');
INSERT INTO "notifications" VALUES (934,'39','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (935,'40','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (936,'41','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (937,'42','Hello','info','0','2026-08-05 15:12:25','ORG67207');
INSERT INTO "notifications" VALUES (938,'43','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (939,'44','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (940,'45','Hello','info','0','2026-08-05 15:12:25','PERS_2220685710');
INSERT INTO "notifications" VALUES (941,'46','Hello','info','0','2026-08-05 15:12:25','PERS_2220723439');
INSERT INTO "notifications" VALUES (942,'47','Hello','info','0','2026-08-05 15:12:25','PERS_2221315654');
INSERT INTO "notifications" VALUES (943,'48','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (944,'49','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (945,'50','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (946,'51','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (947,'52','Hello','info','0','2026-08-05 15:12:25','PERS_1111');
INSERT INTO "notifications" VALUES (948,'53','Hello','info','0','2026-08-05 15:12:25','SAS');
INSERT INTO "notifications" VALUES (949,'55','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (950,'56','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (951,'57','Hello','info','1','2026-08-05 15:12:25','4343');
INSERT INTO "notifications" VALUES (952,'9999','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (953,'9998','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (954,'10','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (955,'11','Hello','info','0','2026-08-05 15:12:25','SCH8912');
INSERT INTO "notifications" VALUES (956,'12','Hello','info','0','2026-08-05 15:12:25','DPSGZB');
INSERT INTO "notifications" VALUES (957,'13','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (958,'14','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (959,'17','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (960,'18','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (961,'19','Hello','info','0','2026-08-05 15:12:25','ORG33184');
INSERT INTO "notifications" VALUES (962,'20','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (963,'21','Hello','info','0','2026-08-05 15:12:25','codex');
INSERT INTO "notifications" VALUES (964,'22','Hello','info','0','2026-08-05 15:12:25','12345678');
INSERT INTO "notifications" VALUES (965,'23','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (966,'24','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (967,'25','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (968,'26','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (969,'27','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (970,'28','Hello','info','0','2026-08-05 15:12:25','PERS_1686430576');
INSERT INTO "notifications" VALUES (971,'29','Hello','info','0','2026-08-05 15:12:25','PERS_1686469424');
INSERT INTO "notifications" VALUES (972,'30','Hello','info','0','2026-08-05 15:12:25','PERS_1687169676');
INSERT INTO "notifications" VALUES (973,'31','Hello','info','0','2026-08-05 15:12:25','PERS_1010');
INSERT INTO "notifications" VALUES (974,'32','Hello','info','0','2026-08-05 15:12:25','PERS_1687915531');
INSERT INTO "notifications" VALUES (975,'33','Hello','info','0','2026-08-05 15:12:25','PERS_1688425985');
INSERT INTO "notifications" VALUES (976,'34','Hello','info','0','2026-08-05 15:12:25','PERS_1698080521');
INSERT INTO "notifications" VALUES (977,'35','Hello','info','0','2026-08-05 15:12:25','PERS_1698635237');
INSERT INTO "notifications" VALUES (978,'36','Hello','info','0','2026-08-05 15:12:25','PERS_1698664310');
INSERT INTO "notifications" VALUES (979,'37','Hello','info','0','2026-08-05 15:12:25','PERS_1698985699');
INSERT INTO "notifications" VALUES (980,'38','Hello','info','0','2026-08-05 15:12:25','PERS_1699721478');
INSERT INTO "notifications" VALUES (981,'39','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (982,'40','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (983,'41','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (984,'42','Hello','info','0','2026-08-05 15:12:25','ORG67207');
INSERT INTO "notifications" VALUES (985,'43','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (986,'44','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (987,'45','Hello','info','0','2026-08-05 15:12:25','PERS_2220685710');
INSERT INTO "notifications" VALUES (988,'46','Hello','info','0','2026-08-05 15:12:25','PERS_2220723439');
INSERT INTO "notifications" VALUES (989,'47','Hello','info','0','2026-08-05 15:12:25','PERS_2221315654');
INSERT INTO "notifications" VALUES (990,'48','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (991,'49','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (992,'50','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (993,'51','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (994,'52','Hello','info','0','2026-08-05 15:12:25','PERS_1111');
INSERT INTO "notifications" VALUES (995,'53','Hello','info','0','2026-08-05 15:12:25','SAS');
INSERT INTO "notifications" VALUES (996,'55','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (997,'56','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (998,'57','Hello','info','1','2026-08-05 15:12:25','4343');
INSERT INTO "notifications" VALUES (999,'9999','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1000,'9998','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1001,'10','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1002,'11','Hello','info','0','2026-08-05 15:12:25','SCH8912');
INSERT INTO "notifications" VALUES (1003,'12','Hello','info','0','2026-08-05 15:12:25','DPSGZB');
INSERT INTO "notifications" VALUES (1004,'13','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (1005,'14','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (1006,'17','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1007,'18','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (1008,'19','Hello','info','0','2026-08-05 15:12:25','ORG33184');
INSERT INTO "notifications" VALUES (1009,'20','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (1010,'21','Hello','info','0','2026-08-05 15:12:25','codex');
INSERT INTO "notifications" VALUES (1011,'22','Hello','info','0','2026-08-05 15:12:25','12345678');
INSERT INTO "notifications" VALUES (1012,'23','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (1013,'24','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (1014,'25','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (1015,'26','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (1016,'27','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (1017,'28','Hello','info','0','2026-08-05 15:12:25','PERS_1686430576');
INSERT INTO "notifications" VALUES (1018,'29','Hello','info','0','2026-08-05 15:12:25','PERS_1686469424');
INSERT INTO "notifications" VALUES (1019,'30','Hello','info','0','2026-08-05 15:12:25','PERS_1687169676');
INSERT INTO "notifications" VALUES (1020,'31','Hello','info','0','2026-08-05 15:12:25','PERS_1010');
INSERT INTO "notifications" VALUES (1021,'32','Hello','info','0','2026-08-05 15:12:25','PERS_1687915531');
INSERT INTO "notifications" VALUES (1022,'33','Hello','info','0','2026-08-05 15:12:25','PERS_1688425985');
INSERT INTO "notifications" VALUES (1023,'34','Hello','info','0','2026-08-05 15:12:25','PERS_1698080521');
INSERT INTO "notifications" VALUES (1024,'35','Hello','info','0','2026-08-05 15:12:25','PERS_1698635237');
INSERT INTO "notifications" VALUES (1025,'36','Hello','info','0','2026-08-05 15:12:25','PERS_1698664310');
INSERT INTO "notifications" VALUES (1026,'37','Hello','info','0','2026-08-05 15:12:25','PERS_1698985699');
INSERT INTO "notifications" VALUES (1027,'38','Hello','info','0','2026-08-05 15:12:25','PERS_1699721478');
INSERT INTO "notifications" VALUES (1028,'39','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (1029,'40','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1030,'41','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1031,'42','Hello','info','0','2026-08-05 15:12:25','ORG67207');
INSERT INTO "notifications" VALUES (1032,'43','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1033,'44','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1034,'45','Hello','info','0','2026-08-05 15:12:25','PERS_2220685710');
INSERT INTO "notifications" VALUES (1035,'46','Hello','info','0','2026-08-05 15:12:25','PERS_2220723439');
INSERT INTO "notifications" VALUES (1036,'47','Hello','info','0','2026-08-05 15:12:25','PERS_2221315654');
INSERT INTO "notifications" VALUES (1037,'48','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (1038,'49','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (1039,'50','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (1040,'51','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (1041,'52','Hello','info','0','2026-08-05 15:12:25','PERS_1111');
INSERT INTO "notifications" VALUES (1042,'53','Hello','info','0','2026-08-05 15:12:25','SAS');
INSERT INTO "notifications" VALUES (1043,'55','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (1044,'56','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (1045,'57','Hello','info','1','2026-08-05 15:12:25','4343');
INSERT INTO "notifications" VALUES (1046,'9999','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1047,'9998','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1048,'10','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1049,'11','Hello','info','0','2026-08-05 15:12:25','SCH8912');
INSERT INTO "notifications" VALUES (1050,'12','Hello','info','0','2026-08-05 15:12:25','DPSGZB');
INSERT INTO "notifications" VALUES (1051,'13','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (1052,'14','Hello','info','0','2026-08-05 15:12:25','dps123');
INSERT INTO "notifications" VALUES (1053,'17','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1054,'18','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (1055,'19','Hello','info','0','2026-08-05 15:12:25','ORG33184');
INSERT INTO "notifications" VALUES (1056,'20','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (1057,'21','Hello','info','0','2026-08-05 15:12:25','codex');
INSERT INTO "notifications" VALUES (1058,'22','Hello','info','0','2026-08-05 15:12:25','12345678');
INSERT INTO "notifications" VALUES (1059,'23','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (1060,'24','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (1061,'25','Hello','info','1','2026-08-05 15:12:25','AUTOTEST');
INSERT INTO "notifications" VALUES (1062,'26','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (1063,'27','Hello','info','0','2026-08-05 15:12:25','SCH8259');
INSERT INTO "notifications" VALUES (1064,'28','Hello','info','0','2026-08-05 15:12:25','PERS_1686430576');
INSERT INTO "notifications" VALUES (1065,'29','Hello','info','0','2026-08-05 15:12:25','PERS_1686469424');
INSERT INTO "notifications" VALUES (1066,'30','Hello','info','0','2026-08-05 15:12:25','PERS_1687169676');
INSERT INTO "notifications" VALUES (1067,'31','Hello','info','0','2026-08-05 15:12:25','PERS_1010');
INSERT INTO "notifications" VALUES (1068,'32','Hello','info','0','2026-08-05 15:12:25','PERS_1687915531');
INSERT INTO "notifications" VALUES (1069,'33','Hello','info','0','2026-08-05 15:12:25','PERS_1688425985');
INSERT INTO "notifications" VALUES (1070,'34','Hello','info','0','2026-08-05 15:12:25','PERS_1698080521');
INSERT INTO "notifications" VALUES (1071,'35','Hello','info','0','2026-08-05 15:12:25','PERS_1698635237');
INSERT INTO "notifications" VALUES (1072,'36','Hello','info','0','2026-08-05 15:12:25','PERS_1698664310');
INSERT INTO "notifications" VALUES (1073,'37','Hello','info','0','2026-08-05 15:12:25','PERS_1698985699');
INSERT INTO "notifications" VALUES (1074,'38','Hello','info','0','2026-08-05 15:12:25','PERS_1699721478');
INSERT INTO "notifications" VALUES (1075,'39','Hello','info','1','2026-08-05 15:12:25','GLOBAL');
INSERT INTO "notifications" VALUES (1076,'40','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1077,'41','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1078,'42','Hello','info','0','2026-08-05 15:12:25','ORG67207');
INSERT INTO "notifications" VALUES (1079,'43','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1080,'44','Hello','info','0','2026-08-05 15:12:25','DPS123');
INSERT INTO "notifications" VALUES (1081,'45','Hello','info','0','2026-08-05 15:12:25','PERS_2220685710');
INSERT INTO "notifications" VALUES (1082,'46','Hello','info','0','2026-08-05 15:12:25','PERS_2220723439');
INSERT INTO "notifications" VALUES (1083,'47','Hello','info','0','2026-08-05 15:12:25','PERS_2221315654');
INSERT INTO "notifications" VALUES (1084,'48','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (1085,'49','Hello','info','0','2026-08-05 15:12:25','2321');
INSERT INTO "notifications" VALUES (1086,'50','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (1087,'51','Hello','info','0','2026-08-05 15:12:25','ABC');
INSERT INTO "notifications" VALUES (1088,'52','Hello','info','0','2026-08-05 15:12:25','PERS_1111');
INSERT INTO "notifications" VALUES (1089,'53','Hello','info','0','2026-08-05 15:12:25','SAS');
INSERT INTO "notifications" VALUES (1090,'55','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (1091,'56','Hello','info','0','2026-08-05 15:12:25','123');
INSERT INTO "notifications" VALUES (1092,'57','Hello','info','1','2026-08-05 15:12:25','4343');
INSERT INTO "notifications" VALUES (1093,'9999','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1094,'9998','Hello','info','0','2026-08-05 15:12:25','00000');
INSERT INTO "notifications" VALUES (1095,'10','Hello','info','0','2026-08-05 15:12:26','00000');
INSERT INTO "notifications" VALUES (1096,'11','Hello','info','0','2026-08-05 15:12:26','SCH8912');
INSERT INTO "notifications" VALUES (1097,'12','Hello','info','0','2026-08-05 15:12:26','DPSGZB');
INSERT INTO "notifications" VALUES (1098,'13','Hello','info','0','2026-08-05 15:12:26','dps123');
INSERT INTO "notifications" VALUES (1099,'14','Hello','info','0','2026-08-05 15:12:26','dps123');
INSERT INTO "notifications" VALUES (1100,'17','Hello','info','0','2026-08-05 15:12:26','DPS123');
INSERT INTO "notifications" VALUES (1101,'18','Hello','info','1','2026-08-05 15:12:26','GLOBAL');
INSERT INTO "notifications" VALUES (1102,'19','Hello','info','0','2026-08-05 15:12:26','ORG33184');
INSERT INTO "notifications" VALUES (1103,'20','Hello','info','0','2026-08-05 15:12:26','SCH8259');
INSERT INTO "notifications" VALUES (1104,'21','Hello','info','0','2026-08-05 15:12:26','codex');
INSERT INTO "notifications" VALUES (1105,'22','Hello','info','0','2026-08-05 15:12:26','12345678');
INSERT INTO "notifications" VALUES (1106,'23','Hello','info','1','2026-08-05 15:12:26','AUTOTEST');
INSERT INTO "notifications" VALUES (1107,'24','Hello','info','1','2026-08-05 15:12:26','AUTOTEST');
INSERT INTO "notifications" VALUES (1108,'25','Hello','info','1','2026-08-05 15:12:26','AUTOTEST');
INSERT INTO "notifications" VALUES (1109,'26','Hello','info','1','2026-08-05 15:12:26','GLOBAL');
INSERT INTO "notifications" VALUES (1110,'27','Hello','info','0','2026-08-05 15:12:26','SCH8259');
INSERT INTO "notifications" VALUES (1111,'28','Hello','info','0','2026-08-05 15:12:26','PERS_1686430576');
INSERT INTO "notifications" VALUES (1112,'29','Hello','info','0','2026-08-05 15:12:26','PERS_1686469424');
INSERT INTO "notifications" VALUES (1113,'30','Hello','info','0','2026-08-05 15:12:26','PERS_1687169676');
INSERT INTO "notifications" VALUES (1114,'31','Hello','info','0','2026-08-05 15:12:26','PERS_1010');
INSERT INTO "notifications" VALUES (1115,'32','Hello','info','0','2026-08-05 15:12:26','PERS_1687915531');
INSERT INTO "notifications" VALUES (1116,'33','Hello','info','0','2026-08-05 15:12:26','PERS_1688425985');
INSERT INTO "notifications" VALUES (1117,'34','Hello','info','0','2026-08-05 15:12:26','PERS_1698080521');
INSERT INTO "notifications" VALUES (1118,'35','Hello','info','0','2026-08-05 15:12:26','PERS_1698635237');
INSERT INTO "notifications" VALUES (1119,'36','Hello','info','0','2026-08-05 15:12:26','PERS_1698664310');
INSERT INTO "notifications" VALUES (1120,'37','Hello','info','0','2026-08-05 15:12:26','PERS_1698985699');
INSERT INTO "notifications" VALUES (1121,'38','Hello','info','0','2026-08-05 15:12:26','PERS_1699721478');
INSERT INTO "notifications" VALUES (1122,'39','Hello','info','1','2026-08-05 15:12:26','GLOBAL');
INSERT INTO "notifications" VALUES (1123,'40','Hello','info','0','2026-08-05 15:12:26','DPS123');
INSERT INTO "notifications" VALUES (1124,'41','Hello','info','0','2026-08-05 15:12:26','DPS123');
INSERT INTO "notifications" VALUES (1125,'42','Hello','info','0','2026-08-05 15:12:26','ORG67207');
INSERT INTO "notifications" VALUES (1126,'43','Hello','info','0','2026-08-05 15:12:26','DPS123');
INSERT INTO "notifications" VALUES (1127,'44','Hello','info','0','2026-08-05 15:12:26','DPS123');
INSERT INTO "notifications" VALUES (1128,'45','Hello','info','0','2026-08-05 15:12:26','PERS_2220685710');
INSERT INTO "notifications" VALUES (1129,'46','Hello','info','0','2026-08-05 15:12:26','PERS_2220723439');
INSERT INTO "notifications" VALUES (1130,'47','Hello','info','0','2026-08-05 15:12:26','PERS_2221315654');
INSERT INTO "notifications" VALUES (1131,'48','Hello','info','0','2026-08-05 15:12:26','2321');
INSERT INTO "notifications" VALUES (1132,'49','Hello','info','0','2026-08-05 15:12:26','2321');
INSERT INTO "notifications" VALUES (1133,'50','Hello','info','0','2026-08-05 15:12:26','ABC');
INSERT INTO "notifications" VALUES (1134,'51','Hello','info','0','2026-08-05 15:12:26','ABC');
INSERT INTO "notifications" VALUES (1135,'52','Hello','info','0','2026-08-05 15:12:26','PERS_1111');
INSERT INTO "notifications" VALUES (1136,'53','Hello','info','0','2026-08-05 15:12:26','SAS');
INSERT INTO "notifications" VALUES (1137,'55','Hello','info','0','2026-08-05 15:12:26','123');
INSERT INTO "notifications" VALUES (1138,'56','Hello','info','0','2026-08-05 15:12:26','123');
INSERT INTO "notifications" VALUES (1139,'57','Hello','info','1','2026-08-05 15:12:26','4343');
INSERT INTO "notifications" VALUES (1140,'9999','Hello','info','0','2026-08-05 15:12:26','00000');
INSERT INTO "notifications" VALUES (1141,'9998','Hello','info','0','2026-08-05 15:12:26','00000');
INSERT INTO "notifications" VALUES (1142,'10','H','info','0','2026-08-05 15:25:36','00000');
INSERT INTO "notifications" VALUES (1143,'11','H','info','0','2026-08-05 15:25:36','SCH8912');
INSERT INTO "notifications" VALUES (1144,'12','H','info','0','2026-08-05 15:25:36','DPSGZB');
INSERT INTO "notifications" VALUES (1145,'13','H','info','0','2026-08-05 15:25:36','dps123');
INSERT INTO "notifications" VALUES (1146,'14','H','info','0','2026-08-05 15:25:36','dps123');
INSERT INTO "notifications" VALUES (1147,'17','H','info','0','2026-08-05 15:25:36','DPS123');
INSERT INTO "notifications" VALUES (1148,'18','H','info','1','2026-08-05 15:25:36','GLOBAL');
INSERT INTO "notifications" VALUES (1149,'19','H','info','0','2026-08-05 15:25:36','ORG33184');
INSERT INTO "notifications" VALUES (1150,'20','H','info','0','2026-08-05 15:25:36','SCH8259');
INSERT INTO "notifications" VALUES (1151,'21','H','info','0','2026-08-05 15:25:36','codex');
INSERT INTO "notifications" VALUES (1152,'22','H','info','0','2026-08-05 15:25:36','12345678');
INSERT INTO "notifications" VALUES (1153,'23','H','info','1','2026-08-05 15:25:36','AUTOTEST');
INSERT INTO "notifications" VALUES (1154,'24','H','info','1','2026-08-05 15:25:36','AUTOTEST');
INSERT INTO "notifications" VALUES (1155,'25','H','info','1','2026-08-05 15:25:36','AUTOTEST');
INSERT INTO "notifications" VALUES (1156,'26','H','info','1','2026-08-05 15:25:36','GLOBAL');
INSERT INTO "notifications" VALUES (1157,'27','H','info','0','2026-08-05 15:25:36','SCH8259');
INSERT INTO "notifications" VALUES (1158,'28','H','info','0','2026-08-05 15:25:36','PERS_1686430576');
INSERT INTO "notifications" VALUES (1159,'29','H','info','0','2026-08-05 15:25:36','PERS_1686469424');
INSERT INTO "notifications" VALUES (1160,'30','H','info','0','2026-08-05 15:25:36','PERS_1687169676');
INSERT INTO "notifications" VALUES (1161,'31','H','info','0','2026-08-05 15:25:36','PERS_1010');
INSERT INTO "notifications" VALUES (1162,'32','H','info','0','2026-08-05 15:25:36','PERS_1687915531');
INSERT INTO "notifications" VALUES (1163,'33','H','info','0','2026-08-05 15:25:36','PERS_1688425985');
INSERT INTO "notifications" VALUES (1164,'34','H','info','0','2026-08-05 15:25:36','PERS_1698080521');
INSERT INTO "notifications" VALUES (1165,'35','H','info','0','2026-08-05 15:25:36','PERS_1698635237');
INSERT INTO "notifications" VALUES (1166,'36','H','info','0','2026-08-05 15:25:36','PERS_1698664310');
INSERT INTO "notifications" VALUES (1167,'37','H','info','0','2026-08-05 15:25:36','PERS_1698985699');
INSERT INTO "notifications" VALUES (1168,'38','H','info','0','2026-08-05 15:25:36','PERS_1699721478');
INSERT INTO "notifications" VALUES (1169,'39','H','info','1','2026-08-05 15:25:36','GLOBAL');
INSERT INTO "notifications" VALUES (1170,'40','H','info','0','2026-08-05 15:25:36','DPS123');
INSERT INTO "notifications" VALUES (1171,'41','H','info','0','2026-08-05 15:25:36','DPS123');
INSERT INTO "notifications" VALUES (1172,'42','H','info','0','2026-08-05 15:25:36','ORG67207');
INSERT INTO "notifications" VALUES (1173,'43','H','info','0','2026-08-05 15:25:36','DPS123');
INSERT INTO "notifications" VALUES (1174,'44','H','info','0','2026-08-05 15:25:36','DPS123');
INSERT INTO "notifications" VALUES (1175,'45','H','info','0','2026-08-05 15:25:36','PERS_2220685710');
INSERT INTO "notifications" VALUES (1176,'46','H','info','0','2026-08-05 15:25:36','PERS_2220723439');
INSERT INTO "notifications" VALUES (1177,'47','H','info','0','2026-08-05 15:25:36','PERS_2221315654');
INSERT INTO "notifications" VALUES (1178,'48','H','info','0','2026-08-05 15:25:36','2321');
INSERT INTO "notifications" VALUES (1179,'49','H','info','0','2026-08-05 15:25:36','2321');
INSERT INTO "notifications" VALUES (1180,'50','H','info','0','2026-08-05 15:25:36','ABC');
INSERT INTO "notifications" VALUES (1181,'51','H','info','0','2026-08-05 15:25:36','ABC');
INSERT INTO "notifications" VALUES (1182,'52','H','info','0','2026-08-05 15:25:36','PERS_1111');
INSERT INTO "notifications" VALUES (1183,'53','H','info','0','2026-08-05 15:25:36','SAS');
INSERT INTO "notifications" VALUES (1184,'55','H','info','0','2026-08-05 15:25:36','123');
INSERT INTO "notifications" VALUES (1185,'56','H','info','0','2026-08-05 15:25:36','123');
INSERT INTO "notifications" VALUES (1186,'57','H','info','1','2026-08-05 15:25:36','4343');
INSERT INTO "notifications" VALUES (1187,'9999','H','info','0','2026-08-05 15:25:36','00000');
INSERT INTO "notifications" VALUES (1188,'9998','H','info','0','2026-08-05 15:25:36','00000');
INSERT INTO "notifications" VALUES (1189,'10','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1190,'11','H','info','0','2026-08-05 15:25:58','SCH8912');
INSERT INTO "notifications" VALUES (1191,'12','H','info','0','2026-08-05 15:25:58','DPSGZB');
INSERT INTO "notifications" VALUES (1192,'13','H','info','0','2026-08-05 15:25:58','dps123');
INSERT INTO "notifications" VALUES (1193,'14','H','info','0','2026-08-05 15:25:58','dps123');
INSERT INTO "notifications" VALUES (1194,'17','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1195,'18','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1196,'19','H','info','0','2026-08-05 15:25:58','ORG33184');
INSERT INTO "notifications" VALUES (1197,'20','H','info','0','2026-08-05 15:25:58','SCH8259');
INSERT INTO "notifications" VALUES (1198,'21','H','info','0','2026-08-05 15:25:58','codex');
INSERT INTO "notifications" VALUES (1199,'22','H','info','0','2026-08-05 15:25:58','12345678');
INSERT INTO "notifications" VALUES (1200,'23','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1201,'24','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1202,'25','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1203,'26','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1204,'27','H','info','0','2026-08-05 15:25:58','SCH8259');
INSERT INTO "notifications" VALUES (1205,'28','H','info','0','2026-08-05 15:25:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (1206,'29','H','info','0','2026-08-05 15:25:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (1207,'30','H','info','0','2026-08-05 15:25:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (1208,'31','H','info','0','2026-08-05 15:25:58','PERS_1010');
INSERT INTO "notifications" VALUES (1209,'32','H','info','0','2026-08-05 15:25:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (1210,'33','H','info','0','2026-08-05 15:25:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (1211,'34','H','info','0','2026-08-05 15:25:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (1212,'35','H','info','0','2026-08-05 15:25:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (1213,'36','H','info','0','2026-08-05 15:25:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (1214,'37','H','info','0','2026-08-05 15:25:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (1215,'38','H','info','0','2026-08-05 15:25:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (1216,'39','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1217,'40','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1218,'41','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1219,'42','H','info','0','2026-08-05 15:25:58','ORG67207');
INSERT INTO "notifications" VALUES (1220,'43','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1221,'44','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1222,'45','H','info','0','2026-08-05 15:25:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (1223,'46','H','info','0','2026-08-05 15:25:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (1224,'47','H','info','0','2026-08-05 15:25:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (1225,'48','H','info','0','2026-08-05 15:25:58','2321');
INSERT INTO "notifications" VALUES (1226,'49','H','info','0','2026-08-05 15:25:58','2321');
INSERT INTO "notifications" VALUES (1227,'50','H','info','0','2026-08-05 15:25:58','ABC');
INSERT INTO "notifications" VALUES (1228,'51','H','info','0','2026-08-05 15:25:58','ABC');
INSERT INTO "notifications" VALUES (1229,'52','H','info','0','2026-08-05 15:25:58','PERS_1111');
INSERT INTO "notifications" VALUES (1230,'53','H','info','0','2026-08-05 15:25:58','SAS');
INSERT INTO "notifications" VALUES (1231,'55','H','info','0','2026-08-05 15:25:58','123');
INSERT INTO "notifications" VALUES (1232,'56','H','info','0','2026-08-05 15:25:58','123');
INSERT INTO "notifications" VALUES (1233,'57','H','info','1','2026-08-05 15:25:58','4343');
INSERT INTO "notifications" VALUES (1234,'9999','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1235,'9998','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1236,'10','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1237,'11','H','info','0','2026-08-05 15:25:58','SCH8912');
INSERT INTO "notifications" VALUES (1238,'12','H','info','0','2026-08-05 15:25:58','DPSGZB');
INSERT INTO "notifications" VALUES (1239,'13','H','info','0','2026-08-05 15:25:58','dps123');
INSERT INTO "notifications" VALUES (1240,'14','H','info','0','2026-08-05 15:25:58','dps123');
INSERT INTO "notifications" VALUES (1241,'17','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1242,'18','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1243,'19','H','info','0','2026-08-05 15:25:58','ORG33184');
INSERT INTO "notifications" VALUES (1244,'20','H','info','0','2026-08-05 15:25:58','SCH8259');
INSERT INTO "notifications" VALUES (1245,'21','H','info','0','2026-08-05 15:25:58','codex');
INSERT INTO "notifications" VALUES (1246,'22','H','info','0','2026-08-05 15:25:58','12345678');
INSERT INTO "notifications" VALUES (1247,'23','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1248,'24','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1249,'25','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1250,'26','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1251,'27','H','info','0','2026-08-05 15:25:58','SCH8259');
INSERT INTO "notifications" VALUES (1252,'28','H','info','0','2026-08-05 15:25:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (1253,'29','H','info','0','2026-08-05 15:25:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (1254,'30','H','info','0','2026-08-05 15:25:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (1255,'31','H','info','0','2026-08-05 15:25:58','PERS_1010');
INSERT INTO "notifications" VALUES (1256,'32','H','info','0','2026-08-05 15:25:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (1257,'33','H','info','0','2026-08-05 15:25:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (1258,'34','H','info','0','2026-08-05 15:25:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (1259,'35','H','info','0','2026-08-05 15:25:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (1260,'36','H','info','0','2026-08-05 15:25:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (1261,'37','H','info','0','2026-08-05 15:25:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (1262,'38','H','info','0','2026-08-05 15:25:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (1263,'39','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1264,'40','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1265,'41','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1266,'42','H','info','0','2026-08-05 15:25:58','ORG67207');
INSERT INTO "notifications" VALUES (1267,'43','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1268,'44','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1269,'45','H','info','0','2026-08-05 15:25:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (1270,'46','H','info','0','2026-08-05 15:25:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (1271,'47','H','info','0','2026-08-05 15:25:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (1272,'48','H','info','0','2026-08-05 15:25:58','2321');
INSERT INTO "notifications" VALUES (1273,'49','H','info','0','2026-08-05 15:25:58','2321');
INSERT INTO "notifications" VALUES (1274,'50','H','info','0','2026-08-05 15:25:58','ABC');
INSERT INTO "notifications" VALUES (1275,'51','H','info','0','2026-08-05 15:25:58','ABC');
INSERT INTO "notifications" VALUES (1276,'52','H','info','0','2026-08-05 15:25:58','PERS_1111');
INSERT INTO "notifications" VALUES (1277,'53','H','info','0','2026-08-05 15:25:58','SAS');
INSERT INTO "notifications" VALUES (1278,'55','H','info','0','2026-08-05 15:25:58','123');
INSERT INTO "notifications" VALUES (1279,'56','H','info','0','2026-08-05 15:25:58','123');
INSERT INTO "notifications" VALUES (1280,'57','H','info','1','2026-08-05 15:25:58','4343');
INSERT INTO "notifications" VALUES (1281,'9999','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1282,'9998','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1283,'10','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1284,'11','H','info','0','2026-08-05 15:25:58','SCH8912');
INSERT INTO "notifications" VALUES (1285,'12','H','info','0','2026-08-05 15:25:58','DPSGZB');
INSERT INTO "notifications" VALUES (1286,'13','H','info','0','2026-08-05 15:25:58','dps123');
INSERT INTO "notifications" VALUES (1287,'14','H','info','0','2026-08-05 15:25:58','dps123');
INSERT INTO "notifications" VALUES (1288,'17','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1289,'18','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1290,'19','H','info','0','2026-08-05 15:25:58','ORG33184');
INSERT INTO "notifications" VALUES (1291,'20','H','info','0','2026-08-05 15:25:58','SCH8259');
INSERT INTO "notifications" VALUES (1292,'21','H','info','0','2026-08-05 15:25:58','codex');
INSERT INTO "notifications" VALUES (1293,'22','H','info','0','2026-08-05 15:25:58','12345678');
INSERT INTO "notifications" VALUES (1294,'23','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1295,'24','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1296,'25','H','info','1','2026-08-05 15:25:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1297,'26','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1298,'27','H','info','0','2026-08-05 15:25:58','SCH8259');
INSERT INTO "notifications" VALUES (1299,'28','H','info','0','2026-08-05 15:25:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (1300,'29','H','info','0','2026-08-05 15:25:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (1301,'30','H','info','0','2026-08-05 15:25:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (1302,'31','H','info','0','2026-08-05 15:25:58','PERS_1010');
INSERT INTO "notifications" VALUES (1303,'32','H','info','0','2026-08-05 15:25:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (1304,'33','H','info','0','2026-08-05 15:25:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (1305,'34','H','info','0','2026-08-05 15:25:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (1306,'35','H','info','0','2026-08-05 15:25:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (1307,'36','H','info','0','2026-08-05 15:25:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (1308,'37','H','info','0','2026-08-05 15:25:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (1309,'38','H','info','0','2026-08-05 15:25:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (1310,'39','H','info','1','2026-08-05 15:25:58','GLOBAL');
INSERT INTO "notifications" VALUES (1311,'40','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1312,'41','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1313,'42','H','info','0','2026-08-05 15:25:58','ORG67207');
INSERT INTO "notifications" VALUES (1314,'43','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1315,'44','H','info','0','2026-08-05 15:25:58','DPS123');
INSERT INTO "notifications" VALUES (1316,'45','H','info','0','2026-08-05 15:25:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (1317,'46','H','info','0','2026-08-05 15:25:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (1318,'47','H','info','0','2026-08-05 15:25:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (1319,'48','H','info','0','2026-08-05 15:25:58','2321');
INSERT INTO "notifications" VALUES (1320,'49','H','info','0','2026-08-05 15:25:58','2321');
INSERT INTO "notifications" VALUES (1321,'50','H','info','0','2026-08-05 15:25:58','ABC');
INSERT INTO "notifications" VALUES (1322,'51','H','info','0','2026-08-05 15:25:58','ABC');
INSERT INTO "notifications" VALUES (1323,'52','H','info','0','2026-08-05 15:25:58','PERS_1111');
INSERT INTO "notifications" VALUES (1324,'53','H','info','0','2026-08-05 15:25:58','SAS');
INSERT INTO "notifications" VALUES (1325,'55','H','info','0','2026-08-05 15:25:58','123');
INSERT INTO "notifications" VALUES (1326,'56','H','info','0','2026-08-05 15:25:58','123');
INSERT INTO "notifications" VALUES (1327,'57','H','info','1','2026-08-05 15:25:58','4343');
INSERT INTO "notifications" VALUES (1328,'9999','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1329,'9998','H','info','0','2026-08-05 15:25:58','00000');
INSERT INTO "notifications" VALUES (1330,'10','H','error','0','2026-08-05 15:26:00','00000');
INSERT INTO "notifications" VALUES (1331,'11','H','error','0','2026-08-05 15:26:00','SCH8912');
INSERT INTO "notifications" VALUES (1332,'12','H','error','0','2026-08-05 15:26:00','DPSGZB');
INSERT INTO "notifications" VALUES (1333,'13','H','error','0','2026-08-05 15:26:00','dps123');
INSERT INTO "notifications" VALUES (1334,'14','H','error','0','2026-08-05 15:26:00','dps123');
INSERT INTO "notifications" VALUES (1335,'17','H','error','0','2026-08-05 15:26:00','DPS123');
INSERT INTO "notifications" VALUES (1336,'18','H','error','1','2026-08-05 15:26:00','GLOBAL');
INSERT INTO "notifications" VALUES (1337,'19','H','error','0','2026-08-05 15:26:00','ORG33184');
INSERT INTO "notifications" VALUES (1338,'20','H','error','0','2026-08-05 15:26:00','SCH8259');
INSERT INTO "notifications" VALUES (1339,'21','H','error','0','2026-08-05 15:26:00','codex');
INSERT INTO "notifications" VALUES (1340,'22','H','error','0','2026-08-05 15:26:00','12345678');
INSERT INTO "notifications" VALUES (1341,'23','H','error','1','2026-08-05 15:26:00','AUTOTEST');
INSERT INTO "notifications" VALUES (1342,'24','H','error','1','2026-08-05 15:26:00','AUTOTEST');
INSERT INTO "notifications" VALUES (1343,'25','H','error','1','2026-08-05 15:26:00','AUTOTEST');
INSERT INTO "notifications" VALUES (1344,'26','H','error','1','2026-08-05 15:26:00','GLOBAL');
INSERT INTO "notifications" VALUES (1345,'27','H','error','0','2026-08-05 15:26:00','SCH8259');
INSERT INTO "notifications" VALUES (1346,'28','H','error','0','2026-08-05 15:26:00','PERS_1686430576');
INSERT INTO "notifications" VALUES (1347,'29','H','error','0','2026-08-05 15:26:00','PERS_1686469424');
INSERT INTO "notifications" VALUES (1348,'30','H','error','0','2026-08-05 15:26:00','PERS_1687169676');
INSERT INTO "notifications" VALUES (1349,'31','H','error','0','2026-08-05 15:26:00','PERS_1010');
INSERT INTO "notifications" VALUES (1350,'32','H','error','0','2026-08-05 15:26:00','PERS_1687915531');
INSERT INTO "notifications" VALUES (1351,'33','H','error','0','2026-08-05 15:26:00','PERS_1688425985');
INSERT INTO "notifications" VALUES (1352,'34','H','error','0','2026-08-05 15:26:00','PERS_1698080521');
INSERT INTO "notifications" VALUES (1353,'35','H','error','0','2026-08-05 15:26:00','PERS_1698635237');
INSERT INTO "notifications" VALUES (1354,'36','H','error','0','2026-08-05 15:26:00','PERS_1698664310');
INSERT INTO "notifications" VALUES (1355,'37','H','error','0','2026-08-05 15:26:00','PERS_1698985699');
INSERT INTO "notifications" VALUES (1356,'38','H','error','0','2026-08-05 15:26:00','PERS_1699721478');
INSERT INTO "notifications" VALUES (1357,'39','H','error','1','2026-08-05 15:26:00','GLOBAL');
INSERT INTO "notifications" VALUES (1358,'40','H','error','0','2026-08-05 15:26:00','DPS123');
INSERT INTO "notifications" VALUES (1359,'41','H','error','0','2026-08-05 15:26:00','DPS123');
INSERT INTO "notifications" VALUES (1360,'42','H','error','0','2026-08-05 15:26:00','ORG67207');
INSERT INTO "notifications" VALUES (1361,'43','H','error','0','2026-08-05 15:26:00','DPS123');
INSERT INTO "notifications" VALUES (1362,'44','H','error','0','2026-08-05 15:26:00','DPS123');
INSERT INTO "notifications" VALUES (1363,'45','H','error','0','2026-08-05 15:26:00','PERS_2220685710');
INSERT INTO "notifications" VALUES (1364,'46','H','error','0','2026-08-05 15:26:00','PERS_2220723439');
INSERT INTO "notifications" VALUES (1365,'47','H','error','0','2026-08-05 15:26:00','PERS_2221315654');
INSERT INTO "notifications" VALUES (1366,'48','H','error','0','2026-08-05 15:26:00','2321');
INSERT INTO "notifications" VALUES (1367,'49','H','error','0','2026-08-05 15:26:00','2321');
INSERT INTO "notifications" VALUES (1368,'50','H','error','0','2026-08-05 15:26:00','ABC');
INSERT INTO "notifications" VALUES (1369,'51','H','error','0','2026-08-05 15:26:00','ABC');
INSERT INTO "notifications" VALUES (1370,'52','H','error','0','2026-08-05 15:26:00','PERS_1111');
INSERT INTO "notifications" VALUES (1371,'53','H','error','0','2026-08-05 15:26:00','SAS');
INSERT INTO "notifications" VALUES (1372,'55','H','error','0','2026-08-05 15:26:00','123');
INSERT INTO "notifications" VALUES (1373,'56','H','error','0','2026-08-05 15:26:00','123');
INSERT INTO "notifications" VALUES (1374,'57','H','error','1','2026-08-05 15:26:00','4343');
INSERT INTO "notifications" VALUES (1375,'9999','H','error','0','2026-08-05 15:26:00','00000');
INSERT INTO "notifications" VALUES (1376,'9998','H','error','0','2026-08-05 15:26:00','00000');
INSERT INTO "notifications" VALUES (1377,'0','? New meeting scheduled: \"hello bacho\" by Librarian Auto (LIB-EAS-T6A).','live_class',NULL,NULL,'AUTOTEST');
INSERT INTO "notifications" VALUES (1378,'10','hello all','info','0','2026-09-15 12:14:54','00000');
INSERT INTO "notifications" VALUES (1379,'11','hello all','info','0','2026-09-15 12:14:54','SCH8912');
INSERT INTO "notifications" VALUES (1380,'12','hello all','info','0','2026-09-15 12:14:54','DPSGZB');
INSERT INTO "notifications" VALUES (1381,'13','hello all','info','0','2026-09-15 12:14:54','dps123');
INSERT INTO "notifications" VALUES (1382,'14','hello all','info','0','2026-09-15 12:14:54','dps123');
INSERT INTO "notifications" VALUES (1383,'17','hello all','info','0','2026-09-15 12:14:54','DPS123');
INSERT INTO "notifications" VALUES (1384,'18','hello all','info','0','2026-09-15 12:14:54','GLOBAL');
INSERT INTO "notifications" VALUES (1385,'19','hello all','info','0','2026-09-15 12:14:54','ORG33184');
INSERT INTO "notifications" VALUES (1386,'20','hello all','info','0','2026-09-15 12:14:54','SCH8259');
INSERT INTO "notifications" VALUES (1387,'21','hello all','info','0','2026-09-15 12:14:54','codex');
INSERT INTO "notifications" VALUES (1388,'22','hello all','info','0','2026-09-15 12:14:54','12345678');
INSERT INTO "notifications" VALUES (1389,'23','hello all','info','0','2026-09-15 12:14:54','AUTOTEST');
INSERT INTO "notifications" VALUES (1390,'24','hello all','info','0','2026-09-15 12:14:54','AUTOTEST');
INSERT INTO "notifications" VALUES (1391,'25','hello all','info','0','2026-09-15 12:14:54','AUTOTEST');
INSERT INTO "notifications" VALUES (1392,'26','hello all','info','0','2026-09-15 12:14:54','GLOBAL');
INSERT INTO "notifications" VALUES (1393,'27','hello all','info','0','2026-09-15 12:14:54','SCH8259');
INSERT INTO "notifications" VALUES (1394,'28','hello all','info','0','2026-09-15 12:14:54','PERS_1686430576');
INSERT INTO "notifications" VALUES (1395,'29','hello all','info','0','2026-09-15 12:14:54','PERS_1686469424');
INSERT INTO "notifications" VALUES (1396,'30','hello all','info','0','2026-09-15 12:14:54','PERS_1687169676');
INSERT INTO "notifications" VALUES (1397,'31','hello all','info','0','2026-09-15 12:14:54','PERS_1010');
INSERT INTO "notifications" VALUES (1398,'32','hello all','info','0','2026-09-15 12:14:54','PERS_1687915531');
INSERT INTO "notifications" VALUES (1399,'33','hello all','info','0','2026-09-15 12:14:54','PERS_1688425985');
INSERT INTO "notifications" VALUES (1400,'34','hello all','info','0','2026-09-15 12:14:54','PERS_1698080521');
INSERT INTO "notifications" VALUES (1401,'35','hello all','info','0','2026-09-15 12:14:54','PERS_1698635237');
INSERT INTO "notifications" VALUES (1402,'36','hello all','info','0','2026-09-15 12:14:54','PERS_1698664310');
INSERT INTO "notifications" VALUES (1403,'37','hello all','info','0','2026-09-15 12:14:54','PERS_1698985699');
INSERT INTO "notifications" VALUES (1404,'38','hello all','info','0','2026-09-15 12:14:54','PERS_1699721478');
INSERT INTO "notifications" VALUES (1405,'39','hello all','info','0','2026-09-15 12:14:54','GLOBAL');
INSERT INTO "notifications" VALUES (1406,'40','hello all','info','0','2026-09-15 12:14:54','DPS123');
INSERT INTO "notifications" VALUES (1407,'41','hello all','info','0','2026-09-15 12:14:54','DPS123');
INSERT INTO "notifications" VALUES (1408,'42','hello all','info','0','2026-09-15 12:14:54','ORG67207');
INSERT INTO "notifications" VALUES (1409,'43','hello all','info','0','2026-09-15 12:14:54','DPS123');
INSERT INTO "notifications" VALUES (1410,'44','hello all','info','0','2026-09-15 12:14:54','DPS123');
INSERT INTO "notifications" VALUES (1411,'45','hello all','info','0','2026-09-15 12:14:54','PERS_2220685710');
INSERT INTO "notifications" VALUES (1412,'46','hello all','info','0','2026-09-15 12:14:54','PERS_2220723439');
INSERT INTO "notifications" VALUES (1413,'47','hello all','info','0','2026-09-15 12:14:54','PERS_2221315654');
INSERT INTO "notifications" VALUES (1414,'48','hello all','info','0','2026-09-15 12:14:54','2321');
INSERT INTO "notifications" VALUES (1415,'49','hello all','info','0','2026-09-15 12:14:54','2321');
INSERT INTO "notifications" VALUES (1416,'50','hello all','info','0','2026-09-15 12:14:54','ABC');
INSERT INTO "notifications" VALUES (1417,'51','hello all','info','0','2026-09-15 12:14:54','ABC');
INSERT INTO "notifications" VALUES (1418,'52','hello all','info','0','2026-09-15 12:14:54','PERS_1111');
INSERT INTO "notifications" VALUES (1419,'53','hello all','info','0','2026-09-15 12:14:54','SAS');
INSERT INTO "notifications" VALUES (1420,'55','hello all','info','0','2026-09-15 12:14:54','123');
INSERT INTO "notifications" VALUES (1421,'56','hello all','info','0','2026-09-15 12:14:54','123');
INSERT INTO "notifications" VALUES (1422,'57','hello all','info','0','2026-09-15 12:14:54','4343');
INSERT INTO "notifications" VALUES (1423,'9999','hello all','info','0','2026-09-15 12:14:54','00000');
INSERT INTO "notifications" VALUES (1424,'9998','hello all','info','0','2026-09-15 12:14:54','00000');
INSERT INTO "notifications" VALUES (1425,NULL,'hello all','info','0','2026-09-15 12:14:54','DL-140307');
INSERT INTO "notifications" VALUES (1426,NULL,'hello all','info','0','2026-09-15 12:14:54','library');
INSERT INTO "notifications" VALUES (1427,'10','hello all','info','0','2026-09-15 12:14:55','00000');
INSERT INTO "notifications" VALUES (1428,'11','hello all','info','0','2026-09-15 12:14:55','SCH8912');
INSERT INTO "notifications" VALUES (1429,'12','hello all','info','0','2026-09-15 12:14:55','DPSGZB');
INSERT INTO "notifications" VALUES (1430,'13','hello all','info','0','2026-09-15 12:14:55','dps123');
INSERT INTO "notifications" VALUES (1431,'14','hello all','info','0','2026-09-15 12:14:55','dps123');
INSERT INTO "notifications" VALUES (1432,'17','hello all','info','0','2026-09-15 12:14:55','DPS123');
INSERT INTO "notifications" VALUES (1433,'18','hello all','info','0','2026-09-15 12:14:55','GLOBAL');
INSERT INTO "notifications" VALUES (1434,'19','hello all','info','0','2026-09-15 12:14:55','ORG33184');
INSERT INTO "notifications" VALUES (1435,'20','hello all','info','0','2026-09-15 12:14:55','SCH8259');
INSERT INTO "notifications" VALUES (1436,'21','hello all','info','0','2026-09-15 12:14:55','codex');
INSERT INTO "notifications" VALUES (1437,'22','hello all','info','0','2026-09-15 12:14:55','12345678');
INSERT INTO "notifications" VALUES (1438,'23','hello all','info','0','2026-09-15 12:14:55','AUTOTEST');
INSERT INTO "notifications" VALUES (1439,'24','hello all','info','0','2026-09-15 12:14:55','AUTOTEST');
INSERT INTO "notifications" VALUES (1440,'25','hello all','info','0','2026-09-15 12:14:55','AUTOTEST');
INSERT INTO "notifications" VALUES (1441,'26','hello all','info','0','2026-09-15 12:14:55','GLOBAL');
INSERT INTO "notifications" VALUES (1442,'27','hello all','info','0','2026-09-15 12:14:55','SCH8259');
INSERT INTO "notifications" VALUES (1443,'28','hello all','info','0','2026-09-15 12:14:55','PERS_1686430576');
INSERT INTO "notifications" VALUES (1444,'29','hello all','info','0','2026-09-15 12:14:55','PERS_1686469424');
INSERT INTO "notifications" VALUES (1445,'30','hello all','info','0','2026-09-15 12:14:55','PERS_1687169676');
INSERT INTO "notifications" VALUES (1446,'31','hello all','info','0','2026-09-15 12:14:55','PERS_1010');
INSERT INTO "notifications" VALUES (1447,'32','hello all','info','0','2026-09-15 12:14:55','PERS_1687915531');
INSERT INTO "notifications" VALUES (1448,'33','hello all','info','0','2026-09-15 12:14:55','PERS_1688425985');
INSERT INTO "notifications" VALUES (1449,'34','hello all','info','0','2026-09-15 12:14:55','PERS_1698080521');
INSERT INTO "notifications" VALUES (1450,'35','hello all','info','0','2026-09-15 12:14:55','PERS_1698635237');
INSERT INTO "notifications" VALUES (1451,'36','hello all','info','0','2026-09-15 12:14:55','PERS_1698664310');
INSERT INTO "notifications" VALUES (1452,'37','hello all','info','0','2026-09-15 12:14:55','PERS_1698985699');
INSERT INTO "notifications" VALUES (1453,'38','hello all','info','0','2026-09-15 12:14:55','PERS_1699721478');
INSERT INTO "notifications" VALUES (1454,'39','hello all','info','0','2026-09-15 12:14:55','GLOBAL');
INSERT INTO "notifications" VALUES (1455,'40','hello all','info','0','2026-09-15 12:14:55','DPS123');
INSERT INTO "notifications" VALUES (1456,'41','hello all','info','0','2026-09-15 12:14:55','DPS123');
INSERT INTO "notifications" VALUES (1457,'42','hello all','info','0','2026-09-15 12:14:55','ORG67207');
INSERT INTO "notifications" VALUES (1458,'43','hello all','info','0','2026-09-15 12:14:55','DPS123');
INSERT INTO "notifications" VALUES (1459,'44','hello all','info','0','2026-09-15 12:14:55','DPS123');
INSERT INTO "notifications" VALUES (1460,'45','hello all','info','0','2026-09-15 12:14:55','PERS_2220685710');
INSERT INTO "notifications" VALUES (1461,'46','hello all','info','0','2026-09-15 12:14:55','PERS_2220723439');
INSERT INTO "notifications" VALUES (1462,'47','hello all','info','0','2026-09-15 12:14:55','PERS_2221315654');
INSERT INTO "notifications" VALUES (1463,'48','hello all','info','0','2026-09-15 12:14:55','2321');
INSERT INTO "notifications" VALUES (1464,'49','hello all','info','0','2026-09-15 12:14:55','2321');
INSERT INTO "notifications" VALUES (1465,'50','hello all','info','0','2026-09-15 12:14:55','ABC');
INSERT INTO "notifications" VALUES (1466,'51','hello all','info','0','2026-09-15 12:14:55','ABC');
INSERT INTO "notifications" VALUES (1467,'52','hello all','info','0','2026-09-15 12:14:55','PERS_1111');
INSERT INTO "notifications" VALUES (1468,'53','hello all','info','0','2026-09-15 12:14:55','SAS');
INSERT INTO "notifications" VALUES (1469,'55','hello all','info','0','2026-09-15 12:14:55','123');
INSERT INTO "notifications" VALUES (1470,'56','hello all','info','0','2026-09-15 12:14:55','123');
INSERT INTO "notifications" VALUES (1471,'57','hello all','info','0','2026-09-15 12:14:55','4343');
INSERT INTO "notifications" VALUES (1472,'9999','hello all','info','0','2026-09-15 12:14:55','00000');
INSERT INTO "notifications" VALUES (1473,'9998','hello all','info','0','2026-09-15 12:14:55','00000');
INSERT INTO "notifications" VALUES (1474,NULL,'hello all','info','0','2026-09-15 12:14:55','DL-140307');
INSERT INTO "notifications" VALUES (1475,NULL,'hello all','info','0','2026-09-15 12:14:55','library');
INSERT INTO "notifications" VALUES (1476,'10','hello all','info','0','2026-09-15 12:14:56','00000');
INSERT INTO "notifications" VALUES (1477,'11','hello all','info','0','2026-09-15 12:14:56','SCH8912');
INSERT INTO "notifications" VALUES (1478,'12','hello all','info','0','2026-09-15 12:14:56','DPSGZB');
INSERT INTO "notifications" VALUES (1479,'13','hello all','info','0','2026-09-15 12:14:56','dps123');
INSERT INTO "notifications" VALUES (1480,'14','hello all','info','0','2026-09-15 12:14:56','dps123');
INSERT INTO "notifications" VALUES (1481,'17','hello all','info','0','2026-09-15 12:14:56','DPS123');
INSERT INTO "notifications" VALUES (1482,'18','hello all','info','0','2026-09-15 12:14:56','GLOBAL');
INSERT INTO "notifications" VALUES (1483,'19','hello all','info','0','2026-09-15 12:14:56','ORG33184');
INSERT INTO "notifications" VALUES (1484,'20','hello all','info','0','2026-09-15 12:14:56','SCH8259');
INSERT INTO "notifications" VALUES (1485,'21','hello all','info','0','2026-09-15 12:14:56','codex');
INSERT INTO "notifications" VALUES (1486,'22','hello all','info','0','2026-09-15 12:14:56','12345678');
INSERT INTO "notifications" VALUES (1487,'23','hello all','info','0','2026-09-15 12:14:56','AUTOTEST');
INSERT INTO "notifications" VALUES (1488,'24','hello all','info','0','2026-09-15 12:14:56','AUTOTEST');
INSERT INTO "notifications" VALUES (1489,'25','hello all','info','0','2026-09-15 12:14:56','AUTOTEST');
INSERT INTO "notifications" VALUES (1490,'26','hello all','info','0','2026-09-15 12:14:56','GLOBAL');
INSERT INTO "notifications" VALUES (1491,'27','hello all','info','0','2026-09-15 12:14:56','SCH8259');
INSERT INTO "notifications" VALUES (1492,'28','hello all','info','0','2026-09-15 12:14:56','PERS_1686430576');
INSERT INTO "notifications" VALUES (1493,'29','hello all','info','0','2026-09-15 12:14:56','PERS_1686469424');
INSERT INTO "notifications" VALUES (1494,'30','hello all','info','0','2026-09-15 12:14:56','PERS_1687169676');
INSERT INTO "notifications" VALUES (1495,'31','hello all','info','0','2026-09-15 12:14:56','PERS_1010');
INSERT INTO "notifications" VALUES (1496,'32','hello all','info','0','2026-09-15 12:14:56','PERS_1687915531');
INSERT INTO "notifications" VALUES (1497,'33','hello all','info','0','2026-09-15 12:14:56','PERS_1688425985');
INSERT INTO "notifications" VALUES (1498,'34','hello all','info','0','2026-09-15 12:14:56','PERS_1698080521');
INSERT INTO "notifications" VALUES (1499,'35','hello all','info','0','2026-09-15 12:14:56','PERS_1698635237');
INSERT INTO "notifications" VALUES (1500,'36','hello all','info','0','2026-09-15 12:14:56','PERS_1698664310');
INSERT INTO "notifications" VALUES (1501,'37','hello all','info','0','2026-09-15 12:14:56','PERS_1698985699');
INSERT INTO "notifications" VALUES (1502,'38','hello all','info','0','2026-09-15 12:14:56','PERS_1699721478');
INSERT INTO "notifications" VALUES (1503,'39','hello all','info','0','2026-09-15 12:14:56','GLOBAL');
INSERT INTO "notifications" VALUES (1504,'40','hello all','info','0','2026-09-15 12:14:56','DPS123');
INSERT INTO "notifications" VALUES (1505,'41','hello all','info','0','2026-09-15 12:14:56','DPS123');
INSERT INTO "notifications" VALUES (1506,'42','hello all','info','0','2026-09-15 12:14:56','ORG67207');
INSERT INTO "notifications" VALUES (1507,'43','hello all','info','0','2026-09-15 12:14:56','DPS123');
INSERT INTO "notifications" VALUES (1508,'44','hello all','info','0','2026-09-15 12:14:56','DPS123');
INSERT INTO "notifications" VALUES (1509,'45','hello all','info','0','2026-09-15 12:14:56','PERS_2220685710');
INSERT INTO "notifications" VALUES (1510,'46','hello all','info','0','2026-09-15 12:14:56','PERS_2220723439');
INSERT INTO "notifications" VALUES (1511,'47','hello all','info','0','2026-09-15 12:14:56','PERS_2221315654');
INSERT INTO "notifications" VALUES (1512,'48','hello all','info','0','2026-09-15 12:14:56','2321');
INSERT INTO "notifications" VALUES (1513,'49','hello all','info','0','2026-09-15 12:14:56','2321');
INSERT INTO "notifications" VALUES (1514,'50','hello all','info','0','2026-09-15 12:14:56','ABC');
INSERT INTO "notifications" VALUES (1515,'51','hello all','info','0','2026-09-15 12:14:56','ABC');
INSERT INTO "notifications" VALUES (1516,'52','hello all','info','0','2026-09-15 12:14:56','PERS_1111');
INSERT INTO "notifications" VALUES (1517,'53','hello all','info','0','2026-09-15 12:14:56','SAS');
INSERT INTO "notifications" VALUES (1518,'55','hello all','info','0','2026-09-15 12:14:56','123');
INSERT INTO "notifications" VALUES (1519,'56','hello all','info','0','2026-09-15 12:14:56','123');
INSERT INTO "notifications" VALUES (1520,'57','hello all','info','0','2026-09-15 12:14:56','4343');
INSERT INTO "notifications" VALUES (1521,'9999','hello all','info','0','2026-09-15 12:14:56','00000');
INSERT INTO "notifications" VALUES (1522,'9998','hello all','info','0','2026-09-15 12:14:56','00000');
INSERT INTO "notifications" VALUES (1523,NULL,'hello all','info','0','2026-09-15 12:14:56','DL-140307');
INSERT INTO "notifications" VALUES (1524,NULL,'hello all','info','0','2026-09-15 12:14:56','library');
INSERT INTO "notifications" VALUES (1525,'10','hello all','info','0','2026-09-15 12:14:57','00000');
INSERT INTO "notifications" VALUES (1526,'11','hello all','info','0','2026-09-15 12:14:57','SCH8912');
INSERT INTO "notifications" VALUES (1527,'12','hello all','info','0','2026-09-15 12:14:57','DPSGZB');
INSERT INTO "notifications" VALUES (1528,'13','hello all','info','0','2026-09-15 12:14:57','dps123');
INSERT INTO "notifications" VALUES (1529,'14','hello all','info','0','2026-09-15 12:14:57','dps123');
INSERT INTO "notifications" VALUES (1530,'17','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1531,'18','hello all','info','0','2026-09-15 12:14:57','GLOBAL');
INSERT INTO "notifications" VALUES (1532,'19','hello all','info','0','2026-09-15 12:14:57','ORG33184');
INSERT INTO "notifications" VALUES (1533,'20','hello all','info','0','2026-09-15 12:14:57','SCH8259');
INSERT INTO "notifications" VALUES (1534,'21','hello all','info','0','2026-09-15 12:14:57','codex');
INSERT INTO "notifications" VALUES (1535,'22','hello all','info','0','2026-09-15 12:14:57','12345678');
INSERT INTO "notifications" VALUES (1536,'23','hello all','info','0','2026-09-15 12:14:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1537,'24','hello all','info','0','2026-09-15 12:14:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1538,'25','hello all','info','0','2026-09-15 12:14:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1539,'26','hello all','info','0','2026-09-15 12:14:57','GLOBAL');
INSERT INTO "notifications" VALUES (1540,'27','hello all','info','0','2026-09-15 12:14:57','SCH8259');
INSERT INTO "notifications" VALUES (1541,'28','hello all','info','0','2026-09-15 12:14:57','PERS_1686430576');
INSERT INTO "notifications" VALUES (1542,'29','hello all','info','0','2026-09-15 12:14:57','PERS_1686469424');
INSERT INTO "notifications" VALUES (1543,'30','hello all','info','0','2026-09-15 12:14:57','PERS_1687169676');
INSERT INTO "notifications" VALUES (1544,'31','hello all','info','0','2026-09-15 12:14:57','PERS_1010');
INSERT INTO "notifications" VALUES (1545,'32','hello all','info','0','2026-09-15 12:14:57','PERS_1687915531');
INSERT INTO "notifications" VALUES (1546,'33','hello all','info','0','2026-09-15 12:14:57','PERS_1688425985');
INSERT INTO "notifications" VALUES (1547,'34','hello all','info','0','2026-09-15 12:14:57','PERS_1698080521');
INSERT INTO "notifications" VALUES (1548,'35','hello all','info','0','2026-09-15 12:14:57','PERS_1698635237');
INSERT INTO "notifications" VALUES (1549,'36','hello all','info','0','2026-09-15 12:14:57','PERS_1698664310');
INSERT INTO "notifications" VALUES (1550,'37','hello all','info','0','2026-09-15 12:14:57','PERS_1698985699');
INSERT INTO "notifications" VALUES (1551,'38','hello all','info','0','2026-09-15 12:14:57','PERS_1699721478');
INSERT INTO "notifications" VALUES (1552,'39','hello all','info','0','2026-09-15 12:14:57','GLOBAL');
INSERT INTO "notifications" VALUES (1553,'40','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1554,'41','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1555,'42','hello all','info','0','2026-09-15 12:14:57','ORG67207');
INSERT INTO "notifications" VALUES (1556,'43','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1557,'44','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1558,'45','hello all','info','0','2026-09-15 12:14:57','PERS_2220685710');
INSERT INTO "notifications" VALUES (1559,'46','hello all','info','0','2026-09-15 12:14:57','PERS_2220723439');
INSERT INTO "notifications" VALUES (1560,'47','hello all','info','0','2026-09-15 12:14:57','PERS_2221315654');
INSERT INTO "notifications" VALUES (1561,'48','hello all','info','0','2026-09-15 12:14:57','2321');
INSERT INTO "notifications" VALUES (1562,'49','hello all','info','0','2026-09-15 12:14:57','2321');
INSERT INTO "notifications" VALUES (1563,'50','hello all','info','0','2026-09-15 12:14:57','ABC');
INSERT INTO "notifications" VALUES (1564,'51','hello all','info','0','2026-09-15 12:14:57','ABC');
INSERT INTO "notifications" VALUES (1565,'52','hello all','info','0','2026-09-15 12:14:57','PERS_1111');
INSERT INTO "notifications" VALUES (1566,'53','hello all','info','0','2026-09-15 12:14:57','SAS');
INSERT INTO "notifications" VALUES (1567,'55','hello all','info','0','2026-09-15 12:14:57','123');
INSERT INTO "notifications" VALUES (1568,'56','hello all','info','0','2026-09-15 12:14:57','123');
INSERT INTO "notifications" VALUES (1569,'57','hello all','info','0','2026-09-15 12:14:57','4343');
INSERT INTO "notifications" VALUES (1570,'9999','hello all','info','0','2026-09-15 12:14:57','00000');
INSERT INTO "notifications" VALUES (1571,'9998','hello all','info','0','2026-09-15 12:14:57','00000');
INSERT INTO "notifications" VALUES (1572,NULL,'hello all','info','0','2026-09-15 12:14:57','DL-140307');
INSERT INTO "notifications" VALUES (1573,NULL,'hello all','info','0','2026-09-15 12:14:57','library');
INSERT INTO "notifications" VALUES (1574,'10','hello all','info','0','2026-09-15 12:14:57','00000');
INSERT INTO "notifications" VALUES (1575,'11','hello all','info','0','2026-09-15 12:14:57','SCH8912');
INSERT INTO "notifications" VALUES (1576,'12','hello all','info','0','2026-09-15 12:14:57','DPSGZB');
INSERT INTO "notifications" VALUES (1577,'13','hello all','info','0','2026-09-15 12:14:57','dps123');
INSERT INTO "notifications" VALUES (1578,'14','hello all','info','0','2026-09-15 12:14:57','dps123');
INSERT INTO "notifications" VALUES (1579,'17','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1580,'18','hello all','info','0','2026-09-15 12:14:57','GLOBAL');
INSERT INTO "notifications" VALUES (1581,'19','hello all','info','0','2026-09-15 12:14:57','ORG33184');
INSERT INTO "notifications" VALUES (1582,'20','hello all','info','0','2026-09-15 12:14:57','SCH8259');
INSERT INTO "notifications" VALUES (1583,'21','hello all','info','0','2026-09-15 12:14:57','codex');
INSERT INTO "notifications" VALUES (1584,'22','hello all','info','0','2026-09-15 12:14:57','12345678');
INSERT INTO "notifications" VALUES (1585,'23','hello all','info','0','2026-09-15 12:14:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1586,'24','hello all','info','0','2026-09-15 12:14:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1587,'25','hello all','info','0','2026-09-15 12:14:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1588,'26','hello all','info','0','2026-09-15 12:14:57','GLOBAL');
INSERT INTO "notifications" VALUES (1589,'27','hello all','info','0','2026-09-15 12:14:57','SCH8259');
INSERT INTO "notifications" VALUES (1590,'28','hello all','info','0','2026-09-15 12:14:57','PERS_1686430576');
INSERT INTO "notifications" VALUES (1591,'29','hello all','info','0','2026-09-15 12:14:57','PERS_1686469424');
INSERT INTO "notifications" VALUES (1592,'30','hello all','info','0','2026-09-15 12:14:57','PERS_1687169676');
INSERT INTO "notifications" VALUES (1593,'31','hello all','info','0','2026-09-15 12:14:57','PERS_1010');
INSERT INTO "notifications" VALUES (1594,'32','hello all','info','0','2026-09-15 12:14:57','PERS_1687915531');
INSERT INTO "notifications" VALUES (1595,'33','hello all','info','0','2026-09-15 12:14:57','PERS_1688425985');
INSERT INTO "notifications" VALUES (1596,'34','hello all','info','0','2026-09-15 12:14:57','PERS_1698080521');
INSERT INTO "notifications" VALUES (1597,'35','hello all','info','0','2026-09-15 12:14:57','PERS_1698635237');
INSERT INTO "notifications" VALUES (1598,'36','hello all','info','0','2026-09-15 12:14:57','PERS_1698664310');
INSERT INTO "notifications" VALUES (1599,'37','hello all','info','0','2026-09-15 12:14:57','PERS_1698985699');
INSERT INTO "notifications" VALUES (1600,'38','hello all','info','0','2026-09-15 12:14:57','PERS_1699721478');
INSERT INTO "notifications" VALUES (1601,'39','hello all','info','0','2026-09-15 12:14:57','GLOBAL');
INSERT INTO "notifications" VALUES (1602,'40','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1603,'41','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1604,'42','hello all','info','0','2026-09-15 12:14:57','ORG67207');
INSERT INTO "notifications" VALUES (1605,'43','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1606,'44','hello all','info','0','2026-09-15 12:14:57','DPS123');
INSERT INTO "notifications" VALUES (1607,'45','hello all','info','0','2026-09-15 12:14:57','PERS_2220685710');
INSERT INTO "notifications" VALUES (1608,'46','hello all','info','0','2026-09-15 12:14:57','PERS_2220723439');
INSERT INTO "notifications" VALUES (1609,'47','hello all','info','0','2026-09-15 12:14:57','PERS_2221315654');
INSERT INTO "notifications" VALUES (1610,'48','hello all','info','0','2026-09-15 12:14:57','2321');
INSERT INTO "notifications" VALUES (1611,'49','hello all','info','0','2026-09-15 12:14:57','2321');
INSERT INTO "notifications" VALUES (1612,'50','hello all','info','0','2026-09-15 12:14:57','ABC');
INSERT INTO "notifications" VALUES (1613,'51','hello all','info','0','2026-09-15 12:14:57','ABC');
INSERT INTO "notifications" VALUES (1614,'52','hello all','info','0','2026-09-15 12:14:57','PERS_1111');
INSERT INTO "notifications" VALUES (1615,'53','hello all','info','0','2026-09-15 12:14:57','SAS');
INSERT INTO "notifications" VALUES (1616,'55','hello all','info','0','2026-09-15 12:14:57','123');
INSERT INTO "notifications" VALUES (1617,'56','hello all','info','0','2026-09-15 12:14:57','123');
INSERT INTO "notifications" VALUES (1618,'57','hello all','info','0','2026-09-15 12:14:57','4343');
INSERT INTO "notifications" VALUES (1619,'9999','hello all','info','0','2026-09-15 12:14:57','00000');
INSERT INTO "notifications" VALUES (1620,'9998','hello all','info','0','2026-09-15 12:14:57','00000');
INSERT INTO "notifications" VALUES (1621,NULL,'hello all','info','0','2026-09-15 12:14:57','DL-140307');
INSERT INTO "notifications" VALUES (1622,NULL,'hello all','info','0','2026-09-15 12:14:57','library');
INSERT INTO "notifications" VALUES (1623,'10','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1624,'11','hello all','info','0','2026-09-15 12:14:58','SCH8912');
INSERT INTO "notifications" VALUES (1625,'12','hello all','info','0','2026-09-15 12:14:58','DPSGZB');
INSERT INTO "notifications" VALUES (1626,'13','hello all','info','0','2026-09-15 12:14:58','dps123');
INSERT INTO "notifications" VALUES (1627,'14','hello all','info','0','2026-09-15 12:14:58','dps123');
INSERT INTO "notifications" VALUES (1628,'17','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1629,'18','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1630,'19','hello all','info','0','2026-09-15 12:14:58','ORG33184');
INSERT INTO "notifications" VALUES (1631,'20','hello all','info','0','2026-09-15 12:14:58','SCH8259');
INSERT INTO "notifications" VALUES (1632,'21','hello all','info','0','2026-09-15 12:14:58','codex');
INSERT INTO "notifications" VALUES (1633,'22','hello all','info','0','2026-09-15 12:14:58','12345678');
INSERT INTO "notifications" VALUES (1634,'23','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1635,'24','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1636,'25','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1637,'26','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1638,'27','hello all','info','0','2026-09-15 12:14:58','SCH8259');
INSERT INTO "notifications" VALUES (1639,'28','hello all','info','0','2026-09-15 12:14:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (1640,'29','hello all','info','0','2026-09-15 12:14:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (1641,'30','hello all','info','0','2026-09-15 12:14:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (1642,'31','hello all','info','0','2026-09-15 12:14:58','PERS_1010');
INSERT INTO "notifications" VALUES (1643,'32','hello all','info','0','2026-09-15 12:14:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (1644,'33','hello all','info','0','2026-09-15 12:14:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (1645,'34','hello all','info','0','2026-09-15 12:14:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (1646,'35','hello all','info','0','2026-09-15 12:14:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (1647,'36','hello all','info','0','2026-09-15 12:14:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (1648,'37','hello all','info','0','2026-09-15 12:14:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (1649,'38','hello all','info','0','2026-09-15 12:14:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (1650,'39','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1651,'40','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1652,'41','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1653,'42','hello all','info','0','2026-09-15 12:14:58','ORG67207');
INSERT INTO "notifications" VALUES (1654,'43','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1655,'44','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1656,'45','hello all','info','0','2026-09-15 12:14:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (1657,'46','hello all','info','0','2026-09-15 12:14:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (1658,'47','hello all','info','0','2026-09-15 12:14:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (1659,'48','hello all','info','0','2026-09-15 12:14:58','2321');
INSERT INTO "notifications" VALUES (1660,'49','hello all','info','0','2026-09-15 12:14:58','2321');
INSERT INTO "notifications" VALUES (1661,'50','hello all','info','0','2026-09-15 12:14:58','ABC');
INSERT INTO "notifications" VALUES (1662,'51','hello all','info','0','2026-09-15 12:14:58','ABC');
INSERT INTO "notifications" VALUES (1663,'52','hello all','info','0','2026-09-15 12:14:58','PERS_1111');
INSERT INTO "notifications" VALUES (1664,'53','hello all','info','0','2026-09-15 12:14:58','SAS');
INSERT INTO "notifications" VALUES (1665,'55','hello all','info','0','2026-09-15 12:14:58','123');
INSERT INTO "notifications" VALUES (1666,'56','hello all','info','0','2026-09-15 12:14:58','123');
INSERT INTO "notifications" VALUES (1667,'57','hello all','info','0','2026-09-15 12:14:58','4343');
INSERT INTO "notifications" VALUES (1668,'9999','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1669,'9998','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1670,NULL,'hello all','info','0','2026-09-15 12:14:58','DL-140307');
INSERT INTO "notifications" VALUES (1671,NULL,'hello all','info','0','2026-09-15 12:14:58','library');
INSERT INTO "notifications" VALUES (1672,'10','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1673,'11','hello all','info','0','2026-09-15 12:14:58','SCH8912');
INSERT INTO "notifications" VALUES (1674,'12','hello all','info','0','2026-09-15 12:14:58','DPSGZB');
INSERT INTO "notifications" VALUES (1675,'13','hello all','info','0','2026-09-15 12:14:58','dps123');
INSERT INTO "notifications" VALUES (1676,'14','hello all','info','0','2026-09-15 12:14:58','dps123');
INSERT INTO "notifications" VALUES (1677,'17','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1678,'18','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1679,'19','hello all','info','0','2026-09-15 12:14:58','ORG33184');
INSERT INTO "notifications" VALUES (1680,'20','hello all','info','0','2026-09-15 12:14:58','SCH8259');
INSERT INTO "notifications" VALUES (1681,'21','hello all','info','0','2026-09-15 12:14:58','codex');
INSERT INTO "notifications" VALUES (1682,'22','hello all','info','0','2026-09-15 12:14:58','12345678');
INSERT INTO "notifications" VALUES (1683,'23','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1684,'24','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1685,'25','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1686,'26','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1687,'27','hello all','info','0','2026-09-15 12:14:58','SCH8259');
INSERT INTO "notifications" VALUES (1688,'28','hello all','info','0','2026-09-15 12:14:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (1689,'29','hello all','info','0','2026-09-15 12:14:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (1690,'30','hello all','info','0','2026-09-15 12:14:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (1691,'31','hello all','info','0','2026-09-15 12:14:58','PERS_1010');
INSERT INTO "notifications" VALUES (1692,'32','hello all','info','0','2026-09-15 12:14:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (1693,'33','hello all','info','0','2026-09-15 12:14:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (1694,'34','hello all','info','0','2026-09-15 12:14:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (1695,'35','hello all','info','0','2026-09-15 12:14:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (1696,'36','hello all','info','0','2026-09-15 12:14:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (1697,'37','hello all','info','0','2026-09-15 12:14:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (1698,'38','hello all','info','0','2026-09-15 12:14:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (1699,'39','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1700,'40','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1701,'41','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1702,'42','hello all','info','0','2026-09-15 12:14:58','ORG67207');
INSERT INTO "notifications" VALUES (1703,'43','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1704,'44','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1705,'45','hello all','info','0','2026-09-15 12:14:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (1706,'46','hello all','info','0','2026-09-15 12:14:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (1707,'47','hello all','info','0','2026-09-15 12:14:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (1708,'48','hello all','info','0','2026-09-15 12:14:58','2321');
INSERT INTO "notifications" VALUES (1709,'49','hello all','info','0','2026-09-15 12:14:58','2321');
INSERT INTO "notifications" VALUES (1710,'50','hello all','info','0','2026-09-15 12:14:58','ABC');
INSERT INTO "notifications" VALUES (1711,'51','hello all','info','0','2026-09-15 12:14:58','ABC');
INSERT INTO "notifications" VALUES (1712,'52','hello all','info','0','2026-09-15 12:14:58','PERS_1111');
INSERT INTO "notifications" VALUES (1713,'53','hello all','info','0','2026-09-15 12:14:58','SAS');
INSERT INTO "notifications" VALUES (1714,'55','hello all','info','0','2026-09-15 12:14:58','123');
INSERT INTO "notifications" VALUES (1715,'56','hello all','info','0','2026-09-15 12:14:58','123');
INSERT INTO "notifications" VALUES (1716,'57','hello all','info','0','2026-09-15 12:14:58','4343');
INSERT INTO "notifications" VALUES (1717,'9999','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1718,'9998','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1719,NULL,'hello all','info','0','2026-09-15 12:14:58','DL-140307');
INSERT INTO "notifications" VALUES (1720,NULL,'hello all','info','0','2026-09-15 12:14:58','library');
INSERT INTO "notifications" VALUES (1721,'10','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1722,'11','hello all','info','0','2026-09-15 12:14:58','SCH8912');
INSERT INTO "notifications" VALUES (1723,'12','hello all','info','0','2026-09-15 12:14:58','DPSGZB');
INSERT INTO "notifications" VALUES (1724,'13','hello all','info','0','2026-09-15 12:14:58','dps123');
INSERT INTO "notifications" VALUES (1725,'14','hello all','info','0','2026-09-15 12:14:58','dps123');
INSERT INTO "notifications" VALUES (1726,'17','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1727,'18','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1728,'19','hello all','info','0','2026-09-15 12:14:58','ORG33184');
INSERT INTO "notifications" VALUES (1729,'20','hello all','info','0','2026-09-15 12:14:58','SCH8259');
INSERT INTO "notifications" VALUES (1730,'21','hello all','info','0','2026-09-15 12:14:58','codex');
INSERT INTO "notifications" VALUES (1731,'22','hello all','info','0','2026-09-15 12:14:58','12345678');
INSERT INTO "notifications" VALUES (1732,'23','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1733,'24','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1734,'25','hello all','info','0','2026-09-15 12:14:58','AUTOTEST');
INSERT INTO "notifications" VALUES (1735,'26','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1736,'27','hello all','info','0','2026-09-15 12:14:58','SCH8259');
INSERT INTO "notifications" VALUES (1737,'28','hello all','info','0','2026-09-15 12:14:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (1738,'29','hello all','info','0','2026-09-15 12:14:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (1739,'30','hello all','info','0','2026-09-15 12:14:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (1740,'31','hello all','info','0','2026-09-15 12:14:58','PERS_1010');
INSERT INTO "notifications" VALUES (1741,'32','hello all','info','0','2026-09-15 12:14:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (1742,'33','hello all','info','0','2026-09-15 12:14:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (1743,'34','hello all','info','0','2026-09-15 12:14:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (1744,'35','hello all','info','0','2026-09-15 12:14:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (1745,'36','hello all','info','0','2026-09-15 12:14:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (1746,'37','hello all','info','0','2026-09-15 12:14:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (1747,'38','hello all','info','0','2026-09-15 12:14:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (1748,'39','hello all','info','0','2026-09-15 12:14:58','GLOBAL');
INSERT INTO "notifications" VALUES (1749,'40','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1750,'41','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1751,'42','hello all','info','0','2026-09-15 12:14:58','ORG67207');
INSERT INTO "notifications" VALUES (1752,'43','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1753,'44','hello all','info','0','2026-09-15 12:14:58','DPS123');
INSERT INTO "notifications" VALUES (1754,'45','hello all','info','0','2026-09-15 12:14:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (1755,'46','hello all','info','0','2026-09-15 12:14:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (1756,'47','hello all','info','0','2026-09-15 12:14:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (1757,'48','hello all','info','0','2026-09-15 12:14:58','2321');
INSERT INTO "notifications" VALUES (1758,'49','hello all','info','0','2026-09-15 12:14:58','2321');
INSERT INTO "notifications" VALUES (1759,'50','hello all','info','0','2026-09-15 12:14:58','ABC');
INSERT INTO "notifications" VALUES (1760,'51','hello all','info','0','2026-09-15 12:14:58','ABC');
INSERT INTO "notifications" VALUES (1761,'52','hello all','info','0','2026-09-15 12:14:58','PERS_1111');
INSERT INTO "notifications" VALUES (1762,'53','hello all','info','0','2026-09-15 12:14:58','SAS');
INSERT INTO "notifications" VALUES (1763,'55','hello all','info','0','2026-09-15 12:14:58','123');
INSERT INTO "notifications" VALUES (1764,'56','hello all','info','0','2026-09-15 12:14:58','123');
INSERT INTO "notifications" VALUES (1765,'57','hello all','info','0','2026-09-15 12:14:58','4343');
INSERT INTO "notifications" VALUES (1766,'9999','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1767,'9998','hello all','info','0','2026-09-15 12:14:58','00000');
INSERT INTO "notifications" VALUES (1768,NULL,'hello all','info','0','2026-09-15 12:14:58','DL-140307');
INSERT INTO "notifications" VALUES (1769,NULL,'hello all','info','0','2026-09-15 12:14:58','library');
INSERT INTO "notifications" VALUES (1770,'10','hello all','error','0','2026-09-15 12:16:40','00000');
INSERT INTO "notifications" VALUES (1771,'11','hello all','error','0','2026-09-15 12:16:40','SCH8912');
INSERT INTO "notifications" VALUES (1772,'12','hello all','error','0','2026-09-15 12:16:40','DPSGZB');
INSERT INTO "notifications" VALUES (1773,'13','hello all','error','0','2026-09-15 12:16:40','dps123');
INSERT INTO "notifications" VALUES (1774,'14','hello all','error','0','2026-09-15 12:16:40','dps123');
INSERT INTO "notifications" VALUES (1775,'17','hello all','error','0','2026-09-15 12:16:40','DPS123');
INSERT INTO "notifications" VALUES (1776,'18','hello all','error','0','2026-09-15 12:16:40','GLOBAL');
INSERT INTO "notifications" VALUES (1777,'19','hello all','error','0','2026-09-15 12:16:40','ORG33184');
INSERT INTO "notifications" VALUES (1778,'20','hello all','error','0','2026-09-15 12:16:40','SCH8259');
INSERT INTO "notifications" VALUES (1779,'21','hello all','error','0','2026-09-15 12:16:40','codex');
INSERT INTO "notifications" VALUES (1780,'22','hello all','error','0','2026-09-15 12:16:40','12345678');
INSERT INTO "notifications" VALUES (1781,'23','hello all','error','0','2026-09-15 12:16:40','AUTOTEST');
INSERT INTO "notifications" VALUES (1782,'24','hello all','error','0','2026-09-15 12:16:40','AUTOTEST');
INSERT INTO "notifications" VALUES (1783,'25','hello all','error','0','2026-09-15 12:16:40','AUTOTEST');
INSERT INTO "notifications" VALUES (1784,'26','hello all','error','0','2026-09-15 12:16:40','GLOBAL');
INSERT INTO "notifications" VALUES (1785,'27','hello all','error','0','2026-09-15 12:16:40','SCH8259');
INSERT INTO "notifications" VALUES (1786,'28','hello all','error','0','2026-09-15 12:16:40','PERS_1686430576');
INSERT INTO "notifications" VALUES (1787,'29','hello all','error','0','2026-09-15 12:16:40','PERS_1686469424');
INSERT INTO "notifications" VALUES (1788,'30','hello all','error','0','2026-09-15 12:16:40','PERS_1687169676');
INSERT INTO "notifications" VALUES (1789,'31','hello all','error','0','2026-09-15 12:16:40','PERS_1010');
INSERT INTO "notifications" VALUES (1790,'32','hello all','error','0','2026-09-15 12:16:40','PERS_1687915531');
INSERT INTO "notifications" VALUES (1791,'33','hello all','error','0','2026-09-15 12:16:40','PERS_1688425985');
INSERT INTO "notifications" VALUES (1792,'34','hello all','error','0','2026-09-15 12:16:40','PERS_1698080521');
INSERT INTO "notifications" VALUES (1793,'35','hello all','error','0','2026-09-15 12:16:40','PERS_1698635237');
INSERT INTO "notifications" VALUES (1794,'36','hello all','error','0','2026-09-15 12:16:40','PERS_1698664310');
INSERT INTO "notifications" VALUES (1795,'37','hello all','error','0','2026-09-15 12:16:40','PERS_1698985699');
INSERT INTO "notifications" VALUES (1796,'38','hello all','error','0','2026-09-15 12:16:40','PERS_1699721478');
INSERT INTO "notifications" VALUES (1797,'39','hello all','error','0','2026-09-15 12:16:40','GLOBAL');
INSERT INTO "notifications" VALUES (1798,'40','hello all','error','0','2026-09-15 12:16:40','DPS123');
INSERT INTO "notifications" VALUES (1799,'41','hello all','error','0','2026-09-15 12:16:40','DPS123');
INSERT INTO "notifications" VALUES (1800,'42','hello all','error','0','2026-09-15 12:16:40','ORG67207');
INSERT INTO "notifications" VALUES (1801,'43','hello all','error','0','2026-09-15 12:16:40','DPS123');
INSERT INTO "notifications" VALUES (1802,'44','hello all','error','0','2026-09-15 12:16:40','DPS123');
INSERT INTO "notifications" VALUES (1803,'45','hello all','error','0','2026-09-15 12:16:40','PERS_2220685710');
INSERT INTO "notifications" VALUES (1804,'46','hello all','error','0','2026-09-15 12:16:40','PERS_2220723439');
INSERT INTO "notifications" VALUES (1805,'47','hello all','error','0','2026-09-15 12:16:40','PERS_2221315654');
INSERT INTO "notifications" VALUES (1806,'48','hello all','error','0','2026-09-15 12:16:40','2321');
INSERT INTO "notifications" VALUES (1807,'49','hello all','error','0','2026-09-15 12:16:40','2321');
INSERT INTO "notifications" VALUES (1808,'50','hello all','error','0','2026-09-15 12:16:40','ABC');
INSERT INTO "notifications" VALUES (1809,'51','hello all','error','0','2026-09-15 12:16:40','ABC');
INSERT INTO "notifications" VALUES (1810,'52','hello all','error','0','2026-09-15 12:16:40','PERS_1111');
INSERT INTO "notifications" VALUES (1811,'53','hello all','error','0','2026-09-15 12:16:40','SAS');
INSERT INTO "notifications" VALUES (1812,'55','hello all','error','0','2026-09-15 12:16:40','123');
INSERT INTO "notifications" VALUES (1813,'56','hello all','error','0','2026-09-15 12:16:40','123');
INSERT INTO "notifications" VALUES (1814,'57','hello all','error','0','2026-09-15 12:16:40','4343');
INSERT INTO "notifications" VALUES (1815,'9999','hello all','error','0','2026-09-15 12:16:40','00000');
INSERT INTO "notifications" VALUES (1816,'9998','hello all','error','0','2026-09-15 12:16:40','00000');
INSERT INTO "notifications" VALUES (1817,NULL,'hello all','error','0','2026-09-15 12:16:40','DL-140307');
INSERT INTO "notifications" VALUES (1818,NULL,'hello all','error','0','2026-09-15 12:16:40','library');
INSERT INTO "notifications" VALUES (1819,'10','heheie','info','0','2026-09-15 12:16:56','00000');
INSERT INTO "notifications" VALUES (1820,'11','heheie','info','0','2026-09-15 12:16:56','SCH8912');
INSERT INTO "notifications" VALUES (1821,'12','heheie','info','0','2026-09-15 12:16:56','DPSGZB');
INSERT INTO "notifications" VALUES (1822,'13','heheie','info','0','2026-09-15 12:16:56','dps123');
INSERT INTO "notifications" VALUES (1823,'14','heheie','info','0','2026-09-15 12:16:56','dps123');
INSERT INTO "notifications" VALUES (1824,'17','heheie','info','0','2026-09-15 12:16:56','DPS123');
INSERT INTO "notifications" VALUES (1825,'18','heheie','info','0','2026-09-15 12:16:56','GLOBAL');
INSERT INTO "notifications" VALUES (1826,'19','heheie','info','0','2026-09-15 12:16:56','ORG33184');
INSERT INTO "notifications" VALUES (1827,'20','heheie','info','0','2026-09-15 12:16:56','SCH8259');
INSERT INTO "notifications" VALUES (1828,'21','heheie','info','0','2026-09-15 12:16:56','codex');
INSERT INTO "notifications" VALUES (1829,'22','heheie','info','0','2026-09-15 12:16:56','12345678');
INSERT INTO "notifications" VALUES (1830,'23','heheie','info','0','2026-09-15 12:16:56','AUTOTEST');
INSERT INTO "notifications" VALUES (1831,'24','heheie','info','0','2026-09-15 12:16:56','AUTOTEST');
INSERT INTO "notifications" VALUES (1832,'25','heheie','info','0','2026-09-15 12:16:56','AUTOTEST');
INSERT INTO "notifications" VALUES (1833,'26','heheie','info','0','2026-09-15 12:16:56','GLOBAL');
INSERT INTO "notifications" VALUES (1834,'27','heheie','info','0','2026-09-15 12:16:56','SCH8259');
INSERT INTO "notifications" VALUES (1835,'28','heheie','info','0','2026-09-15 12:16:56','PERS_1686430576');
INSERT INTO "notifications" VALUES (1836,'29','heheie','info','0','2026-09-15 12:16:56','PERS_1686469424');
INSERT INTO "notifications" VALUES (1837,'30','heheie','info','0','2026-09-15 12:16:56','PERS_1687169676');
INSERT INTO "notifications" VALUES (1838,'31','heheie','info','0','2026-09-15 12:16:56','PERS_1010');
INSERT INTO "notifications" VALUES (1839,'32','heheie','info','0','2026-09-15 12:16:56','PERS_1687915531');
INSERT INTO "notifications" VALUES (1840,'33','heheie','info','0','2026-09-15 12:16:56','PERS_1688425985');
INSERT INTO "notifications" VALUES (1841,'34','heheie','info','0','2026-09-15 12:16:56','PERS_1698080521');
INSERT INTO "notifications" VALUES (1842,'35','heheie','info','0','2026-09-15 12:16:56','PERS_1698635237');
INSERT INTO "notifications" VALUES (1843,'36','heheie','info','0','2026-09-15 12:16:56','PERS_1698664310');
INSERT INTO "notifications" VALUES (1844,'37','heheie','info','0','2026-09-15 12:16:56','PERS_1698985699');
INSERT INTO "notifications" VALUES (1845,'38','heheie','info','0','2026-09-15 12:16:56','PERS_1699721478');
INSERT INTO "notifications" VALUES (1846,'39','heheie','info','0','2026-09-15 12:16:56','GLOBAL');
INSERT INTO "notifications" VALUES (1847,'40','heheie','info','0','2026-09-15 12:16:56','DPS123');
INSERT INTO "notifications" VALUES (1848,'41','heheie','info','0','2026-09-15 12:16:56','DPS123');
INSERT INTO "notifications" VALUES (1849,'42','heheie','info','0','2026-09-15 12:16:56','ORG67207');
INSERT INTO "notifications" VALUES (1850,'43','heheie','info','0','2026-09-15 12:16:56','DPS123');
INSERT INTO "notifications" VALUES (1851,'44','heheie','info','0','2026-09-15 12:16:56','DPS123');
INSERT INTO "notifications" VALUES (1852,'45','heheie','info','0','2026-09-15 12:16:56','PERS_2220685710');
INSERT INTO "notifications" VALUES (1853,'46','heheie','info','0','2026-09-15 12:16:56','PERS_2220723439');
INSERT INTO "notifications" VALUES (1854,'47','heheie','info','0','2026-09-15 12:16:56','PERS_2221315654');
INSERT INTO "notifications" VALUES (1855,'48','heheie','info','0','2026-09-15 12:16:56','2321');
INSERT INTO "notifications" VALUES (1856,'49','heheie','info','0','2026-09-15 12:16:56','2321');
INSERT INTO "notifications" VALUES (1857,'50','heheie','info','0','2026-09-15 12:16:56','ABC');
INSERT INTO "notifications" VALUES (1858,'51','heheie','info','0','2026-09-15 12:16:56','ABC');
INSERT INTO "notifications" VALUES (1859,'52','heheie','info','0','2026-09-15 12:16:56','PERS_1111');
INSERT INTO "notifications" VALUES (1860,'53','heheie','info','0','2026-09-15 12:16:56','SAS');
INSERT INTO "notifications" VALUES (1861,'55','heheie','info','0','2026-09-15 12:16:56','123');
INSERT INTO "notifications" VALUES (1862,'56','heheie','info','0','2026-09-15 12:16:56','123');
INSERT INTO "notifications" VALUES (1863,'57','heheie','info','0','2026-09-15 12:16:56','4343');
INSERT INTO "notifications" VALUES (1864,'9999','heheie','info','0','2026-09-15 12:16:56','00000');
INSERT INTO "notifications" VALUES (1865,'9998','heheie','info','0','2026-09-15 12:16:56','00000');
INSERT INTO "notifications" VALUES (1866,NULL,'heheie','info','0','2026-09-15 12:16:56','DL-140307');
INSERT INTO "notifications" VALUES (1867,NULL,'heheie','info','0','2026-09-15 12:16:56','library');
INSERT INTO "notifications" VALUES (1868,'10','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (1869,'11','heheie','info','0','2026-09-15 12:16:57','SCH8912');
INSERT INTO "notifications" VALUES (1870,'12','heheie','info','0','2026-09-15 12:16:57','DPSGZB');
INSERT INTO "notifications" VALUES (1871,'13','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (1872,'14','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (1873,'17','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1874,'18','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1875,'19','heheie','info','0','2026-09-15 12:16:57','ORG33184');
INSERT INTO "notifications" VALUES (1876,'20','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (1877,'21','heheie','info','0','2026-09-15 12:16:57','codex');
INSERT INTO "notifications" VALUES (1878,'22','heheie','info','0','2026-09-15 12:16:57','12345678');
INSERT INTO "notifications" VALUES (1879,'23','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1880,'24','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1881,'25','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1882,'26','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1883,'27','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (1884,'28','heheie','info','0','2026-09-15 12:16:57','PERS_1686430576');
INSERT INTO "notifications" VALUES (1885,'29','heheie','info','0','2026-09-15 12:16:57','PERS_1686469424');
INSERT INTO "notifications" VALUES (1886,'30','heheie','info','0','2026-09-15 12:16:57','PERS_1687169676');
INSERT INTO "notifications" VALUES (1887,'31','heheie','info','0','2026-09-15 12:16:57','PERS_1010');
INSERT INTO "notifications" VALUES (1888,'32','heheie','info','0','2026-09-15 12:16:57','PERS_1687915531');
INSERT INTO "notifications" VALUES (1889,'33','heheie','info','0','2026-09-15 12:16:57','PERS_1688425985');
INSERT INTO "notifications" VALUES (1890,'34','heheie','info','0','2026-09-15 12:16:57','PERS_1698080521');
INSERT INTO "notifications" VALUES (1891,'35','heheie','info','0','2026-09-15 12:16:57','PERS_1698635237');
INSERT INTO "notifications" VALUES (1892,'36','heheie','info','0','2026-09-15 12:16:57','PERS_1698664310');
INSERT INTO "notifications" VALUES (1893,'37','heheie','info','0','2026-09-15 12:16:57','PERS_1698985699');
INSERT INTO "notifications" VALUES (1894,'38','heheie','info','0','2026-09-15 12:16:57','PERS_1699721478');
INSERT INTO "notifications" VALUES (1895,'39','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1896,'40','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1897,'41','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1898,'42','heheie','info','0','2026-09-15 12:16:57','ORG67207');
INSERT INTO "notifications" VALUES (1899,'43','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1900,'44','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1901,'45','heheie','info','0','2026-09-15 12:16:57','PERS_2220685710');
INSERT INTO "notifications" VALUES (1902,'46','heheie','info','0','2026-09-15 12:16:57','PERS_2220723439');
INSERT INTO "notifications" VALUES (1903,'47','heheie','info','0','2026-09-15 12:16:57','PERS_2221315654');
INSERT INTO "notifications" VALUES (1904,'48','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (1905,'49','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (1906,'50','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (1907,'51','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (1908,'52','heheie','info','0','2026-09-15 12:16:57','PERS_1111');
INSERT INTO "notifications" VALUES (1909,'53','heheie','info','0','2026-09-15 12:16:57','SAS');
INSERT INTO "notifications" VALUES (1910,'55','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (1911,'56','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (1912,'57','heheie','info','0','2026-09-15 12:16:57','4343');
INSERT INTO "notifications" VALUES (1913,'9999','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (1914,'9998','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (1915,NULL,'heheie','info','0','2026-09-15 12:16:57','DL-140307');
INSERT INTO "notifications" VALUES (1916,NULL,'heheie','info','0','2026-09-15 12:16:57','library');
INSERT INTO "notifications" VALUES (1917,'10','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (1918,'11','heheie','info','0','2026-09-15 12:16:57','SCH8912');
INSERT INTO "notifications" VALUES (1919,'12','heheie','info','0','2026-09-15 12:16:57','DPSGZB');
INSERT INTO "notifications" VALUES (1920,'13','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (1921,'14','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (1922,'17','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1923,'18','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1924,'19','heheie','info','0','2026-09-15 12:16:57','ORG33184');
INSERT INTO "notifications" VALUES (1925,'20','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (1926,'21','heheie','info','0','2026-09-15 12:16:57','codex');
INSERT INTO "notifications" VALUES (1927,'22','heheie','info','0','2026-09-15 12:16:57','12345678');
INSERT INTO "notifications" VALUES (1928,'23','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1929,'24','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1930,'25','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1931,'26','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1932,'27','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (1933,'28','heheie','info','0','2026-09-15 12:16:57','PERS_1686430576');
INSERT INTO "notifications" VALUES (1934,'29','heheie','info','0','2026-09-15 12:16:57','PERS_1686469424');
INSERT INTO "notifications" VALUES (1935,'30','heheie','info','0','2026-09-15 12:16:57','PERS_1687169676');
INSERT INTO "notifications" VALUES (1936,'31','heheie','info','0','2026-09-15 12:16:57','PERS_1010');
INSERT INTO "notifications" VALUES (1937,'32','heheie','info','0','2026-09-15 12:16:57','PERS_1687915531');
INSERT INTO "notifications" VALUES (1938,'33','heheie','info','0','2026-09-15 12:16:57','PERS_1688425985');
INSERT INTO "notifications" VALUES (1939,'34','heheie','info','0','2026-09-15 12:16:57','PERS_1698080521');
INSERT INTO "notifications" VALUES (1940,'35','heheie','info','0','2026-09-15 12:16:57','PERS_1698635237');
INSERT INTO "notifications" VALUES (1941,'36','heheie','info','0','2026-09-15 12:16:57','PERS_1698664310');
INSERT INTO "notifications" VALUES (1942,'37','heheie','info','0','2026-09-15 12:16:57','PERS_1698985699');
INSERT INTO "notifications" VALUES (1943,'38','heheie','info','0','2026-09-15 12:16:57','PERS_1699721478');
INSERT INTO "notifications" VALUES (1944,'39','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1945,'40','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1946,'41','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1947,'42','heheie','info','0','2026-09-15 12:16:57','ORG67207');
INSERT INTO "notifications" VALUES (1948,'43','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1949,'44','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1950,'45','heheie','info','0','2026-09-15 12:16:57','PERS_2220685710');
INSERT INTO "notifications" VALUES (1951,'46','heheie','info','0','2026-09-15 12:16:57','PERS_2220723439');
INSERT INTO "notifications" VALUES (1952,'47','heheie','info','0','2026-09-15 12:16:57','PERS_2221315654');
INSERT INTO "notifications" VALUES (1953,'48','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (1954,'49','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (1955,'50','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (1956,'51','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (1957,'52','heheie','info','0','2026-09-15 12:16:57','PERS_1111');
INSERT INTO "notifications" VALUES (1958,'53','heheie','info','0','2026-09-15 12:16:57','SAS');
INSERT INTO "notifications" VALUES (1959,'55','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (1960,'56','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (1961,'57','heheie','info','0','2026-09-15 12:16:57','4343');
INSERT INTO "notifications" VALUES (1962,'9999','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (1963,'9998','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (1964,NULL,'heheie','info','0','2026-09-15 12:16:57','DL-140307');
INSERT INTO "notifications" VALUES (1965,NULL,'heheie','info','0','2026-09-15 12:16:57','library');
INSERT INTO "notifications" VALUES (1966,'10','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (1967,'11','heheie','info','0','2026-09-15 12:16:57','SCH8912');
INSERT INTO "notifications" VALUES (1968,'12','heheie','info','0','2026-09-15 12:16:57','DPSGZB');
INSERT INTO "notifications" VALUES (1969,'13','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (1970,'14','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (1971,'17','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1972,'18','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1973,'19','heheie','info','0','2026-09-15 12:16:57','ORG33184');
INSERT INTO "notifications" VALUES (1974,'20','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (1975,'21','heheie','info','0','2026-09-15 12:16:57','codex');
INSERT INTO "notifications" VALUES (1976,'22','heheie','info','0','2026-09-15 12:16:57','12345678');
INSERT INTO "notifications" VALUES (1977,'23','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1978,'24','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1979,'25','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (1980,'26','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1981,'27','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (1982,'28','heheie','info','0','2026-09-15 12:16:57','PERS_1686430576');
INSERT INTO "notifications" VALUES (1983,'29','heheie','info','0','2026-09-15 12:16:57','PERS_1686469424');
INSERT INTO "notifications" VALUES (1984,'30','heheie','info','0','2026-09-15 12:16:57','PERS_1687169676');
INSERT INTO "notifications" VALUES (1985,'31','heheie','info','0','2026-09-15 12:16:57','PERS_1010');
INSERT INTO "notifications" VALUES (1986,'32','heheie','info','0','2026-09-15 12:16:57','PERS_1687915531');
INSERT INTO "notifications" VALUES (1987,'33','heheie','info','0','2026-09-15 12:16:57','PERS_1688425985');
INSERT INTO "notifications" VALUES (1988,'34','heheie','info','0','2026-09-15 12:16:57','PERS_1698080521');
INSERT INTO "notifications" VALUES (1989,'35','heheie','info','0','2026-09-15 12:16:57','PERS_1698635237');
INSERT INTO "notifications" VALUES (1990,'36','heheie','info','0','2026-09-15 12:16:57','PERS_1698664310');
INSERT INTO "notifications" VALUES (1991,'37','heheie','info','0','2026-09-15 12:16:57','PERS_1698985699');
INSERT INTO "notifications" VALUES (1992,'38','heheie','info','0','2026-09-15 12:16:57','PERS_1699721478');
INSERT INTO "notifications" VALUES (1993,'39','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (1994,'40','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1995,'41','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1996,'42','heheie','info','0','2026-09-15 12:16:57','ORG67207');
INSERT INTO "notifications" VALUES (1997,'43','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1998,'44','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (1999,'45','heheie','info','0','2026-09-15 12:16:57','PERS_2220685710');
INSERT INTO "notifications" VALUES (2000,'46','heheie','info','0','2026-09-15 12:16:57','PERS_2220723439');
INSERT INTO "notifications" VALUES (2001,'47','heheie','info','0','2026-09-15 12:16:57','PERS_2221315654');
INSERT INTO "notifications" VALUES (2002,'48','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (2003,'49','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (2004,'50','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (2005,'51','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (2006,'52','heheie','info','0','2026-09-15 12:16:57','PERS_1111');
INSERT INTO "notifications" VALUES (2007,'53','heheie','info','0','2026-09-15 12:16:57','SAS');
INSERT INTO "notifications" VALUES (2008,'55','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (2009,'56','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (2010,'57','heheie','info','0','2026-09-15 12:16:57','4343');
INSERT INTO "notifications" VALUES (2011,'9999','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (2012,'9998','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (2013,NULL,'heheie','info','0','2026-09-15 12:16:57','DL-140307');
INSERT INTO "notifications" VALUES (2014,NULL,'heheie','info','0','2026-09-15 12:16:57','library');
INSERT INTO "notifications" VALUES (2015,'10','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (2016,'11','heheie','info','0','2026-09-15 12:16:57','SCH8912');
INSERT INTO "notifications" VALUES (2017,'12','heheie','info','0','2026-09-15 12:16:57','DPSGZB');
INSERT INTO "notifications" VALUES (2018,'13','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (2019,'14','heheie','info','0','2026-09-15 12:16:57','dps123');
INSERT INTO "notifications" VALUES (2020,'17','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (2021,'18','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (2022,'19','heheie','info','0','2026-09-15 12:16:57','ORG33184');
INSERT INTO "notifications" VALUES (2023,'20','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (2024,'21','heheie','info','0','2026-09-15 12:16:57','codex');
INSERT INTO "notifications" VALUES (2025,'22','heheie','info','0','2026-09-15 12:16:57','12345678');
INSERT INTO "notifications" VALUES (2026,'23','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (2027,'24','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (2028,'25','heheie','info','0','2026-09-15 12:16:57','AUTOTEST');
INSERT INTO "notifications" VALUES (2029,'26','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (2030,'27','heheie','info','0','2026-09-15 12:16:57','SCH8259');
INSERT INTO "notifications" VALUES (2031,'28','heheie','info','0','2026-09-15 12:16:57','PERS_1686430576');
INSERT INTO "notifications" VALUES (2032,'29','heheie','info','0','2026-09-15 12:16:57','PERS_1686469424');
INSERT INTO "notifications" VALUES (2033,'30','heheie','info','0','2026-09-15 12:16:57','PERS_1687169676');
INSERT INTO "notifications" VALUES (2034,'31','heheie','info','0','2026-09-15 12:16:57','PERS_1010');
INSERT INTO "notifications" VALUES (2035,'32','heheie','info','0','2026-09-15 12:16:57','PERS_1687915531');
INSERT INTO "notifications" VALUES (2036,'33','heheie','info','0','2026-09-15 12:16:57','PERS_1688425985');
INSERT INTO "notifications" VALUES (2037,'34','heheie','info','0','2026-09-15 12:16:57','PERS_1698080521');
INSERT INTO "notifications" VALUES (2038,'35','heheie','info','0','2026-09-15 12:16:57','PERS_1698635237');
INSERT INTO "notifications" VALUES (2039,'36','heheie','info','0','2026-09-15 12:16:57','PERS_1698664310');
INSERT INTO "notifications" VALUES (2040,'37','heheie','info','0','2026-09-15 12:16:57','PERS_1698985699');
INSERT INTO "notifications" VALUES (2041,'38','heheie','info','0','2026-09-15 12:16:57','PERS_1699721478');
INSERT INTO "notifications" VALUES (2042,'39','heheie','info','0','2026-09-15 12:16:57','GLOBAL');
INSERT INTO "notifications" VALUES (2043,'40','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (2044,'41','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (2045,'42','heheie','info','0','2026-09-15 12:16:57','ORG67207');
INSERT INTO "notifications" VALUES (2046,'43','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (2047,'44','heheie','info','0','2026-09-15 12:16:57','DPS123');
INSERT INTO "notifications" VALUES (2048,'45','heheie','info','0','2026-09-15 12:16:57','PERS_2220685710');
INSERT INTO "notifications" VALUES (2049,'46','heheie','info','0','2026-09-15 12:16:57','PERS_2220723439');
INSERT INTO "notifications" VALUES (2050,'47','heheie','info','0','2026-09-15 12:16:57','PERS_2221315654');
INSERT INTO "notifications" VALUES (2051,'48','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (2052,'49','heheie','info','0','2026-09-15 12:16:57','2321');
INSERT INTO "notifications" VALUES (2053,'50','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (2054,'51','heheie','info','0','2026-09-15 12:16:57','ABC');
INSERT INTO "notifications" VALUES (2055,'52','heheie','info','0','2026-09-15 12:16:57','PERS_1111');
INSERT INTO "notifications" VALUES (2056,'53','heheie','info','0','2026-09-15 12:16:57','SAS');
INSERT INTO "notifications" VALUES (2057,'55','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (2058,'56','heheie','info','0','2026-09-15 12:16:57','123');
INSERT INTO "notifications" VALUES (2059,'57','heheie','info','0','2026-09-15 12:16:57','4343');
INSERT INTO "notifications" VALUES (2060,'9999','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (2061,'9998','heheie','info','0','2026-09-15 12:16:57','00000');
INSERT INTO "notifications" VALUES (2062,NULL,'heheie','info','0','2026-09-15 12:16:57','DL-140307');
INSERT INTO "notifications" VALUES (2063,NULL,'heheie','info','0','2026-09-15 12:16:57','library');
INSERT INTO "notifications" VALUES (2064,'10','heheie','info','0','2026-09-15 12:16:58','00000');
INSERT INTO "notifications" VALUES (2065,'11','heheie','info','0','2026-09-15 12:16:58','SCH8912');
INSERT INTO "notifications" VALUES (2066,'12','heheie','info','0','2026-09-15 12:16:58','DPSGZB');
INSERT INTO "notifications" VALUES (2067,'13','heheie','info','0','2026-09-15 12:16:58','dps123');
INSERT INTO "notifications" VALUES (2068,'14','heheie','info','0','2026-09-15 12:16:58','dps123');
INSERT INTO "notifications" VALUES (2069,'17','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2070,'18','heheie','info','0','2026-09-15 12:16:58','GLOBAL');
INSERT INTO "notifications" VALUES (2071,'19','heheie','info','0','2026-09-15 12:16:58','ORG33184');
INSERT INTO "notifications" VALUES (2072,'20','heheie','info','0','2026-09-15 12:16:58','SCH8259');
INSERT INTO "notifications" VALUES (2073,'21','heheie','info','0','2026-09-15 12:16:58','codex');
INSERT INTO "notifications" VALUES (2074,'22','heheie','info','0','2026-09-15 12:16:58','12345678');
INSERT INTO "notifications" VALUES (2075,'23','heheie','info','0','2026-09-15 12:16:58','AUTOTEST');
INSERT INTO "notifications" VALUES (2076,'24','heheie','info','0','2026-09-15 12:16:58','AUTOTEST');
INSERT INTO "notifications" VALUES (2077,'25','heheie','info','0','2026-09-15 12:16:58','AUTOTEST');
INSERT INTO "notifications" VALUES (2078,'26','heheie','info','0','2026-09-15 12:16:58','GLOBAL');
INSERT INTO "notifications" VALUES (2079,'27','heheie','info','0','2026-09-15 12:16:58','SCH8259');
INSERT INTO "notifications" VALUES (2080,'28','heheie','info','0','2026-09-15 12:16:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (2081,'29','heheie','info','0','2026-09-15 12:16:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (2082,'30','heheie','info','0','2026-09-15 12:16:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (2083,'31','heheie','info','0','2026-09-15 12:16:58','PERS_1010');
INSERT INTO "notifications" VALUES (2084,'32','heheie','info','0','2026-09-15 12:16:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (2085,'33','heheie','info','0','2026-09-15 12:16:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (2086,'34','heheie','info','0','2026-09-15 12:16:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (2087,'35','heheie','info','0','2026-09-15 12:16:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (2088,'36','heheie','info','0','2026-09-15 12:16:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (2089,'37','heheie','info','0','2026-09-15 12:16:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (2090,'38','heheie','info','0','2026-09-15 12:16:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (2091,'39','heheie','info','0','2026-09-15 12:16:58','GLOBAL');
INSERT INTO "notifications" VALUES (2092,'40','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2093,'41','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2094,'42','heheie','info','0','2026-09-15 12:16:58','ORG67207');
INSERT INTO "notifications" VALUES (2095,'43','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2096,'44','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2097,'45','heheie','info','0','2026-09-15 12:16:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (2098,'46','heheie','info','0','2026-09-15 12:16:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (2099,'47','heheie','info','0','2026-09-15 12:16:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (2100,'48','heheie','info','0','2026-09-15 12:16:58','2321');
INSERT INTO "notifications" VALUES (2101,'49','heheie','info','0','2026-09-15 12:16:58','2321');
INSERT INTO "notifications" VALUES (2102,'50','heheie','info','0','2026-09-15 12:16:58','ABC');
INSERT INTO "notifications" VALUES (2103,'51','heheie','info','0','2026-09-15 12:16:58','ABC');
INSERT INTO "notifications" VALUES (2104,'52','heheie','info','0','2026-09-15 12:16:58','PERS_1111');
INSERT INTO "notifications" VALUES (2105,'53','heheie','info','0','2026-09-15 12:16:58','SAS');
INSERT INTO "notifications" VALUES (2106,'55','heheie','info','0','2026-09-15 12:16:58','123');
INSERT INTO "notifications" VALUES (2107,'56','heheie','info','0','2026-09-15 12:16:58','123');
INSERT INTO "notifications" VALUES (2108,'57','heheie','info','0','2026-09-15 12:16:58','4343');
INSERT INTO "notifications" VALUES (2109,'9999','heheie','info','0','2026-09-15 12:16:58','00000');
INSERT INTO "notifications" VALUES (2110,'9998','heheie','info','0','2026-09-15 12:16:58','00000');
INSERT INTO "notifications" VALUES (2111,NULL,'heheie','info','0','2026-09-15 12:16:58','DL-140307');
INSERT INTO "notifications" VALUES (2112,NULL,'heheie','info','0','2026-09-15 12:16:58','library');
INSERT INTO "notifications" VALUES (2113,'10','heheie','info','0','2026-09-15 12:16:58','00000');
INSERT INTO "notifications" VALUES (2114,'11','heheie','info','0','2026-09-15 12:16:58','SCH8912');
INSERT INTO "notifications" VALUES (2115,'12','heheie','info','0','2026-09-15 12:16:58','DPSGZB');
INSERT INTO "notifications" VALUES (2116,'13','heheie','info','0','2026-09-15 12:16:58','dps123');
INSERT INTO "notifications" VALUES (2117,'14','heheie','info','0','2026-09-15 12:16:58','dps123');
INSERT INTO "notifications" VALUES (2118,'17','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2119,'18','heheie','info','0','2026-09-15 12:16:58','GLOBAL');
INSERT INTO "notifications" VALUES (2120,'19','heheie','info','0','2026-09-15 12:16:58','ORG33184');
INSERT INTO "notifications" VALUES (2121,'20','heheie','info','0','2026-09-15 12:16:58','SCH8259');
INSERT INTO "notifications" VALUES (2122,'21','heheie','info','0','2026-09-15 12:16:58','codex');
INSERT INTO "notifications" VALUES (2123,'22','heheie','info','0','2026-09-15 12:16:58','12345678');
INSERT INTO "notifications" VALUES (2124,'23','heheie','info','0','2026-09-15 12:16:58','AUTOTEST');
INSERT INTO "notifications" VALUES (2125,'24','heheie','info','0','2026-09-15 12:16:58','AUTOTEST');
INSERT INTO "notifications" VALUES (2126,'25','heheie','info','0','2026-09-15 12:16:58','AUTOTEST');
INSERT INTO "notifications" VALUES (2127,'26','heheie','info','0','2026-09-15 12:16:58','GLOBAL');
INSERT INTO "notifications" VALUES (2128,'27','heheie','info','0','2026-09-15 12:16:58','SCH8259');
INSERT INTO "notifications" VALUES (2129,'28','heheie','info','0','2026-09-15 12:16:58','PERS_1686430576');
INSERT INTO "notifications" VALUES (2130,'29','heheie','info','0','2026-09-15 12:16:58','PERS_1686469424');
INSERT INTO "notifications" VALUES (2131,'30','heheie','info','0','2026-09-15 12:16:58','PERS_1687169676');
INSERT INTO "notifications" VALUES (2132,'31','heheie','info','0','2026-09-15 12:16:58','PERS_1010');
INSERT INTO "notifications" VALUES (2133,'32','heheie','info','0','2026-09-15 12:16:58','PERS_1687915531');
INSERT INTO "notifications" VALUES (2134,'33','heheie','info','0','2026-09-15 12:16:58','PERS_1688425985');
INSERT INTO "notifications" VALUES (2135,'34','heheie','info','0','2026-09-15 12:16:58','PERS_1698080521');
INSERT INTO "notifications" VALUES (2136,'35','heheie','info','0','2026-09-15 12:16:58','PERS_1698635237');
INSERT INTO "notifications" VALUES (2137,'36','heheie','info','0','2026-09-15 12:16:58','PERS_1698664310');
INSERT INTO "notifications" VALUES (2138,'37','heheie','info','0','2026-09-15 12:16:58','PERS_1698985699');
INSERT INTO "notifications" VALUES (2139,'38','heheie','info','0','2026-09-15 12:16:58','PERS_1699721478');
INSERT INTO "notifications" VALUES (2140,'39','heheie','info','0','2026-09-15 12:16:58','GLOBAL');
INSERT INTO "notifications" VALUES (2141,'40','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2142,'41','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2143,'42','heheie','info','0','2026-09-15 12:16:58','ORG67207');
INSERT INTO "notifications" VALUES (2144,'43','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2145,'44','heheie','info','0','2026-09-15 12:16:58','DPS123');
INSERT INTO "notifications" VALUES (2146,'45','heheie','info','0','2026-09-15 12:16:58','PERS_2220685710');
INSERT INTO "notifications" VALUES (2147,'46','heheie','info','0','2026-09-15 12:16:58','PERS_2220723439');
INSERT INTO "notifications" VALUES (2148,'47','heheie','info','0','2026-09-15 12:16:58','PERS_2221315654');
INSERT INTO "notifications" VALUES (2149,'48','heheie','info','0','2026-09-15 12:16:58','2321');
INSERT INTO "notifications" VALUES (2150,'49','heheie','info','0','2026-09-15 12:16:58','2321');
INSERT INTO "notifications" VALUES (2151,'50','heheie','info','0','2026-09-15 12:16:58','ABC');
INSERT INTO "notifications" VALUES (2152,'51','heheie','info','0','2026-09-15 12:16:58','ABC');
INSERT INTO "notifications" VALUES (2153,'52','heheie','info','0','2026-09-15 12:16:58','PERS_1111');
INSERT INTO "notifications" VALUES (2154,'53','heheie','info','0','2026-09-15 12:16:58','SAS');
INSERT INTO "notifications" VALUES (2155,'55','heheie','info','0','2026-09-15 12:16:58','123');
INSERT INTO "notifications" VALUES (2156,'56','heheie','info','0','2026-09-15 12:16:58','123');
INSERT INTO "notifications" VALUES (2157,'57','heheie','info','0','2026-09-15 12:16:58','4343');
INSERT INTO "notifications" VALUES (2158,'9999','heheie','info','0','2026-09-15 12:16:58','00000');
INSERT INTO "notifications" VALUES (2159,'9998','heheie','info','0','2026-09-15 12:16:58','00000');
INSERT INTO "notifications" VALUES (2160,NULL,'heheie','info','0','2026-09-15 12:16:58','DL-140307');
INSERT INTO "notifications" VALUES (2161,NULL,'heheie','info','0','2026-09-15 12:16:58','library');
INSERT INTO "notifications" VALUES (2162,'10','heheie','info','0','2026-09-15 12:17:24','00000');
INSERT INTO "notifications" VALUES (2163,'11','heheie','info','0','2026-09-15 12:17:24','SCH8912');
INSERT INTO "notifications" VALUES (2164,'12','heheie','info','0','2026-09-15 12:17:24','DPSGZB');
INSERT INTO "notifications" VALUES (2165,'13','heheie','info','0','2026-09-15 12:17:24','dps123');
INSERT INTO "notifications" VALUES (2166,'14','heheie','info','0','2026-09-15 12:17:24','dps123');
INSERT INTO "notifications" VALUES (2167,'17','heheie','info','0','2026-09-15 12:17:24','DPS123');
INSERT INTO "notifications" VALUES (2168,'18','heheie','info','0','2026-09-15 12:17:24','GLOBAL');
INSERT INTO "notifications" VALUES (2169,'19','heheie','info','0','2026-09-15 12:17:24','ORG33184');
INSERT INTO "notifications" VALUES (2170,'20','heheie','info','0','2026-09-15 12:17:24','SCH8259');
INSERT INTO "notifications" VALUES (2171,'21','heheie','info','0','2026-09-15 12:17:24','codex');
INSERT INTO "notifications" VALUES (2172,'22','heheie','info','0','2026-09-15 12:17:24','12345678');
INSERT INTO "notifications" VALUES (2173,'23','heheie','info','0','2026-09-15 12:17:24','AUTOTEST');
INSERT INTO "notifications" VALUES (2174,'24','heheie','info','0','2026-09-15 12:17:24','AUTOTEST');
INSERT INTO "notifications" VALUES (2175,'25','heheie','info','0','2026-09-15 12:17:24','AUTOTEST');
INSERT INTO "notifications" VALUES (2176,'26','heheie','info','0','2026-09-15 12:17:24','GLOBAL');
INSERT INTO "notifications" VALUES (2177,'27','heheie','info','0','2026-09-15 12:17:24','SCH8259');
INSERT INTO "notifications" VALUES (2178,'28','heheie','info','0','2026-09-15 12:17:24','PERS_1686430576');
INSERT INTO "notifications" VALUES (2179,'29','heheie','info','0','2026-09-15 12:17:24','PERS_1686469424');
INSERT INTO "notifications" VALUES (2180,'30','heheie','info','0','2026-09-15 12:17:24','PERS_1687169676');
INSERT INTO "notifications" VALUES (2181,'31','heheie','info','0','2026-09-15 12:17:24','PERS_1010');
INSERT INTO "notifications" VALUES (2182,'32','heheie','info','0','2026-09-15 12:17:24','PERS_1687915531');
INSERT INTO "notifications" VALUES (2183,'33','heheie','info','0','2026-09-15 12:17:24','PERS_1688425985');
INSERT INTO "notifications" VALUES (2184,'34','heheie','info','0','2026-09-15 12:17:24','PERS_1698080521');
INSERT INTO "notifications" VALUES (2185,'35','heheie','info','0','2026-09-15 12:17:24','PERS_1698635237');
INSERT INTO "notifications" VALUES (2186,'36','heheie','info','0','2026-09-15 12:17:24','PERS_1698664310');
INSERT INTO "notifications" VALUES (2187,'37','heheie','info','0','2026-09-15 12:17:24','PERS_1698985699');
INSERT INTO "notifications" VALUES (2188,'38','heheie','info','0','2026-09-15 12:17:24','PERS_1699721478');
INSERT INTO "notifications" VALUES (2189,'39','heheie','info','0','2026-09-15 12:17:24','GLOBAL');
INSERT INTO "notifications" VALUES (2190,'40','heheie','info','0','2026-09-15 12:17:24','DPS123');
INSERT INTO "notifications" VALUES (2191,'41','heheie','info','0','2026-09-15 12:17:24','DPS123');
INSERT INTO "notifications" VALUES (2192,'42','heheie','info','0','2026-09-15 12:17:24','ORG67207');
INSERT INTO "notifications" VALUES (2193,'43','heheie','info','0','2026-09-15 12:17:24','DPS123');
INSERT INTO "notifications" VALUES (2194,'44','heheie','info','0','2026-09-15 12:17:24','DPS123');
INSERT INTO "notifications" VALUES (2195,'45','heheie','info','0','2026-09-15 12:17:24','PERS_2220685710');
INSERT INTO "notifications" VALUES (2196,'46','heheie','info','0','2026-09-15 12:17:24','PERS_2220723439');
INSERT INTO "notifications" VALUES (2197,'47','heheie','info','0','2026-09-15 12:17:24','PERS_2221315654');
INSERT INTO "notifications" VALUES (2198,'48','heheie','info','0','2026-09-15 12:17:24','2321');
INSERT INTO "notifications" VALUES (2199,'49','heheie','info','0','2026-09-15 12:17:24','2321');
INSERT INTO "notifications" VALUES (2200,'50','heheie','info','0','2026-09-15 12:17:24','ABC');
INSERT INTO "notifications" VALUES (2201,'51','heheie','info','0','2026-09-15 12:17:24','ABC');
INSERT INTO "notifications" VALUES (2202,'52','heheie','info','0','2026-09-15 12:17:24','PERS_1111');
INSERT INTO "notifications" VALUES (2203,'53','heheie','info','0','2026-09-15 12:17:24','SAS');
INSERT INTO "notifications" VALUES (2204,'55','heheie','info','0','2026-09-15 12:17:24','123');
INSERT INTO "notifications" VALUES (2205,'56','heheie','info','0','2026-09-15 12:17:24','123');
INSERT INTO "notifications" VALUES (2206,'57','heheie','info','0','2026-09-15 12:17:24','4343');
INSERT INTO "notifications" VALUES (2207,'9999','heheie','info','0','2026-09-15 12:17:24','00000');
INSERT INTO "notifications" VALUES (2208,'9998','heheie','info','0','2026-09-15 12:17:24','00000');
INSERT INTO "notifications" VALUES (2209,NULL,'heheie','info','0','2026-09-15 12:17:24','DL-140307');
INSERT INTO "notifications" VALUES (2210,NULL,'heheie','info','0','2026-09-15 12:17:24','library');
INSERT INTO "notifications" VALUES (2211,'1','test','info','0','2026-09-15 12:21:00','GLOBAL');
INSERT INTO "notifications" VALUES (2212,'10','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','00000');
INSERT INTO "notifications" VALUES (2213,'11','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','SCH8912');
INSERT INTO "notifications" VALUES (2214,'12','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','DPSGZB');
INSERT INTO "notifications" VALUES (2215,'13','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','dps123');
INSERT INTO "notifications" VALUES (2216,'14','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','dps123');
INSERT INTO "notifications" VALUES (2217,'17','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','DPS123');
INSERT INTO "notifications" VALUES (2218,'18','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','GLOBAL');
INSERT INTO "notifications" VALUES (2219,'19','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','ORG33184');
INSERT INTO "notifications" VALUES (2220,'20','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','SCH8259');
INSERT INTO "notifications" VALUES (2221,'21','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','codex');
INSERT INTO "notifications" VALUES (2222,'22','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','12345678');
INSERT INTO "notifications" VALUES (2223,'23','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','AUTOTEST');
INSERT INTO "notifications" VALUES (2224,'24','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','AUTOTEST');
INSERT INTO "notifications" VALUES (2225,'25','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','AUTOTEST');
INSERT INTO "notifications" VALUES (2226,'26','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','GLOBAL');
INSERT INTO "notifications" VALUES (2227,'27','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','SCH8259');
INSERT INTO "notifications" VALUES (2228,'28','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1686430576');
INSERT INTO "notifications" VALUES (2229,'29','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1686469424');
INSERT INTO "notifications" VALUES (2230,'30','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1687169676');
INSERT INTO "notifications" VALUES (2231,'31','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1010');
INSERT INTO "notifications" VALUES (2232,'32','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1687915531');
INSERT INTO "notifications" VALUES (2233,'33','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1688425985');
INSERT INTO "notifications" VALUES (2234,'34','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1698080521');
INSERT INTO "notifications" VALUES (2235,'35','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1698635237');
INSERT INTO "notifications" VALUES (2236,'36','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1698664310');
INSERT INTO "notifications" VALUES (2237,'37','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1698985699');
INSERT INTO "notifications" VALUES (2238,'38','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1699721478');
INSERT INTO "notifications" VALUES (2239,'39','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','GLOBAL');
INSERT INTO "notifications" VALUES (2240,'40','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','DPS123');
INSERT INTO "notifications" VALUES (2241,'41','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','DPS123');
INSERT INTO "notifications" VALUES (2242,'42','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','ORG67207');
INSERT INTO "notifications" VALUES (2243,'43','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','DPS123');
INSERT INTO "notifications" VALUES (2244,'44','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','DPS123');
INSERT INTO "notifications" VALUES (2245,'45','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_2220685710');
INSERT INTO "notifications" VALUES (2246,'46','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_2220723439');
INSERT INTO "notifications" VALUES (2247,'47','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_2221315654');
INSERT INTO "notifications" VALUES (2248,'48','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','2321');
INSERT INTO "notifications" VALUES (2249,'49','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','2321');
INSERT INTO "notifications" VALUES (2250,'50','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','ABC');
INSERT INTO "notifications" VALUES (2251,'51','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','ABC');
INSERT INTO "notifications" VALUES (2252,'52','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','PERS_1111');
INSERT INTO "notifications" VALUES (2253,'53','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','SAS');
INSERT INTO "notifications" VALUES (2254,'55','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','123');
INSERT INTO "notifications" VALUES (2255,'56','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','123');
INSERT INTO "notifications" VALUES (2256,'57','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','4343');
INSERT INTO "notifications" VALUES (2257,'9999','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','00000');
INSERT INTO "notifications" VALUES (2258,'9998','Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','00000');
INSERT INTO "notifications" VALUES (2259,NULL,'Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','DL-140307');
INSERT INTO "notifications" VALUES (2260,NULL,'Hello! This is a demo broadcast notification sent to all roles and devices across Librika.','info','0','2026-09-15 19:44:03','library');
INSERT INTO "notifications" VALUES (2261,'10','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','00000');
INSERT INTO "notifications" VALUES (2262,'11','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','SCH8912');
INSERT INTO "notifications" VALUES (2263,'12','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','DPSGZB');
INSERT INTO "notifications" VALUES (2264,'13','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','dps123');
INSERT INTO "notifications" VALUES (2265,'14','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','dps123');
INSERT INTO "notifications" VALUES (2266,'17','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','DPS123');
INSERT INTO "notifications" VALUES (2267,'18','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','GLOBAL');
INSERT INTO "notifications" VALUES (2268,'19','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','ORG33184');
INSERT INTO "notifications" VALUES (2269,'20','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','SCH8259');
INSERT INTO "notifications" VALUES (2270,'21','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','codex');
INSERT INTO "notifications" VALUES (2271,'22','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','12345678');
INSERT INTO "notifications" VALUES (2272,'23','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','AUTOTEST');
INSERT INTO "notifications" VALUES (2273,'24','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','AUTOTEST');
INSERT INTO "notifications" VALUES (2274,'25','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','AUTOTEST');
INSERT INTO "notifications" VALUES (2275,'26','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','GLOBAL');
INSERT INTO "notifications" VALUES (2276,'27','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','SCH8259');
INSERT INTO "notifications" VALUES (2277,'28','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1686430576');
INSERT INTO "notifications" VALUES (2278,'29','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1686469424');
INSERT INTO "notifications" VALUES (2279,'30','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1687169676');
INSERT INTO "notifications" VALUES (2280,'31','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1010');
INSERT INTO "notifications" VALUES (2281,'32','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1687915531');
INSERT INTO "notifications" VALUES (2282,'33','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1688425985');
INSERT INTO "notifications" VALUES (2283,'34','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1698080521');
INSERT INTO "notifications" VALUES (2284,'35','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1698635237');
INSERT INTO "notifications" VALUES (2285,'36','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1698664310');
INSERT INTO "notifications" VALUES (2286,'37','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1698985699');
INSERT INTO "notifications" VALUES (2287,'38','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1699721478');
INSERT INTO "notifications" VALUES (2288,'39','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','GLOBAL');
INSERT INTO "notifications" VALUES (2289,'40','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','DPS123');
INSERT INTO "notifications" VALUES (2290,'41','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','DPS123');
INSERT INTO "notifications" VALUES (2291,'42','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','ORG67207');
INSERT INTO "notifications" VALUES (2292,'43','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','DPS123');
INSERT INTO "notifications" VALUES (2293,'44','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','DPS123');
INSERT INTO "notifications" VALUES (2294,'45','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_2220685710');
INSERT INTO "notifications" VALUES (2295,'46','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_2220723439');
INSERT INTO "notifications" VALUES (2296,'47','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_2221315654');
INSERT INTO "notifications" VALUES (2297,'48','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','2321');
INSERT INTO "notifications" VALUES (2298,'49','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','2321');
INSERT INTO "notifications" VALUES (2299,'50','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','ABC');
INSERT INTO "notifications" VALUES (2300,'51','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','ABC');
INSERT INTO "notifications" VALUES (2301,'52','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','PERS_1111');
INSERT INTO "notifications" VALUES (2302,'53','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','SAS');
INSERT INTO "notifications" VALUES (2303,'55','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','123');
INSERT INTO "notifications" VALUES (2304,'56','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','123');
INSERT INTO "notifications" VALUES (2305,'57','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','4343');
INSERT INTO "notifications" VALUES (2306,'9999','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','00000');
INSERT INTO "notifications" VALUES (2307,'9998','Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','00000');
INSERT INTO "notifications" VALUES (2308,NULL,'Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','DL-140307');
INSERT INTO "notifications" VALUES (2309,NULL,'Test Broadcast #2: Real-time multi-device notification sent to all roles!','success','0','2026-09-15 19:46:10','library');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "offline_book_readings" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "student_id" bigint(20) unsigned NOT NULL,
  "book_id" bigint(20) unsigned NOT NULL,
  "transaction_id" bigint(20) unsigned DEFAULT NULL,
  "school_code" varchar(50) DEFAULT 'DPS123',
  "issue_date" datetime NOT NULL,
  "due_date" datetime NOT NULL,
  "return_date" datetime DEFAULT NULL,
  "return_status" varchar(30) DEFAULT 'ISSUED',
  "late_days" int(11) DEFAULT 0,
  "quiz_status" varchar(30) DEFAULT 'LOCKED',
  "quiz_eligible_at" datetime DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  KEY "idx_obr_student" ("student_id"),
  KEY "idx_obr_book" ("book_id"),
  KEY "idx_obr_school" ("school_code"),
  KEY "idx_obr_quiz_status" ("quiz_status")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "organization_requests" (
  "id" longtext DEFAULT NULL,
  "org_name" longtext DEFAULT NULL,
  "contact_person" longtext DEFAULT NULL,
  "email" longtext DEFAULT NULL,
  "phone" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "organization_requests" VALUES ('1','abc','Ayushman Gupta','ayushmangupta003@gmail.com','123','Approved','2026-06-16 10:19:20');
INSERT INTO "organization_requests" VALUES ('2','UKG','Sudip Chakraborty','sudip.chakraborty@ukg.com','09999243533','Approved','2026-06-20 17:32:57');
INSERT INTO "organization_requests" VALUES ('3','ABC','123','ayushmangupta003@gmail.com','09354713610','pending','2026-06-24 11:47:47');
INSERT INTO "organization_requests" VALUES ('4','N/A','Ayushman Gupta','ayushmangupta003@gmail.com','09354713610','pending','2026-06-29 10:22:55');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "permissions" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "module" varchar(50) NOT NULL,
  "feature" varchar(50) NOT NULL,
  "action" varchar(50) NOT NULL,
  "code" varchar(100) NOT NULL,
  "name" varchar(150) NOT NULL,
  "description" varchar(255) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "code" ("code")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "permissions" VALUES (1,'dashboard','Overview','View','dashboard.view','View Dashboard','View dashboard overview and KPI statistics','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (2,'dashboard','Analytics','View','dashboard.analytics','View Analytics','View analytical charts and trends','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (3,'users','Directory','View','users.view','View Users','Browse and search user directory','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (4,'users','Account','Create','users.create','Create User','Register new students, teachers, and staff','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (5,'users','Profile','Edit','users.edit','Edit User Profile','Modify personal, academic, and contact details','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (6,'users','Status','Disable','users.disable','Disable / Suspend User','Suspend or ban user accounts','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (7,'users','Status','Delete','users.delete','Delete User','Soft-delete user accounts','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (8,'users','Status','Restore','users.restore','Restore User','Restore soft-deleted user accounts','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (9,'users','Roles','Assign','users.change_role','Change User Role','Assign or modify user roles','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (10,'users','Permissions','Manage','users.manage_perms','Manage User Permissions','Grant or revoke custom permissions','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (11,'users','Activity','View','users.view_activity','View User Activity','Inspect user activity timeline and login logs','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (12,'users','Data','Export','users.export','Export Users','Export user directory to CSV','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (13,'users','Data','Import','users.import','Import Users','Bulk import users from validated CSV','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (14,'books','Catalog','View','books.view','View Books','Browse and search physical book catalog','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (15,'books','Catalog','Add','books.add','Add New Book','Register new books via 3 input modes','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (16,'books','Catalog','Edit','books.edit','Edit Book','Modify book metadata, copies, and location','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (17,'books','Catalog','Delete','books.delete','Delete Book','Remove books from library catalog','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (18,'books','Catalog','Restore','books.restore','Restore Book','Restore deleted books','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (19,'books','Data','Export','books.export','Export Books','Export library catalog to CSV','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (20,'books','Data','Import','books.import','Import Books','Bulk import books from CSV','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (21,'circulation','Issue','Execute','circulation.issue','Issue Book','Checkout books to students and staff','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (22,'circulation','Return','Execute','circulation.return','Return Book','Inspect condition, check fines, and complete returns','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (23,'circulation','Renew','Execute','circulation.renew','Renew Book','Extend book loan period','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (24,'circulation','History','View','circulation.view_tx','View Transactions','Access full circulation loan history','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (25,'circulation','Fines','Manage','circulation.fines','Manage Fines','View, settle, or waive library fines','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (26,'digital','Content','View','digital.view','View Digital Content','Browse e-books and study materials','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (27,'digital','Content','Upload','digital.upload','Upload Digital Content','Publish e-books, documents, and videos','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (28,'digital','Content','Delete','digital.delete','Delete Digital Content','Remove digital vault items','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (29,'quizzes','Quizzes','View','quizzes.view','View Quizzes','Browse library reading quizzes','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (30,'quizzes','Quizzes','Create','quizzes.create','Create Quiz','Author new quizzes and questions','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (31,'quizzes','Quizzes','Edit','quizzes.edit','Edit Quiz','Modify questions and passing criteria','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (32,'quizzes','Quizzes','Delete','quizzes.delete','Delete Quiz','Remove quizzes','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (33,'quizzes','Results','View','quizzes.results','View Quiz Results','Analyze student quiz attempts and scores','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (34,'sessions','Sessions','View','sessions.view','View Sessions','View scheduled live classes','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (35,'sessions','Sessions','Create','sessions.create','Create Session','Host live classrooms via Jitsi','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (36,'sessions','Sessions','Manage','sessions.manage','Manage Participants','Control student entry and attendance','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (37,'comms','Announcements','Send','comms.announcements','Send Announcements','Broadcast school and library notices','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (38,'comms','Notifications','Send','comms.notifications','Send Notifications','Send targeted push and in-app alerts','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (39,'reports','Reports','View','reports.view','View Reports','Access library, reader, and inventory reports','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (40,'reports','Reports','Export','reports.export','Export Reports','Download analytics and report summaries','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (41,'settings','System','Manage','settings.system','Manage System Settings','Configure platform settings and integrations','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (42,'settings','School','Manage','settings.school','Manage School Rules','Configure fine rates, loan days, and limits','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (43,'security','Audit','View','security.audit_logs','View Audit Logs','Inspect administrative and security logs','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (44,'security','Roles','Manage','security.roles','Manage Roles','Create, clone, edit, and delete roles','2026-09-26 10:40:06');
INSERT INTO "permissions" VALUES (45,'security','Permissions','Manage','security.permissions','Manage Permissions','Configure global permission mappings','2026-09-26 10:40:06');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_activity_logs" (
  "id" longtext DEFAULT NULL,
  "owner_id" longtext DEFAULT NULL,
  "action" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "personal_activity_logs" VALUES ('2','28','Created Personal Library account','2026-06-17 14:23');
INSERT INTO "personal_activity_logs" VALUES ('3','29','Created Personal Library account','2026-06-17 14:24');
INSERT INTO "personal_activity_logs" VALUES ('4','30','Created Personal Library account','2026-06-17 14:36');
INSERT INTO "personal_activity_logs" VALUES ('5','31','Created Personal Library account','2026-06-17 09:12');
INSERT INTO "personal_activity_logs" VALUES ('6','32','Created Personal Library account','2026-06-17 14:48');
INSERT INTO "personal_activity_logs" VALUES ('7','33','Created Personal Library account','2026-06-17 14:57');
INSERT INTO "personal_activity_logs" VALUES ('8','34','Created Personal Library account','2026-06-17 17:38');
INSERT INTO "personal_activity_logs" VALUES ('9','35','Created Personal Library account','2026-06-17 17:47');
INSERT INTO "personal_activity_logs" VALUES ('10','36','Created Personal Library account','2026-06-17 17:47');
INSERT INTO "personal_activity_logs" VALUES ('11','37','Created Personal Library account','2026-06-17 17:53');
INSERT INTO "personal_activity_logs" VALUES ('12','38','Created Personal Library account','2026-06-17 18:05');
INSERT INTO "personal_activity_logs" VALUES ('13','31','Changed subscription plan to PRO','2026-06-17 12:53');
INSERT INTO "personal_activity_logs" VALUES ('14','31','Published digital book: \'Abc\'','2026-06-20 17:27');
INSERT INTO "personal_activity_logs" VALUES ('15','45','Created Personal Library account','2026-06-23 18:48');
INSERT INTO "personal_activity_logs" VALUES ('16','46','Created Personal Library account','2026-06-23 18:48');
INSERT INTO "personal_activity_logs" VALUES ('17','47','Created Personal Library account','2026-06-23 18:58');
INSERT INTO "personal_activity_logs" VALUES ('18','52','Created Personal Library account','2026-06-24 11:44');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_books" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "owner_id" int(11) NOT NULL,
  "library_id" int(11) DEFAULT NULL,
  "title" varchar(255) NOT NULL,
  "author" varchar(255) DEFAULT NULL,
  "category" varchar(255) DEFAULT NULL,
  "publisher" varchar(255) DEFAULT NULL,
  "isbn" varchar(255) DEFAULT NULL,
  "language" varchar(100) DEFAULT NULL,
  "description" text DEFAULT NULL,
  "cover_image_url" text DEFAULT NULL,
  "quantity" int(11) DEFAULT 1,
  "book_condition" varchar(100) DEFAULT NULL,
  "purchase_date" varchar(100) DEFAULT NULL,
  "status" varchar(100) DEFAULT 'Available',
  "created_at" varchar(100) DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_borrowings" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "owner_id" int(11) NOT NULL,
  "book_id" int(11) NOT NULL,
  "borrower_name" varchar(255) NOT NULL,
  "phone_number" varchar(100) DEFAULT NULL,
  "issue_date" varchar(100) NOT NULL,
  "expected_return_date" varchar(100) NOT NULL,
  "actual_return_date" varchar(100) DEFAULT NULL,
  "status" varchar(100) DEFAULT 'Issued',
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_favorites" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "owner_id" int(11) NOT NULL,
  "item_type" varchar(100) NOT NULL,
  "item_value" varchar(255) NOT NULL,
  "created_at" varchar(100) DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_libraries" (
  "id" longtext DEFAULT NULL,
  "owner_id" longtext DEFAULT NULL,
  "library_name" longtext DEFAULT NULL,
  "profile_photo" longtext DEFAULT NULL,
  "plan_name" longtext DEFAULT NULL,
  "subscription_status" longtext DEFAULT NULL,
  "expiry_date" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "personal_libraries" VALUES ('2','28','My Test Library','null','FREE','active','null','2026-06-17 14:23');
INSERT INTO "personal_libraries" VALUES ('3','29','My Test Library','null','FREE','active','null','2026-06-17 14:24');
INSERT INTO "personal_libraries" VALUES ('4','30','My Test Library','null','FREE','active','null','2026-06-17 14:36');
INSERT INTO "personal_libraries" VALUES ('5','31','best','/static/uploads/profile_a8a68fcf.png','PRO','active','null','2026-06-17 09:12');
INSERT INTO "personal_libraries" VALUES ('6','32','My Test Library','null','FREE','active','null','2026-06-17 14:48');
INSERT INTO "personal_libraries" VALUES ('7','33','My Test Library','null','FREE','active','null','2026-06-17 14:57');
INSERT INTO "personal_libraries" VALUES ('8','34','My Test Library','null','FREE','active','null','2026-06-17 17:38');
INSERT INTO "personal_libraries" VALUES ('9','35','My Test Library','null','FREE','active','null','2026-06-17 17:47');
INSERT INTO "personal_libraries" VALUES ('10','36','My Test Library','null','FREE','active','null','2026-06-17 17:47');
INSERT INTO "personal_libraries" VALUES ('11','37','My Test Library','null','FREE','active','null','2026-06-17 17:53');
INSERT INTO "personal_libraries" VALUES ('12','38','My Test Library','null','FREE','active','null','2026-06-17 18:05');
INSERT INTO "personal_libraries" VALUES ('13','45','My Test Library','null','FREE','active','null','2026-06-23 18:48');
INSERT INTO "personal_libraries" VALUES ('14','46','My Test Library','null','FREE','active','null','2026-06-23 18:48');
INSERT INTO "personal_libraries" VALUES ('15','47','My Test Library','null','FREE','active','null','2026-06-23 18:58');
INSERT INTO "personal_libraries" VALUES ('16','52','123','null','PRO','active','null','2026-06-24 11:44');
INSERT INTO "personal_libraries" VALUES ('17','13','My Private Library',NULL,'FREE',NULL,NULL,'2026-08-03 13:11:34');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_library_shares" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "library_id" int(11) NOT NULL,
  "shared_with_user_id" int(11) NOT NULL,
  "permission_level" varchar(100) DEFAULT 'view',
  "created_at" varchar(100) DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_reading_tracker" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "owner_id" int(11) NOT NULL,
  "book_id" int(11) NOT NULL,
  "start_date" varchar(100) DEFAULT NULL,
  "finish_date" varchar(100) DEFAULT NULL,
  "current_page" int(11) DEFAULT 0,
  "total_pages" int(11) DEFAULT 0,
  "reading_status" varchar(100) DEFAULT 'Not Started',
  "updated_at" varchar(100) DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_settings" (
  "id" longtext DEFAULT NULL,
  "owner_id" longtext DEFAULT NULL,
  "setting_key" longtext DEFAULT NULL,
  "setting_value" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "personal_settings" VALUES ('4','28','theme','dark');
INSERT INTO "personal_settings" VALUES ('5','28','language','English');
INSERT INTO "personal_settings" VALUES ('6','28','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('7','29','theme','dark');
INSERT INTO "personal_settings" VALUES ('8','29','language','English');
INSERT INTO "personal_settings" VALUES ('9','29','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('10','30','theme','dark');
INSERT INTO "personal_settings" VALUES ('11','30','language','English');
INSERT INTO "personal_settings" VALUES ('12','30','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('13','31','theme','dark');
INSERT INTO "personal_settings" VALUES ('14','31','language','English');
INSERT INTO "personal_settings" VALUES ('15','31','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('16','32','theme','light');
INSERT INTO "personal_settings" VALUES ('17','32','language','English');
INSERT INTO "personal_settings" VALUES ('18','32','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('19','33','theme','light');
INSERT INTO "personal_settings" VALUES ('20','33','language','English');
INSERT INTO "personal_settings" VALUES ('21','33','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('22','34','theme','light');
INSERT INTO "personal_settings" VALUES ('23','34','language','English');
INSERT INTO "personal_settings" VALUES ('24','34','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('25','35','theme','light');
INSERT INTO "personal_settings" VALUES ('26','35','language','English');
INSERT INTO "personal_settings" VALUES ('27','35','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('28','36','theme','light');
INSERT INTO "personal_settings" VALUES ('29','36','language','English');
INSERT INTO "personal_settings" VALUES ('30','36','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('31','37','theme','light');
INSERT INTO "personal_settings" VALUES ('32','37','language','English');
INSERT INTO "personal_settings" VALUES ('33','37','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('34','38','theme','light');
INSERT INTO "personal_settings" VALUES ('35','38','language','English');
INSERT INTO "personal_settings" VALUES ('36','38','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('37','45','theme','light');
INSERT INTO "personal_settings" VALUES ('38','45','language','English');
INSERT INTO "personal_settings" VALUES ('39','45','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('40','46','theme','light');
INSERT INTO "personal_settings" VALUES ('41','46','language','English');
INSERT INTO "personal_settings" VALUES ('42','46','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('43','47','theme','light');
INSERT INTO "personal_settings" VALUES ('44','47','language','English');
INSERT INTO "personal_settings" VALUES ('45','47','notifications','enabled');
INSERT INTO "personal_settings" VALUES ('46','52','theme','light');
INSERT INTO "personal_settings" VALUES ('47','52','language','English');
INSERT INTO "personal_settings" VALUES ('48','52','notifications','enabled');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "personal_wishlist" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "owner_id" int(11) NOT NULL,
  "title" varchar(255) NOT NULL,
  "author" varchar(255) DEFAULT NULL,
  "priority" varchar(100) DEFAULT 'Medium',
  "price" decimal(10,2) DEFAULT NULL,
  "purchase_link" text DEFAULT NULL,
  "notes" text DEFAULT NULL,
  "created_at" varchar(100) DEFAULT NULL,
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "plans" (
  "id" longtext DEFAULT NULL,
  "name" longtext DEFAULT NULL,
  "monthly_price" longtext DEFAULT NULL,
  "annual_price" longtext DEFAULT NULL,
  "max_students" longtext DEFAULT NULL,
  "max_books" longtext DEFAULT NULL,
  "features_json" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "plans" VALUES ('plan_free','Free','0','0','50','100','{\"analytics\": false, \"api\": false, \"multi_branch\": false}');
INSERT INTO "plans" VALUES ('plan_basic','Basic','29','290','500','2000','{\"analytics\": true, \"api\": false, \"multi_branch\": false}');
INSERT INTO "plans" VALUES ('plan_pro','Professional','99','990','2000','10000','{\"analytics\": true, \"api\": true, \"multi_branch\": false}');
INSERT INTO "plans" VALUES ('plan_enterprise','Enterprise','299','2990','10000','50000','{\"analytics\": true, \"api\": true, \"multi_branch\": true}');
INSERT INTO "plans" VALUES ('plan_gov','Government/Education District','499','4990','100000','500000','{\"analytics\": true, \"api\": true, \"multi_branch\": true}');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "points_log" (
  "id" longtext DEFAULT NULL,
  "user_id" longtext DEFAULT NULL,
  "points" longtext DEFAULT NULL,
  "score_type" longtext DEFAULT NULL,
  "description" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "points_log" VALUES ('1','49','5','physical','Issued book \'The Psychology of Money\'','2026-06-29 10:38:40','2321');
INSERT INTO "points_log" VALUES ('2','56','5','digital','Daily reading streak day 1','2026-07-24 16:00:56','123');
INSERT INTO "points_log" VALUES ('3','56','10','digital','Reached 50% digital reading progress','2026-07-24 16:01:03','123');
INSERT INTO "points_log" VALUES ('4','56','20','digital','Completed digital reading (100% progress)','2026-07-24 16:01:05','123');
INSERT INTO "points_log" VALUES ('5','56','10','digital','Reached 50% digital reading progress','2026-07-24 16:01:53','123');
INSERT INTO "points_log" VALUES ('6','56','20','digital','Completed digital reading (100% progress)','2026-07-24 16:01:53','123');
INSERT INTO "points_log" VALUES ('7','56','5','digital','Daily reading streak day 1','2026-07-24 16:01:53','123');
INSERT INTO "points_log" VALUES ('8','56','5','digital','Daily reading streak day 1','2026-07-24 16:02:08','123');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "push_subscriptions" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "device_type" varchar(50) DEFAULT 'browser',
  "user_agent" text DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "updated_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "push_subscriptions" VALUES (5,23,'https://fcm.googleapis.com/fcm/send/caVmfi1sJ24:APA91bET1GFo1rruyPkS7OfVkEKrxfP707VefK_EeQC31IvrIwqt59aNVpuRAu3USvTHTlGMwH2V-4SoEj5iDNrgpIPIo8QVjZBRRNlRo1YmP8fTFe_h2opCUPxZRvrM3cuWN2vosXVf','BCJC1bNcbfrJQ-cwHBjNe2QGtyBuOyU8puMGr4u4UpLTnGGmmGNf5CzHqB_i19lgIVB49NRVAlAlP5VMO1C8JtY','enD14oiAN5OY0pW4IhaVJw','desktop_laptop','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-09-15 06:44:25','2026-10-01 18:11:51');
INSERT INTO "push_subscriptions" VALUES (6,9999,'https://fcm.googleapis.com/fcm/send/fr4PY-OWySo:APA91bHbw_xJRg292nQ_t83DU19fxddnoj2aPg8f50RpGriFOyGAD6JxUSKlrwUAAuDQbidCfUvksvE4i8QetbDE4KCB6l_Ie-WR7OnIRnzbDBeYCwayNqp7L3ECjccRljwoJcVdfVSV','BBN_sKB-3bLnUcvpJ1ffpNg5w76HFHjS0LEqM_ydw_Zq7lqSbdibx_0NR_X5SBG_He6XJQHsG27cWmxqqOMuwpU','O2r7t93UX1xXtGXNUHHNLg','mobile_phone','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36','2026-09-15 06:46:34','2026-09-15 06:46:34');
INSERT INTO "push_subscriptions" VALUES (7,23,'https://fcm.googleapis.com/fcm/send/cU1SekQhRvM:APA91bEgz3w_rpRJMbRasn4XwtdGLV_r53_DCyJ24unP2Ga7fTLVPD3_NO9ShIE6JgXtLOEDpqwnN3UrkeY5oNENIJL5HSG_4_cyIa7Go_ThxZc9OnpI6e3bS94XHvn9NfWxJ2hh5hLN','BFe6OhfAkSkvYSYlOC-wwQvqmIoMy-EatrTHlKE46FLIaAe7DHixPlFTdgB2TbNOwtpSS_0sL7S5vjV_ZrH7hNk','SUAmE3Zb1-v2u6DNreSY2A','mobile_phone','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36','2026-09-15 06:46:34','2026-10-02 06:08:28');
INSERT INTO "push_subscriptions" VALUES (8,9999,'https://fcm.googleapis.com/fcm/send/fU8upWgQRk0:APA91bHOYEAelbrpeWmw9w9snAfzweCZf8obdHnonoXCNVgwqDWOIx0QoclSz1AxI98CO0PsGcZ3OSKAngMXSzpvVycMGrR3alVwpVv6S1CxvXhNGxPCk8vvdfYYwjV5aYi4twxMiJJk','BOnqOMczDmtPR-zBbkSD9LfWiyHACU3IrCuS1Kk873pR6NcrXy7XcUNGYDgcBjkEg5_4MUc_YKuFYrv3173fohw','gHDoB6oC8lvjm7xVFWE4dQ','mobile_phone','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36','2026-09-19 14:59:04','2026-09-20 09:46:58');
INSERT INTO "push_subscriptions" VALUES (9,18,'https://wns2-pn1p.notify.windows.com/w/?token=BQYAAACzHgn9JPjPMn0HpfTOVwrlf7MMcY7Pzj3G9xv%2fro6pvK56cartnj9kDmWaufOCxLQzNShkKeM%2bmqHHH1lev5dc3xj794sx2%2b0pBytqVdKDSZ2BmO9MMwpX9F9CTij6qY77RRyi2G6lPC5Few5uuOP3j%2f8nrh1uDh%2bwnB7x02Nailc%2fL6taoI%2fgFAKZBlmBLMsChD6SC7d8CSxcuapF%2fPYlj79RL50Jt72Fkol6j2qAhbdf8Y6Q9N3UC%2fUf67UwtBKTe0loxK5t%2f3b3wLMSDeJTus2WF1qDBl%2fUfIOc1L73tctO%2fs5MeLsrwcugHzllMyM%3d','BJuA8r7-v-1Q-6QG2M9EbYuBaEpQ7k-etMrdiuI95chim6sZ4RzgtvKkP3Vhs0w101boPAevT32JtHf8Ff1S0XQ','20Du54T66iGFg4QeguSjHQ','desktop_laptop','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0','2026-09-21 15:23:10','2026-10-02 05:20:30');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "quiz_answers" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "attempt_id" bigint(20) unsigned NOT NULL,
  "question_id" bigint(20) unsigned NOT NULL,
  "selected_answer" text NOT NULL,
  "is_correct" tinyint(1) DEFAULT 0,
  "marks_obtained" decimal(5,2) DEFAULT 0.00,
  "answered_at" datetime DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  KEY "idx_ans_attempt" ("attempt_id"),
  KEY "idx_ans_question" ("question_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "quiz_attempts" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" varchar(255) NOT NULL,
  "book_id" varchar(255) NOT NULL,
  "book_type" varchar(50) NOT NULL DEFAULT 'physical',
  "score" decimal(5,2) DEFAULT 0.00,
  "passed" int(11) DEFAULT 0,
  "attempted_at" varchar(100) DEFAULT NULL,
  "quiz_id" int(11) DEFAULT NULL,
  "total_marks" int(11) DEFAULT 10,
  "status" varchar(50) DEFAULT 'COMPLETED',
  "started_at" datetime DEFAULT NULL,
  "completed_at" datetime DEFAULT NULL,
  "student_id" bigint(20) unsigned NOT NULL DEFAULT 0,
  "library_type" varchar(20) DEFAULT 'OFFLINE',
  "digital_content_id" bigint(20) unsigned DEFAULT NULL,
  "attempt_number" int(11) DEFAULT 1,
  "percentage" decimal(5,2) DEFAULT 0.00,
  "time_taken_seconds" int(11) DEFAULT 0,
  PRIMARY KEY ("id"),
  KEY "idx_quiz_attempts_lookup" ("user_id","book_id","book_type")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "quiz_attempts" VALUES (1,'14','','physical',7.00,1,NULL,4,10,'COMPLETED','2026-09-11 21:21:09','2026-09-11 21:21:09',0,'OFFLINE',NULL,1,0.00,0);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "quiz_questions" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "quiz_id" bigint(20) unsigned NOT NULL,
  "question" text NOT NULL,
  "question_type" varchar(30) DEFAULT 'MCQ',
  "options" text NOT NULL,
  "correct_answer" varchar(255) NOT NULL,
  "explanation" text DEFAULT NULL,
  "marks" int(11) DEFAULT 1,
  "difficulty" varchar(20) DEFAULT 'MEDIUM',
  "order_index" int(11) DEFAULT 1,
  "source_reference" varchar(255) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  KEY "idx_qq_quiz" ("quiz_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "quizzes" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "title" varchar(255) NOT NULL,
  "description" text DEFAULT NULL,
  "subject" varchar(100) DEFAULT NULL,
  "class_name" varchar(50) DEFAULT NULL,
  "duration_minutes" int(11) DEFAULT 15,
  "total_marks" int(11) DEFAULT 10,
  "published" tinyint(4) DEFAULT 1,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "library_type" varchar(20) DEFAULT 'OFFLINE',
  "digital_content_id" bigint(20) unsigned DEFAULT NULL,
  "time_limit" int(11) DEFAULT 15,
  "max_attempts" int(11) DEFAULT 2,
  "passing_percentage" int(11) DEFAULT 60,
  "book_id" bigint(20) unsigned DEFAULT NULL,
  "school_code" varchar(50) DEFAULT 'GLOBAL',
  "status" varchar(20) DEFAULT 'PUBLISHED',
  "difficulty" varchar(20) DEFAULT 'MEDIUM',
  "instructions" text DEFAULT NULL,
  "created_by" bigint(20) unsigned DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "quizzes" VALUES (1,'Physics: Motion & Force','Chapter 3 diagnostic quiz on Newton Laws of Motion','Physics','Class 9',15,10,1,'2026-09-10 14:31:07','OFFLINE',NULL,15,2,60,1,'GLOBAL','PUBLISHED','MEDIUM',NULL,NULL,'2026-09-22 07:30:10');
INSERT INTO "quizzes" VALUES (2,'English: Literature & Comprehension','Poetry analysis and vocabulary test','English','Class 9',20,15,1,'2026-09-10 14:31:07','OFFLINE',NULL,15,2,60,2,'GLOBAL','PUBLISHED','MEDIUM',NULL,NULL,'2026-09-22 07:30:10');
INSERT INTO "quizzes" VALUES (3,'Mathematics: Coordinate Geometry','Mid-term practice test with coordinate planes','Mathematics','Class 10',25,20,1,'2026-09-10 14:31:07','OFFLINE',NULL,15,2,60,5,'GLOBAL','PUBLISHED','MEDIUM',NULL,NULL,'2026-09-22 07:30:10');
INSERT INTO "quizzes" VALUES (4,'Computer Science: Python Data Structures','Lists, Dictionaries and algorithmic problem solving','Computer Science','All Classes',15,10,1,'2026-09-10 14:31:07','OFFLINE',NULL,15,2,60,3,'GLOBAL','PUBLISHED','MEDIUM',NULL,NULL,'2026-09-22 07:30:10');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "reading_activity" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "document_id" int(11) DEFAULT NULL,
  "reading_date" date NOT NULL,
  "minutes_read" int(11) DEFAULT 0,
  "pages_read" int(11) DEFAULT 0,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "reading_goals" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "goal_type" varchar(50) DEFAULT 'BOOKS',
  "target_value" int(11) NOT NULL DEFAULT 20,
  "current_value" int(11) DEFAULT 0,
  "start_date" date DEFAULT NULL,
  "end_date" date DEFAULT NULL,
  "status" varchar(50) DEFAULT 'ACTIVE',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "reading_progress" (
  "id" longtext DEFAULT NULL,
  "student_id" longtext DEFAULT NULL,
  "content_id" longtext DEFAULT NULL,
  "last_page" longtext DEFAULT NULL,
  "updated_at" longtext DEFAULT NULL,
  "total_pages" longtext DEFAULT NULL,
  "completed_at" longtext DEFAULT NULL,
  "reading_time" longtext DEFAULT NULL,
  "streak_last_increment_date" longtext DEFAULT NULL,
  "started_reading_at" longtext DEFAULT NULL,
  "awarded_50" longtext DEFAULT NULL,
  "awarded_100" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "reservations" (
  "id" longtext DEFAULT NULL,
  "user_id" longtext DEFAULT NULL,
  "book_id" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "reservations" VALUES (NULL,'14','7','PENDING','2026-09-23 17:24:50','dps123');
INSERT INTO "reservations" VALUES (NULL,'14','8','PENDING','2026-09-23 20:12:01','dps123');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "role_permissions" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "role_id" int(11) NOT NULL,
  "permission_id" int(11) NOT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "uk_role_perm" ("role_id","permission_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "role_permissions" VALUES (1,2,15,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (2,2,17,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (3,2,16,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (4,2,19,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (5,2,20,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (6,2,18,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (7,2,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (8,2,25,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (9,2,21,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (10,2,23,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (11,2,22,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (12,2,24,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (13,2,37,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (14,2,38,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (15,2,2,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (16,2,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (17,2,28,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (18,2,27,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (19,2,26,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (20,2,30,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (21,2,32,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (22,2,31,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (23,2,33,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (24,2,29,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (25,2,40,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (26,2,39,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (27,2,43,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (28,2,45,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (29,2,44,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (30,2,35,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (31,2,36,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (32,2,34,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (33,2,42,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (34,2,9,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (35,2,4,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (36,2,7,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (37,2,6,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (38,2,5,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (39,2,12,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (40,2,13,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (41,2,10,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (42,2,8,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (43,2,3,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (44,2,11,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (45,8,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (46,8,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (47,8,26,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (48,8,27,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (49,8,28,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (50,3,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (51,3,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (52,3,15,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (53,3,16,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (54,3,17,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (55,3,18,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (56,3,19,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (57,3,20,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (58,3,21,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (59,3,22,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (60,3,23,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (61,3,24,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (62,3,25,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (63,3,26,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (64,3,27,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (65,3,39,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (66,3,40,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (67,3,42,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (68,6,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (69,6,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (70,6,39,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (71,9,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (72,9,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (73,9,26,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (74,7,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (75,7,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (76,7,29,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (77,7,30,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (78,7,31,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (79,7,32,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (80,7,33,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (81,5,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (82,5,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (83,5,26,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (84,5,29,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (85,5,34,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (86,1,15,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (87,1,17,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (88,1,16,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (89,1,19,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (90,1,20,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (91,1,18,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (92,1,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (93,1,25,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (94,1,21,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (95,1,23,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (96,1,22,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (97,1,24,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (98,1,37,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (99,1,38,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (100,1,2,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (101,1,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (102,1,28,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (103,1,27,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (104,1,26,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (105,1,30,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (106,1,32,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (107,1,31,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (108,1,33,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (109,1,29,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (110,1,40,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (111,1,39,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (112,1,43,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (113,1,45,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (114,1,44,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (115,1,35,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (116,1,36,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (117,1,34,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (118,1,42,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (119,1,41,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (120,1,9,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (121,1,4,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (122,1,7,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (123,1,6,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (124,1,5,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (125,1,12,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (126,1,13,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (127,1,10,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (128,1,8,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (129,1,3,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (130,1,11,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (131,4,1,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (132,4,14,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (133,4,24,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (134,4,26,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (135,4,29,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (136,4,30,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (137,4,31,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (138,4,33,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (139,4,34,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (140,4,35,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (141,4,36,'2026-09-26 10:40:06');
INSERT INTO "role_permissions" VALUES (142,4,39,'2026-09-26 10:40:06');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "roles" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "description" text DEFAULT NULL,
  "is_system" tinyint(1) DEFAULT 0,
  "status" varchar(20) DEFAULT 'active',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "updated_at" timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "slug" ("slug")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "roles" VALUES (1,'Super Admin','super_admin','Complete platform oversight, system settings, and multi-school governance.',1,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (2,'School Admin','admin','Full administrative control over school library, users, inventory, and reports.',1,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (3,'Librarian','librarian','Manages cataloging, circulation desk (issue, return, renew), fines, and inventory.',1,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (4,'Teacher','teacher','Can view students, host live sessions, create quizzes, and borrow resources.',1,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (5,'Student','student','Can browse catalog, view borrowed books, take reading quizzes, and access e-library.',1,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (6,'Parent','parent','Overview of ward reading progress, borrowings, and library fines.',1,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (7,'Quiz Manager','quiz_manager','Authoring reading comprehension quizzes and managing question banks.',0,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (8,'Content Manager','content_manager','Uploading and curating digital vault books, study guides, and media.',0,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
INSERT INTO "roles" VALUES (9,'Personal User','personal','Standalone personal library reader and private catalog organizer.',1,'active','2026-09-26 10:40:06','2026-09-26 10:40:06');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "scheduled_notifications" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "message" text NOT NULL,
  "type" varchar(50) DEFAULT 'info',
  "scope" varchar(50) NOT NULL,
  "school_code" varchar(50) DEFAULT NULL,
  "role_target" varchar(50) DEFAULT NULL,
  "user_id" int(11) DEFAULT NULL,
  "run_at" datetime NOT NULL,
  "status" varchar(50) DEFAULT 'pending',
  "sent_count" int(11) DEFAULT 0,
  "last_error" text DEFAULT NULL,
  "created_by" int(11) DEFAULT NULL,
  "created_at" datetime DEFAULT current_timestamp(),
  "updated_at" datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY ("id"),
  KEY "idx_sched_run_at" ("run_at"),
  KEY "idx_sched_status" ("status")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "schools" (
  "id" longtext DEFAULT NULL,
  "name" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "librarian_name" longtext DEFAULT NULL,
  "max_books" longtext DEFAULT NULL,
  "max_students" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "activePlan" longtext DEFAULT NULL,
  "subscriptionStatus" longtext DEFAULT NULL,
  "expiryDate" longtext DEFAULT NULL,
  "studentLimit" longtext DEFAULT NULL,
  "librarianLimit" longtext DEFAULT NULL,
  "adminLimit" longtext DEFAULT NULL,
  "due_days" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "schools" VALUES ('1','Legacy School','DEFAULT','Admin','null','null','2024-01-01','active','FREE','active','null','50','1','1','3');
INSERT INTO "schools" VALUES ('2','DPS','SCH8912','POOJA GUPTA','null','null','2026-06-03 22:43','active','FREE','active','null','50','1','1','3');
INSERT INTO "schools" VALUES ('3','dps','DPS123','Admin','null','null','2026-06-06 16:26','Active','PROFESSIONAL','active','2027-06-23 14:35:51','999999','999999','999999','3');
INSERT INTO "schools" VALUES ('4','abc','ORG33184','Ayushman Gupta','1000','500','2026-06-16 10:20:01','active','PROFESSIONAL','active','2027-06-16 17:23:29','999999','999999','999999','3');
INSERT INTO "schools" VALUES ('5','codex','SCH8259','codex','null','null','2026-06-16 17:40','active','FREE','active','null','50','1','1','3');
INSERT INTO "schools" VALUES ('6','Automated Test School','AUTOTEST','Librarian Auto','null','null','2026-06-16 18:05','active','FREE','active','null','50','1','1','3');
INSERT INTO "schools" VALUES ('7','UKG','ORG67207','Sudip Chakraborty','1000','500','2026-06-20 17:33:17','active','FREE','active','null','50','1','1','3');
INSERT INTO "schools" VALUES ('8','Lib Test2','2321','Ashish Kumar Gupta','null','null','2026-06-24 06:31','active','PROFESSIONAL','active','2027-06-29 10:48:20','999999','999999','999999','3');
INSERT INTO "schools" VALUES ('9','Test','ABC','Deepak','null','null','2026-06-24 10:20','active','PROFESSIONAL','active','2027-06-24 14:32:08','999999','999999','999999','3');
INSERT INTO "schools" VALUES ('10','Sanshay','SAS','Sanshay','null','null','2026-06-26 12:18','active','FREE','active','null','50','1','1','3');
INSERT INTO "schools" VALUES ('11','Akshay','123','Akshay','null','null','2026-06-26 12:25','active','PROFESSIONAL','active','2027-06-30 17:11:12','999999','999999','999999','3');
INSERT INTO "schools" VALUES ('12','Ayushman Gupta','4343','JHON PIG','null','null','2026-07-15 05:48','active','FREE','active','null','50','1','1','3');
INSERT INTO "schools" VALUES (NULL,'Sanjeevini Sasikumar\'s School','DL-140307',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "schools" VALUES (NULL,'Bhoopendra Singh\'s School','library',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "session_attendance" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "session_id" int(11) NOT NULL,
  "user_id" int(11) NOT NULL,
  "user_name" varchar(255) DEFAULT NULL,
  "joined_at" timestamp NULL DEFAULT current_timestamp(),
  "left_at" timestamp NULL DEFAULT NULL,
  "duration_seconds" int(11) DEFAULT 0,
  "status" varchar(50) DEFAULT 'present',
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "session_attendance" VALUES (1,1,23,'Librarian Auto','2026-09-07 15:05:42',NULL,0,'present');
INSERT INTO "session_attendance" VALUES (2,1,23,'Librarian Auto','2026-09-07 15:15:02',NULL,0,'present');
INSERT INTO "session_attendance" VALUES (3,1,14,'dps123','2026-09-07 15:36:09',NULL,0,'present');
INSERT INTO "session_attendance" VALUES (4,1,14,'dps123','2026-09-07 15:40:09',NULL,0,'present');
INSERT INTO "session_attendance" VALUES (5,1,14,'dps123','2026-09-07 15:40:19',NULL,0,'present');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "sessions" (
  "session_id" varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  "expires" int(11) unsigned NOT NULL,
  "data" mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY ("session_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "sessions" VALUES ('--JffCeCMxfsWg3SNLD7eZ3WvSw_lWzb',1793114768,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T15:26:07.689Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-5iskDY4VFxlcb6PMRakvQyx_i5G-8XG',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.507Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-8gqbWzOa6KaEF0fNHEVZykm8VTh79Od',1792392771,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T06:52:50.872Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-B4gh7EAHJC12nYOX4chZxUg7xQ1q_n_',1792303407,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T06:03:27.304Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-FKjPBUHEtiz24kYlX1qT2VeT47Mk925',1793312186,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:25.759Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-ManBhLpcjTWFVcK7pNmvdL5IfaqEBd2',1793469951,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T18:05:50.903Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-Pc3oE116AnKTopKSk8Sw84LXMPP1tjh',1792094306,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T19:58:26.299Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-eBbZV7vTZhh9MNfc8BoWpkt53mTMg2k',1793016899,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T12:14:58.570Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-hu-pBxM5ZydJweASxBCW1tn3_Mok1Gz',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.603Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-kd5ZJzGNdNEY4gAZTnoiZMxvi16q2Xq',1792576982,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T10:03:02.054Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-m6D_Fec6a0yDuLyimEMfc40XgTTpbPv',1790978159,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T21:55:59.149Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-mE5GqKFgxK_WzTUC6tgBSFj0WNCnYLQ',1793011172,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T10:39:32.415Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-mZsH_rGqAnnQ1hwsSu2EJ49p62RRLfO',1792054230,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T08:50:30.358Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-qkV1DWpfTbCZ3WhtbCrEiXLuhaIHDS_',1791208470,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T13:54:30.131Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-uafokMjg7fmDpynbCWbxZMx_XhECZ4h',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.973Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-uguQfnetVj3vaNUseml7QdJ_VB5zyP9',1793312162,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:02.414Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-wBn36HhDwpAeD2cAFOQRF7wz0XkjGug',1793334119,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T04:21:59.204Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-y2rv8NqhVD33C0vJjZ4ovAhJcukYEc2',1792489148,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T09:39:07.586Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('-y_LxIIsyARIyaY1ieFgGg6CEgIGmWQY',1793250034,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T05:00:33.939Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('-z-uq7Vz2XQmfp0u2iS_rFGhMRSSNtaf',1791921212,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.328Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0DIO5BAVqPNm_a4TmcXo-RC57mCpCNh7',1791165935,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T02:05:35.199Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0FAUblDemMNutEkT0Y5h5ByLrhaWEk67',1790938038,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:47:17.773Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0LSE_IKgJFcJc-3IEV2eNv2IMNh3TRu-',1792131725,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T06:22:04.741Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0UOtZZuIZozf7DybIBWGAf472Ixe_jkv',1792859325,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T16:28:45.232Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0UnbERliu1p4TXnkmFd8bpmIjWuHj4ye',1791805665,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T11:47:45.435Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0a_LRHYi-yEYpe52uHjZjA6mXC6RssBM',1792886340,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T23:58:59.865Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0fMY7SXch5VTuDQCwNbEupNjZgjvrAM6',1792593508,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T14:38:28.225Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0h8d_t87ZWf_g0hVyHl2Zr3Ij4XnVQpx',1793292514,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T16:48:34.106Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0mtPqNDoeTBL_N5oCWod3q5qQIfdy0zp',1791730732,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:52.032Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('0tR51L18Q9tc3n9Zic2PpqcfhZRBDnxG',1791829970,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T18:32:50.154Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('11LZzqmm6pfvxet9Vx5CssskdhuxiEQ4',1791921209,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.426Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('16UW2YL0KYxrRzNhX5HGVMJxeg-sDzW3',1792758479,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:27:58.926Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('190n6Hi2foZAtIxbsPWjsEyqrRZ_r0tH',1791373412,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T11:43:31.714Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1Caq9YOBK-sJiEm7u9GhOmF6tXR_Qs6_',1791051324,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T18:15:23.785Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1Q15aduG2Gp67ezAHzJ865LyB3W7avyC',1792623929,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T23:05:29.264Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1SVWD_lYGvZFxcZvfdbiJWK0BERMRz7X',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.611Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1TmnzTPQ1vJUVTjHwAfikBV22nESuGCX',1791737233,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:47:13.201Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1XlE9heO6dw8Hi9qBKfG5WPZ_bOXl4dE',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.369Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1YZ-bPpPj38a-0dUZs8BHRS85bJDAKH-',1791028458,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T11:54:17.883Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1YlCUMjEHIWQpqEmGF9zCionQeQNHOkm',1791972265,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T10:04:25.272Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1aZjepOMPCLEQNa17DwcJmfd4YRqJcog',1792918707,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:58:27.027Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1g4iwM_pm1-7LblGzKemim5HPJR6Up39',1792157114,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T13:25:14.406Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1i2EYmxwQ0rV9skCgYmYTLJGNwaiAcbV',1792861764,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T17:09:24.347Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1kUSmcrb9HRaebFkmiGMLmCe71ez4_kw',1792868384,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T18:59:43.611Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1lHAtZMKhHHMHtWiXLCbIpULbjYjG2O8',1791645602,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:20:01.541Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1mlbtjgCTFAoTrCu5aIdc9JN1gKmXGwa',1791912573,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T17:29:33.167Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('1uNANvOH8WQAYE6mX-6w865Y0yQAlVEW',1791711611,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T09:40:11.330Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('20K6bkqZaOl3tOnR-9F1zhOAntkQKN91',1793312185,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:24.730Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('259rOeqolCSdl1CBmYH_9kuCAe5JjODm',1791730691,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:11.415Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2G8IVftrDGHZntqZV_ArlhIdRrWaIZep',1791209221,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T14:07:01.285Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2IXXcaVM77XV0ch001JnKUdqJS1baC48',1792463096,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T02:24:54.219Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2JZvv3rYTWuVntX-3BGIUpTlnXYxd1ie',1792176666,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T18:51:06.350Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2KOQ7yz6A9Llu2sDepm_zWjoueJj6Zwg',1791007268,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T06:01:08.107Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2SQJtwoenSgqROFmfaGdy0QKgFnbYKcu',1791006256,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T05:44:15.655Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2TklPBAaMCGvz_9JYSOnW9ExzV34FSh1',1793281936,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T13:52:16.460Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2XzlEaG6dZVn9CNuCTqwi1XpMxVvUWhL',1791998151,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T17:15:38.042Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2_TFux1PQSax_X9K2rBi2xtJk62Yim0k',1793064509,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T01:28:28.860Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2aKNLOCUHkx7mqIoYWZzpKzcfPd-DuCC',1791377529,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:52:08.731Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2n9CuX2UwMFuXgdiSYAyVvYShBZTXDtU',1791719592,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T11:53:11.754Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2pwWRkzroAby0ys1MKmpIopxVioRXUd4',1792076331,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T14:58:50.981Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2qtAOaV-nU4Annz3RyG_1tLIp1I8gsIw',1793440420,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T09:53:40.491Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('2un0ZwiEJYMTiqS9Ai82OlIriWNsp_gg',1792492560,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T10:36:00.281Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('34Af87ddbpDVd0ahtLH5rHXYSBECYEHd',1792758317,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:25:17.461Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Admin or Librarian login required.\"]}}');
INSERT INTO "sessions" VALUES ('35rAuBowMg_KL9eR5TB3OL5WaDoUrEoH',1792476486,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T06:08:06.044Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('3OgaCyfoiSJZ6nRQhHkVn-vJzSaEDxQp',1792325119,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T12:05:19.277Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('3QUGNRrHTKUar_2y8sMX4kGcSGhHBVw5',1793340141,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T06:02:20.945Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('3Y6206d5fSKqwUqgbpJxPVlAtMDRHJXM',1793392584,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T20:36:24.377Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('3gFjCWZFA1QwrlRojtGFoC5Ryu8FGdKf',1791168192,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T02:43:11.750Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('3mZk-klwA8tIZAZo_xzkQQUQxmjDpMk9',1792606718,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T18:18:38.418Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('3tU9iymUu0syLJyQH7THrHMAP9FLJr9B',1791294400,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T13:46:39.970Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4BYTOAbo7tEQRKN41hMEKf56JJtiFkhH',1792336209,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T15:10:08.551Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4GVyr-cEV1vLqRpMxqYmdrb0Fydw5v_U',1792663379,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T10:02:58.780Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4Hk1W9SOfaoP11b8kbtK8EmPYDp07tQv',1790993061,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T02:04:21.116Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4OKeq_e1gEwYJHThwJQDVj0m61LNJKzg',1793312179,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:19.488Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4eNup1oww7YwXoYeTVwZ6azVz1Z_kJNS',1792464146,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T02:42:25.787Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4i_FYaybraGHqMHdmW9pRSO7AxQxHdY8',1791801550,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T10:39:10.336Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4lB2he9Gunt5ArGGnJ7WPy9sn8BWcsB0',1791815096,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T14:24:56.197Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4oITE8PXgmlnA3NkTDW2umMp0GdcGden',1792758385,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:26:25.006Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('4tOHAB2q6cGVu9ptx1ZLz-02UuPIOTIY',1793003871,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T08:37:22.506Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5021big5JaiwTMijLSzRF6E0cMwcQWGC',1793009715,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-26T10:15:15.085Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('54gdlDtqT-DNZ1Q9DqyKcA1gVyNrhEhy',1791803584,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T11:13:03.738Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5BGlJNprd4D_FZI5Xd-8bauQYJxHM52t',1791089889,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T04:58:08.951Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5GSD0wuzFsHCnhNaX_DpaGMiLuf7_Rv2',1793360173,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T11:03:59.329Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5OlaGcGxgBbEdWDUKk46RsZZssrSAwu3',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.702Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5SXpHEBQAtdyLG2Jx8sGDCffJtj2fyRP',1791113843,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T11:37:22.881Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5UjIoy6I5sBF86b451azd85g_uc7aF3Y',1793160699,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T04:11:38.573Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5_qqyrq59rh2TQ9CgYCuRUAhQB6KQDtP',1793131147,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T19:59:06.550Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5i3xfmHqbomdN-n2JlllF6dbp_crSEQ9',1791162494,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T01:08:14.418Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5jr9rfMb3tVcR8g21_8fnK1TumXah6TB',1793140351,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T22:32:30.992Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5tmh5j_la8sh6oTBAhltMs9VsKpd_yfK',1792526614,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T20:03:34.210Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5ukp1-y2EsZl5PTijdfAVmZiqq_t3lUE',1793016720,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T12:11:59.854Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Super-Admin login required.\"]}}');
INSERT INTO "sessions" VALUES ('5xKSekaTxSbdoEpYjSMp3uuaaCym7i10',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.503Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('5zIqLovBQ1d4pYRi0q2tmbfsmWzMgfYq',1792380221,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T03:23:40.981Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('622NVb2uTO9zLZZpUtRc_iSAiYl5_hPn',1793511992,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T05:46:32.364Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('6GHIduidvZdfRVJCRJsrlLNcfpkwD7Bv',1790923968,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T06:52:47.750Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('6MvkD73mdnFkKLGZSkXQTap3f44V1FOf',1791006888,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T05:54:47.983Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('6OfC0Tr8oIxuluq7OsY_FkgawdhonEJy',1790968122,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T19:08:41.669Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('6PKGXcbkPZrbMd0T9pLvRp9RLJi7qltb',1791644923,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:08:42.706Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('6RlgtN19Eqbu_KCg33YeOIjBEuUmWHWP',1791019352,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T09:22:32.436Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('6a466JSRyW7yMFSmuBvoPXhX0shxNvO_',1791699159,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T06:12:38.624Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('6ckxD8H5hXb2KNy6a0wYPDgKx9qGRgMe',1793034495,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T17:08:15.415Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('6qWz4Cq5CBT29LkyeCfYdONbLUhavSfE',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.612Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('73d9iuMJBZk_1nF9V5aRabpauCVY_VP-',1793066159,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T01:55:58.883Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('75Oj8SLweBP3lrIkH3F42yq7tucMDyI_',1791200644,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T11:44:03.556Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('79l3GG2oaFetbRmJKqhWqmC0s01bOsCC',1792073502,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T14:11:42.163Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('7BCS6rZRLehAhLi9Bftgn4hKRPVXzeml',1792766574,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:42:54.389Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('7BNZVV83g28uSFFZdUGfwTtaMgmORpfx',1792070697,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T13:24:56.966Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('7CPNYskH2-UHTkB8FHwf6SmqqY7GB1Fo',1790936954,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:29:13.542Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('7K6RxzXUWY_Zg57pS5GX9vKuLjVl36lI',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.535Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('7Lixe6QsJWGSLUYR5mMsj8R9Kem0_6k6',1791260287,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T04:18:06.778Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('7N2F3lb4ngRXFPeBxOEU2tpGISWtgEy-',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.534Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('7Nd67v14qigEzk32jrBigM9SJmHFsbmD',1792189664,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T22:27:43.846Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('7kDt05zvPcLn3R0fi-86xTJ4kCUC8FfG',1791683028,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T01:43:47.693Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8-1_hMH0g174PvAaFmRBgfWEXqxs8_Df',1791777277,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T03:54:36.982Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('864kyYNWS_aiDd4eten6ce9yJkOdeU51',1791201225,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T11:53:45.394Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('89GpxMvQBpYZ_YMtteouXNIdJYrZO72L',1792128240,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-16T05:24:00.440Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8PHjAsSEtC7GZNn2HYTREsC12srdvao4',1792046673,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T06:44:33.359Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8QElFgAIA0nPevB8rvUaQwur3e1W4QM1',1792758299,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:24:59.106Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8X9jLAGCILJVssaekXm1jr847QIDj8-P',1793412376,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T02:06:15.824Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8eQvhBnzUMA3ha0FOElUQx9-3ZMNWe7Z',1791730703,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:22.982Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8iZnkKBW53XKflxai5_x4JiP5ib6EGup',1791135768,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:42:47.986Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8lAo9rp1jbqdM2J8RsGWf4XopA-Wccrh',1793344039,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T07:07:18.902Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8oEtQi5mn7ZdpX8pr3PaJEfvu8mERbqx',1792395802,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T07:43:21.625Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8obdMEIM1zZzIhaoSTsCqLz-hqRw6ZJV',1791276091,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T08:41:31.250Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8rL1RwtpU84RkKx3D0XZ-J2Kbo9T4hGM',1791236501,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T21:41:41.456Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8uoNjPb628ioDC7MR-xrfpJWwmuhsGX4',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.242Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('8yncYNkQbtB-E6fiQak8oRD892I_-mJr',1792489144,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T09:39:03.938Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('90fHckjppdase8CzmJ7nc0KYSHtIxpXd',1791974045,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T10:34:04.516Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('93H7tbQUAczEUHSrPJF78-RbvUnt1a25',1792766488,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:41:28.189Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('93IOdeAhgoqsa6NrVEN3M_zlkEQ33C8V',1792102979,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T22:22:58.597Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('97Bxm8g0tLFCu_Qk55OX3dwp9NM2nLBo',1791376850,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:40:49.975Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9OYtQq92qHoyJUrUQkBGoXPPmyCeg-zJ',1791968632,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T09:03:51.610Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9SU3Xb49YIGsDUWW7G9bTOFTV3Z3-BK0',1792707303,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T22:15:02.875Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9U7eMMJYGT2CciqI_I4pdtio-lc0m4eV',1792839189,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T10:53:08.502Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9c34QE_RjgH6UDIi8ssW2mapUM92dATk',1791721036,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T12:17:16.332Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9cX8b2_dLrJ0MXsOY52ho0tSnYtxrDJD',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.112Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9gOookeHqFh1D8COvw09SKhyS4kw4Fbq',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.968Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9xdA9ZVIUunSdlOKureA9GBTc8JbxU_9',1793097525,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T10:38:45.056Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('9ylzse-i7vxgnwUQJcG_j7rvP0s_ZfJO',1792753077,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T10:57:57.020Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('A56xD1nxewYkDjHSDTyQX8_0tI11D76z',1791683028,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T01:43:48.299Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('A9ROhJniygKBvJMIf9vGwN56mbwLFQGf',1791737923,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:58:43.007Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ACCTbthCN1VdTx4WBqdMrtfV3OgUnROn',1791377691,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:54:50.568Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AJfVxOlJk7pFMnYWQipqXcuIyWQnNV1d',1792519829,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T18:10:20.236Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AM_lSHLzKPkVyJYETjSp3RPfSPHwVbv3',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.093Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AT64W3lJdGMtxQRTBx8wVUbVjcFZM9pW',1791882274,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-13T09:04:33.634Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AY74l6YvfWReEMJ5ugjteQK5jcQES70u',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.533Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AY_kSu69ZlaRFPXCj2x8Cmry5FMVOMOU',1790938020,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:47:00.480Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Abuxzo14Bp4JuCspeJ4jewSP9-ghBjIl',1792657142,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-22T08:19:02.049Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AeiYD1Nz9IlB68FyFpYmobklXjsjGHio',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.420Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AfVWhu6gLXHq8K7Kv0m6EGk6PMFr9gxl',1790938067,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:47:47.140Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Ai3m3PxOXQKJNmIpcrAcVNFhI5iP7E2m',1791644213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:56:52.660Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AiJGsoYw_h1QkiJdm0_8OJryBG8p41WV',1792085202,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T17:26:42.476Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AiKOX2X61R-80Fud_GanoX9wmknAe7ew',1792489136,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T09:38:55.633Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AlZPPLKj4UwBzg0CVbkXTbNTa2G2bYQH',1791720989,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T12:16:29.284Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('AmVtR6KyroZn5O1APWIV4Q3PyZNfRMjE',1792463089,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T02:24:48.501Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('B1z3r4P7p_bhIf-UPNEMy1PXPNsCEP4d',1792663375,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T10:02:55.464Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('B2aWMFAWRmGaP79xcIJb3eaMOmNmOWVE',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.515Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('B2eo07qX6Wyb8_1Ix_JINNP5t3VkRUe5',1792284999,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T00:56:39.419Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('B5CGCNpy3SXvCwxytzhdaDLDG7Wrr0Mj',1792437229,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T19:13:48.711Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BA0Jd0t4ssnPnqhik-Pro2PfDhgksf-0',1793206598,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T16:56:38.262Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BBa_1AsFnbeLkhUTHBywS8-mkOjpEmY0',1791801490,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T10:38:10.015Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BE_5Du6lUJpvasOr2VcLXNJo_T9gylJB',1791737232,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:47:12.118Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BIXC5_NH_H_br74fhwlijtiz2vxVnArq',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.511Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BIihiz8lT5-fLf7gRt9jJHVdhs2_1tFC',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.981Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BOVYIe0NYhlHrdd_EdJrD4jJjszPoxnR',1792455532,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T00:18:52.374Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BWhJ_5-0rQMw-y2XncmHTi04XKY2WoL3',1790999234,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T03:47:14.115Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BX5nIMsr-czXDw-rOrOBvpbDTwWAvyUI',1793452945,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T13:22:24.519Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BXHWXFVTK3x86ga9RArQadZbPaZILiBC',1792140174,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T08:42:54.232Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BYe46RAOxGu-hXu4bNVedhuN0BGkhlpY',1792585720,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T12:28:40.284Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BZxq0b9QagiZOxikD1L6C4RATHpLzwsl',1792586942,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T12:49:01.598Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BcfoPJJ1tdJfR4_APQO5f7QoZMSA7O23',1791209221,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T14:07:01.495Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Bdmh00fsvpRTwAkWDDSlRGuyIe6ekGi4',1791730735,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:55.244Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BjGtnqz6pZRCikLoH8A5lMR1l9q_Vwcy',1792823667,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T06:34:27.290Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BlNku3kiZsI3ubUZ1XBgwPO8ma2yZmJg',1793020047,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T13:07:27.090Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Bmxxss4aOwwzZsFhu0r7e7wDBxmVRrG-',1792455094,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T00:11:33.764Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('BoRWo7LDyygebhG2O3QhWnbiZ8gOWSvX',1791730691,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:11.408Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Bu0wdvNKfHTD2UUfa0SHqzmXHRRTC-JS',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.095Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Bul6dm0xq_cSSVxM5fOW8rtTfkd-Mcnz',1792338311,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T15:45:11.193Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ByJl8ef5_v1W6KjTmqp9pmkGhrSu2hII',1792489132,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T09:38:51.630Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('C2CYX48YLZGR_lJVJoJPf20z5q4H_V43',1793064055,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T01:20:54.802Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('C7RBI37G1TyMyxy5hvSnNk3jQg0nQ-P6',1792847958,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T13:19:17.516Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CCMafHJDhn2OKfWsTf9DxSafAvX-NLj6',1792780253,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T18:30:52.633Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CCkFRaJHFvXh-wq6NyeklNH7DcsDM65J',1792868382,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T18:59:42.145Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CDXRLnQHBoOfGcIBzqM0mUJTgdS4lX_z',1792916884,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:27:51.272Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CEU5YugzoU_GeJ_pDCxOBRiDylJ4I4u0',1791641767,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:16:07.465Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CLxvPb8NXA6nuoVFF6LGqM4PTnIhSynl',1793007465,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T09:37:45.289Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CLyMwkc1t2AnqwDejlquZF4bmiuewX6E',1793277285,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T12:34:45.236Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CNEjhIP-arEOFh5dbwkJWyW9OgY3lVWj',1792453864,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T23:51:04.226Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CREygDmDOTXSrFqphideEPjc6i3BXGIA',1792489139,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T09:38:59.375Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ChzfbxhQRux0N1fCF8B7Nmw7ipt17Jxw',1792526614,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T20:03:33.878Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Cl9gp-7b0kWNWU0EUF4Z8IR6mvgbqWFK',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.627Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('CpPM-FyzXoMdh4Ari4c4288WRtpSpSLn',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.506Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Cwgm87eFew9LZMYjwpFHzyjjRrqojpKg',1791019354,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T09:22:33.885Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('D9525sUgGCMNh6dFTpCcPhki0m3SAeZ3',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.510Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('D9FdTh72our3BfEhVOPnkMJPlDNnsL_7',1792665416,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T10:36:55.614Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DB2bpwhXjB51nUqThpN123GGs0o1Lzpq',1792698665,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T19:51:04.649Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DFEYv1vgtCAkwiQz5i020iEAK4LhvLxY',1792189664,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T22:27:43.619Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DGH_WhagYHk52bxuZ18M0CvCQ0xno31W',1791730770,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:59:30.215Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DJjbnIB_sZ_xUBPc2iIpGzPAVMPnWFbT',1792747588,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T09:26:27.630Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DJmofxIqAqMVLmMWHqOwKKPmIR7FtAMc',1792778076,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T17:54:35.738Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DRfF9kYTmb2dypZkKSUKFOIPt_k1Nzs9',1793281934,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T13:52:14.489Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DRtubhzciLGjkLGtS6nnC3c2SnU54VH7',1791109775,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T10:29:35.442Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DT-uh0nsGzS5gTBSET-i_Zf50GqLSA5J',1791647338,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:48:52.451Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":14,\"username\":\"9898989696\",\"name\":\"dps123\",\"role\":\"student\",\"school_code\":\"dps123\",\"demo_mode\":false,\"school_name\":\"dps\",\"user_name\":\"dps123\",\"last_presence\":1789055332447}');
INSERT INTO "sessions" VALUES ('DT0llLpBokzd_zoX5fU9MAFb1G6YgYSj',1792210920,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T04:21:59.887Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DVBOejaiRRUaA4vpsxPNs8penKJfMXS5',1792256513,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T17:01:52.602Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Da5BnNkT7rwpbMEK2nNct-6jP9IGeCev',1793280483,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T13:28:02.729Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DfYd2BZcCsNFuNZ8wki3oyjmn7dARJSV',1791943117,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T01:58:36.811Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Dg2CkASmZgrarjm7xbFemEm8Zmn5ezYs',1793016898,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T12:14:57.708Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('DqJNtUJt4Oo9TAAjd9IxRCpfwc5WQVkz',1793011095,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T10:38:14.584Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Ds5-wzOnxyPQCsKgiUSQ8PgdQx6XsV5o',1792738236,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T06:50:35.599Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('E-_exBeRJafs1avVI42OH5y9Q59vfoT7',1792157124,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T13:25:24.494Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('E2FxKeyCp2soqM9z6dpVQOvELApi_b_e',1791803526,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T11:12:05.995Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('E6o2KnLl2lOWkfR15tisXi-kwCyba-PR',1791719569,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T11:52:49.124Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ED3WGEo87QS-UpfGoyWrsW05NtRNMQ0L',1792281490,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T23:58:10.462Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('EEWSO5zQHKHKjOnY0bMLdmW7IUa95MMO',1792886341,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T23:59:01.105Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('EFqwZ8VOqxkJMLpLsv00ZqtFXay8VB_1',1791858156,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T02:22:36.078Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('EMR1g0TPfNDOuWuRioFFYiGyQiUMIRwO',1792751831,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T10:37:10.908Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ENkKaQi-woKBgvxpcMxgzwE-KaplWR8y',1791202165,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T12:09:25.152Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ES6LzW82G9_tLw4bCT3r-8_81fpzP1Qo',1792922430,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T10:00:29.591Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ETNEvrSW1-cGXf3ZPCnII4nHhZ7YAv4z',1792097938,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T20:58:58.143Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('EVwjiBxZCZ5nYHvPugTcHdV3pCSCHcEo',1791734714,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:05:14.038Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('EXTJVUVodUNLtDdr23kSvyAZW3l1DR4Z',1792471493,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T04:44:53.447Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('E_3N5xFBpefOnKUN7db2FBSp1yaHlUcC',1792146881,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T10:34:40.560Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Evh6fW5iRWI8KtLnQEaaMvYFqFihn8Kd',1791720989,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T12:16:28.843Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('FBJbzPHPH9M7j9tixGEGpdPr-3D_Pzhv',1792132197,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T06:29:56.695Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('FLl9B4TQuf48mealjaPjYIZYtGzXvXOp',1792651678,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T06:47:58.469Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('FMHwcuFiV66C2V_1vTsAMj7Sv5cv-scR',1791031470,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T12:44:30.273Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('FSMkYINMuXVM3FhzjHG05y1NJPLXr25g',1792424793,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T15:46:33.082Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Fe4UuZnDi0C61XBxXFHvRhavghet91oF',1791972265,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T10:04:25.014Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Ff_fBd7HodHEVwGcz7zVkImHlpmKPrkA',1793276044,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T12:14:04.372Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Fjeqzw_ILPFdn1ZjKg0cvnuX0cR5Iodc',1791644713,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:05:13.065Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('Fl4Bd9cfgDp84QzbsGdBIpi9_5JqbHrI',1791196209,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T10:30:09.412Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('FlpnszxeiIUfkOQPNZjSndPv3H8pJL5T',1791968391,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T08:59:51.240Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('FqjmBqXaEOTysKqyHO-9JTV6YOSloAZ4',1793235421,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T00:57:01.426Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Fs6MZvKTd-sjcYpRtEj1BhzZ-A_qsFEM',1792764585,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:09:45.048Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('FtbD_Ri8LYdRCkVFAG23pdNYhEkOk5Ge',1791664561,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T20:36:00.786Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Fyd_l7sPFmq-aBODCgxs14DOsld9AuR_',1793171624,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T07:13:43.597Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('G1Z_OTAz9QxLiTf9lGHmnG6n9dSMlh-Z',1792471494,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T04:44:54.399Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GAcIEC5yLDTIhbPdg7CWj1zYNfc2EmL8',1791179616,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T05:53:35.901Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GGCv_RKhi-6KnYNDO-v9eg8fh8fFr-Mi',1792071193,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T13:33:13.435Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GGgg_FhZve3F7-JKCmDo1FnKeWcS2z_c',1790958251,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T16:24:11.023Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GLMleWBU7UW0N7PaizkLN18E1HApo38Z',1792246169,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T14:09:28.751Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GMmDd7-XOBE9pZd5cBXh_pChGIuISyyR',1791369054,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T10:30:53.604Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GT8_5bhRtqVtdxVxRksX5fGHHFtEzNh-',1792899234,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T03:33:53.900Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GTdLrJetGxA8Yhn2ykpjB1Cze_Z_grSj',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.675Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GVL3aK0--_F12OYImfAl7BzOTnTFn42P',1793339098,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T05:44:58.245Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GVuSjXZkQ0D2DWmHpjIcaGyOwc_hq1gw',1793312171,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:10.738Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('G_gZsswV0YXcSD-qMT0qTtY55LJzTbiJ',1791730830,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T15:00:29.992Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GbYUln4uThGVuqO9oK-ZrE4RckKVe0cz',1790937343,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:35:43.301Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GctEsthKS1HuD6ofIcHn5Iu2ltTADBGH',1793011254,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T10:40:54.191Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Gh6kZcSrWTtwiGLZshUZm4Xouj4uXXgm',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.448Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Gjs4-0GJmHRchCdQQaasgXmZb3ImsnfY',1791676337,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T23:52:16.548Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Gm4XOEcb_UgeBe3RONFHh34vGfxVu51H',1791737264,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:47:44.086Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GmzGsFK7xO2RtbM6g5D6Y6YjrYAgmJ7u',1792689633,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T17:20:33.302Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('GzL6CoImZH6vYojrisLN3dI5DSw0ARV1',1791774411,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T03:06:51.230Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('H-EuQ2R-XWlTXk5AncCmJs-3B5AVCTKs',1791730698,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:17.813Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('H2DRnmG0uMDKEnUWvQe4MvT_RLI1Cm8O',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.147Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('H361lg5y_kCrV5Ex7Of0lKUpzLQGF25E',1793212279,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T18:31:18.722Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('HNhKVwLvcXtrtAR-gEjt7O4W1Ee4nFeA',1792771982,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T16:13:02.119Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('HWS9rxcFRhIBrk6vY0Sh9dqWj2YD8GQ7',1793510398,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T05:19:58.172Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('HbYK1fqZ4vYN643fOaSKnz-Yfgob2dVj',1792544031,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T00:53:51.430Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Hh2dhAPid-XfOe0jzEE9YfeMdJLFDfJa',1793183671,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T10:34:30.619Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Hm29_3Bx32dJ2wDZZKXdfQmLc883NMfK',1792868384,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T18:59:43.629Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('HpiPToUdRt4aKF-iRpPV1JRiTKEC1Xid',1793312180,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:19.525Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('HpngYw9HQBUqG76V6vwKwF4nT_wd0Lub',1792766190,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:36:30.264Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Hpt33ePezI8DFRFoU0h260QvLJ-GIJk1',1791741541,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T17:59:01.325Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('HvuLm226gbWW1SO5tWRvz2f7hBmiURED',1791661188,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T19:39:48.349Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('I45JRFDdqPA6a-v5b8TRosFWBJntXQWm',1792861367,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T17:02:47.275Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('I7IkfGoO5wL2ArOk16KqsuxyfTkNykQN',1791644210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:56:49.648Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('I99dFMoxJxVnt9ByXbtlhf4IBrnn-pne',1792505326,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-20T14:08:46.029Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ICGnaR_d12nJcwVZpBEKjGt7i0zb65Y6',1792920314,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T09:25:14.070Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ICoJU0LFP5Yd3f3dY8-yC1zny95D7FeT',1791641120,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:05:19.681Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('IEceMdxkx9A03g6eVbSP-FzDE1xAbx_y',1791730735,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:55.237Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('IPhTVYWt_hs3FX0KUe98aJHIvWm8wGJh',1791676338,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T23:52:18.275Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('IYBX8wWG4W0bFVp7s1lKMREf3u1dA3RT',1791121995,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T13:53:15.305Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Ia-X3EU_5WG_o6EVvw1gToBK8T0K6DqB',1791730708,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:28.040Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('IbHDTGRv-eBK5nniF9dWaUyAKYFYGYHE',1791048989,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T17:36:28.859Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('IcQCiyqksx_gk5FBLzURMQ6qqYcftpU1',1791135767,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:42:47.143Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('IhG-wtUHOTMVXnKlX_FzC4l_zZIBAHTR',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.214Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('InyRda5pez2cl2ufomlDTFHsuvSDm1rN',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.642Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('IqoDzlaL4pqx3w1UmxO_L6z8mO8XQjh0',1791650219,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T16:36:59.054Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Isyyt5i9nkxN7PnuS7NY2rWj094r3wBp',1791086235,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T03:57:15.149Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('J-ih0secq0rotmv13ciTnChqZKBx4GtH',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.610Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('J2qArysiutXuYXc94qDjxkyLWIUrom50',1792850326,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T13:58:45.675Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('J5Xxw21vW8Cyp3x3NAfajHY1wtS29iRY',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.239Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JEdaGnqQx5_1TdBddXX22MrLmqCuA-_B',1791993656,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T16:00:56.154Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JFUdULsBZST0KSZg7qeGPCHknv31Ork9',1792047060,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T06:50:59.517Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JFpGvGd-IkCuKDWgnzH0Worz6G44Wm_D',1793491247,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-11-01T00:00:47.309Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JHvLa1NqcIRHtsaJ7Y7zcW58Tjt4rBFa',1792471492,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T04:44:52.418Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JLtfwExl22Uc3IoiFal-i7ywLyyUoWAT',1791730708,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:28.044Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JSNP_0rlOu0rko77SXStsEd6KKYb_uLj',1792444301,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T21:11:40.659Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('J_xkbY7gVoc3KPBCXI1jzorG7O2g1j_I',1792813751,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T03:49:11.345Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JaMXeZ5T4yPr2Jqiz1tsHuzr9LrLlxfr',1791921213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.902Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JdPUMyMdYmd7mxc4DLeibNGtAkSgfx0l',1793367676,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T13:41:16.216Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JdnDn_Ty5dH4DjuGRofJjgKsPhUFO9QV',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.633Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Jq2eK5gftieqCjEqXlSv4q1x39jnCyhY',1792592690,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T14:24:50.191Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JviRXz7S9hBG1pfv0dA4Ineo9JCGw-Lv',1791023366,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T10:29:26.285Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Jvx3WJjWhkdm-RAXe3fhND7Zfe0-frTC',1793356774,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T10:39:34.323Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JwBz_zT6Xs9-xPThSMTfXHHNiz66GJ1h',1790935556,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:05:55.572Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('JzYXVqNlTp9KL6oIGIAOVUPLE65kRfhP',1791801851,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T10:44:11.386Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('K5_KpUXnlXjMmYEGaWEJstVlEmLA9hKO',1792917672,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:41:12.174Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KBfnQ1Z78KBj6QFf_Z3DprOSmz5L5Acs',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.131Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KCpnd0t0ddNVRb1rhR8LrGY4AhTzWeTN',1791080817,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T02:26:56.513Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KOEOpOf4X6_LFPaxlNjOA-Rs_GxHz7G2',1791121995,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T13:53:15.491Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KRQoKZRUqlkIucCuOk7J3WRprEtmtONH',1792753064,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T10:57:44.260Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KTPuf4viN8yaCQG44oR82uJotLfRq_Nk',1792015724,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T22:08:43.717Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KTbWIogSQ6MYTaYglrq8nQrQDnrYsNrh',1792233302,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T10:35:02.344Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KXjxhd4prOlodQIMeIYjvIL1UwIQ15pj',1792526648,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T20:04:07.572Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KhyrN_7oB7S9duMkEhSfSNTAh4gYEigI',1791921213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.703Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KpSjpo6xg4YyKkKDbuUHdwgvvVLyGPaJ',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.513Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('KuFncAXjEe0v1StYgq7XslKtIjZJoVHc',1792274785,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T22:06:24.848Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('L-VNJ-GyD9X_Wb2BKEVa_2yfdfbTZ-5D',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.128Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LFaw3bq6is7F7XvhVO6W8NR0190Pv9OX',1791368642,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T10:24:02.192Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LHljahtq4AY40bnPlmfvLxKrQO5536h-',1791815096,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T14:24:55.740Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LI6RcBmX0-_v5wGnaOyNUPyHRIQPWiLp',1791028631,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T11:57:10.589Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LJhGVqlgUyDt7lQP2FsTwQgc5BRzn-ZO',1791639982,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T13:46:21.523Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LNAc4Egz-lnYYBeBN1HYwvhBTHXHS9Cp',1791719569,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T11:52:48.505Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LOJv7f37QiMzyP3SWV6Y06cKg2YJSXtq',1791102419,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T08:26:59.472Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LQvhekJjJtI01Pq30bh_fJupx3-dPlmF',1791697693,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T05:48:13.323Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LWqYe6DbVUBG5_wRIS3fJYyIEQvwQtBm',1792623929,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T23:05:29.305Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Lc2fWFbj5tuemRYl3aitWDY46D_JB9xr',1791305727,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T16:55:27.314Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LiVtQKC-j4GKBpG5M1XC_jN0_h7-fnz5',1793462475,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-31T16:01:15.143Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LkTY2SKq8bpx1bXEyCSJhgPnWT6rc2w6',1791347873,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T04:37:52.888Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('LlIqLh5IVpDtF1etbst7YVkt30dvHqYP',1791386149,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T15:15:49.363Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"user_id\":\"23\",\"username\":\"9898989898\",\"name\":\"Librarian Auto\",\"role\":\"admin\",\"school_code\":\"AUTOTEST\",\"demo_mode\":false,\"school_name\":\"Automated Test School\",\"user_name\":\"Librarian Auto\"}');
INSERT INTO "sessions" VALUES ('LwS37Aq2EE6oH4fvjz0auyRhDqAGWydp',1791777947,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T04:05:38.800Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":\"23\",\"username\":\"9898989898\",\"name\":\"Librarian Auto\",\"role\":\"admin\",\"school_code\":\"AUTOTEST\",\"demo_mode\":false,\"school_name\":\"Automated Test School\",\"user_name\":\"Librarian Auto\",\"last_presence\":1789185938796}');
INSERT INTO "sessions" VALUES ('M4N31v8l1-sfQnI9AkwW2sdREXHXqJLW',1792073279,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T14:07:58.714Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('M5B7qn79sqqUPMnsFSL9P-XPwTEUzp0K',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.423Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MAWD6KEnQGRAakyZGufZZJJFY3baG_KC',1792565778,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T06:56:18.373Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MC1eKfjYOIcua2a8kJ3smJMHR2mi9mxM',1792459821,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T01:30:21.004Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MDW1bZ-sXPqPps_LNaqVKp0yItTVbt-S',1791688812,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T03:20:11.916Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MGkbn1j2g32kNsnvcwYXdVeCaJWZ5Omk',1792875035,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T20:50:35.396Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MHVph_grKaWl2Tt0An5QxIzlacZFHex-',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.607Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MJvqxt8drAl3E9vxLyHVR6TtQrucQaVw',1793276856,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T12:27:35.757Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MPOsCpj6gS_KprBvjxxjZ1zA4JM-JLeG',1791775605,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T03:26:45.095Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MZxZvJDFIiXZ4GKnmj24QvOJv6qAKCEP',1792758738,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:31:48.197Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":\"23\",\"username\":\"9898989898\",\"name\":\"Librarian Auto\",\"role\":\"admin\",\"school_code\":\"AUTOTEST\",\"demo_mode\":false,\"school_name\":\"Automated Test School\",\"user_name\":\"Librarian Auto\",\"last_presence\":1790166708195}');
INSERT INTO "sessions" VALUES ('Mol23Z4VdM5vyWyphc6S7gyrFUv21ctn',1792004105,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T18:55:05.089Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MqCDq_5h848NkmOyUy3kdvPfc_1dHzXV',1792875034,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T20:50:34.272Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MrnYK1xY3s9pnUqHWdtLKMX_ofoSGPLY',1792766607,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:43:26.655Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":\"13\",\"username\":\"123\",\"name\":\"dps123\",\"role\":\"student\",\"school_code\":\"dps123\",\"demo_mode\":false,\"school_name\":\"dps\",\"user_name\":\"dps123\",\"last_presence\":1790174606613}');
INSERT INTO "sessions" VALUES ('Msic75WyxYcb12FQOWg57_1DmGkxkIsp',1792874209,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T20:36:48.592Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MwdpkX6nLLssmHUpi313E7FAhIIUWKa-',1792567904,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T07:31:43.536Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('MyE4Gwj_gs6PRv-Tos9UVgy66C-QGDCx',1791134309,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:18:29.242Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('N2M-R1SJTIgzq2pbOmEM04X0Fcf6znbY',1792487328,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T09:08:47.504Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('N8QaKPIzj0JwnUFfG4lPwgWAEYOtyVcs',1792785586,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T19:59:45.502Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('N8wRlK7lTU1aQuv3Xz3UmB5f7mhBWdRr',1792256511,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T17:01:50.815Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NIP49U7jm4Kyl-OW5Cr7vHraBqEHNKux',1793245883,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T03:51:23.317Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NJoINPFrw5N5fBcg_eWanCuhIt0WebiQ',1791168203,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T02:43:23.267Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NKgHG9kYtkxnMh4IGVSYaKc3EKShc603',1791801490,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T10:38:09.754Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NLLwUjk71TXbu0tEuXk6p06sls4dAbPm',1791730759,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:59:19.451Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NPGGphmn8IegH5Tu2pgiHoa1DvMPX7qy',1791042525,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T15:48:44.891Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NWLYYYr0tKr2BAjXaiEphVnSFE1ML3P4',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.249Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NYut68QvoL25KpBxrcsLg_KssAAryCYJ',1791717739,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T11:22:18.805Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NfMtZ5_7su-LfevhWMMQvuoBUGMP1UVc',1791966883,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T08:34:42.898Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NgwxHuM5nI7PYvFWG9hPvDBOLM0GuCmk',1792795795,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T22:49:55.185Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('NqujnCfD_XAU_amXtbi8kddRQxocrN_h',1793470067,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T18:07:47.098Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('O0zgSgMFXSY4B3Lj3JvWdKWhMqr7zAxP',1793359966,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T11:32:45.771Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('O5FEMjCjV97uVtbllXN7ukfYD3jX4cTh',1790961836,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T17:23:56.096Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OBC1IZiig30Exxl8j6tToCBHFvMaQ7vk',1791246165,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T00:22:45.053Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OBGnWuIAn-7mgjVYUz6dduH6zQcftphS',1793372487,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T15:01:27.096Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OBsFVtPWW7xSH_f8W6BIfKYSKoiVAu4r',1790963360,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T17:49:19.886Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OC89eOVdhdgHpNSLWVdofcJLg1mZ-1jZ',1793337938,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T05:25:38.475Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OCVFOuym7WWzWF7VqUQLBjO2ogftshIu',1791167298,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T02:28:18.308Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OEBylZTsBduPznCzcvhHKHbdtbb6Pgjs',1793312180,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:19.777Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OK2MRfwmOXJHlvh2IXdOpURaXIt58PNj',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.058Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OM7u6FqHJPoM3g_N2Ss1G39Oiz9_dIcA',1791047423,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T17:10:23.127Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ORCNjkQc0Xb0ZN-B6ViVxge3Dz0SIJMj',1792437883,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T19:24:42.770Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OUBh8u3z6qJBa6xXot57zYch1xjYFCM0',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.342Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OVFMJVy59D2Nd8uQiTBagwjxMkZAcUD4',1791714779,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T10:32:58.564Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OYaNOchHoda5K9IrOYALcq8oJZ3vid8b',1793015585,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T11:53:05.148Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('OcAsmVZZlOPfpARP63_a6EtTwkkcNTwo',1791730873,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T15:01:13.184Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Please log in to join this online meeting.\"]}}');
INSERT INTO "sessions" VALUES ('Ogq9e-uLSYM17LY9Piox9ZC2eTCWtxJ0',1793307920,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T21:05:19.852Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Op-g075u8McK26oUpLm1YXI6STYFgR4K',1793392598,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-30T20:36:37.652Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Ouz1jVcNKjaAduX_FDSE8TA6orGvqHyT',1790994441,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T02:27:21.211Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Oy_MS-T147WyBeXtGt6sokLIPrjmpSxl',1792514527,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T16:42:06.968Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('P1l9FMrusjnjyn7s3sRrs7CXarySMSSm',1791639986,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T13:46:26.124Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('P6FtfsZKq9lK9SQik1kvOOrbl6PSMhoL',1792623295,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T22:54:54.921Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('PDjCPj10g67TMbeygVLllwsxGdJBQeCW',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.197Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('PGBDwqZ0YHkDrNeF0SiARCtuuTzu1WN7',1792848211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T13:23:30.693Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('PWaA-TUFEE6y5UlkUjecBRxuimdm7Ika',1792767375,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:56:14.960Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('PajL5mJ8jCIbn7qPxJaVMy1GK3H8Cb_-',1791086235,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T03:57:15.401Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Piwg6i6cJzz093mm5KB3VEmRb207HRQL',1793199231,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T14:53:50.937Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('PnwUxgoIWAYeePf2N2vIePFQhBZNNPs4',1792689625,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T17:20:24.888Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Poa7GF7P5NVnIYRcpqXvDVY61QqIetbV',1791260287,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T04:18:07.013Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Q1w9Kt0ySqJVltvPkA4TXgt6G9Nlts3C',1791938767,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T00:46:07.226Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Q4nY9HX8yFpWRtsKN7GFPCPtL51pgoow',1791016484,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T08:34:44.072Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QBtx5-9cX5fcOOcwFQhuctfThFipKGKw',1793066160,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T01:55:59.772Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QF5KQoLJSfj0GjB-2Pt6M3jDPuej1Mbd',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.225Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QJjgSnvI5YqRe_RPFPSKg9_EAMsHkeRx',1791377556,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:52:36.253Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QLO3kAHjtew9UQFz7Kf7BpKAk2MV3v4e',1791918784,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:13:03.923Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QRbVN_OvYqDNcDW1X38azlDVzvqBS6Cl',1792859327,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T16:28:47.259Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QZR90ghnOgiAnOKleoPqZ2IJkj_3DwB7',1792862009,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T17:13:29.115Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QaDzN823itLvdhQFuHs3MnQwOtWrIR_a',1791644214,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:56:53.633Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QalNRkRzZOxrnB3u2PUu-JwQRz-FwyOX',1792290350,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T02:25:50.412Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Qbt1gGtFpFGirNAa6onCDiNbuc8geaX3',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.063Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Qk68O_BlAIxyFNDZSiZKD2EwJn0Jp_zW',1793257414,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T07:03:33.703Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('QqUIq3WgCJqCscPcwh-POKzf58hmyung',1792137047,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-16T07:50:46.968Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Qs8TkR3-_JYGKa6jDnNKTVPL7JK6P0o6',1791285052,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T11:10:52.025Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('R26vY6B4JJgMTzHBSJad581G8pZ7t-35',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.073Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('R2pGgjgnY-mI61nmLq8aY5Pz1edYqdx4',1791935199,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T23:46:38.586Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('RM6VBb0TzqEjfi_sMsnwOHFXgrQunovC',1792316603,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T09:43:23.210Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('RNJLLdAzhderBi5kmlfVUZmcfdVPmws1',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.411Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('RW-5MhGnE8zzWu78Up0hhY1eOeQUFWaJ',1791730735,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:55.241Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('R_W96MgRT433spFyXRjlzxYsH3GHSh3f',1792755606,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T11:40:05.724Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('RhIY44mRfNk_Gb4j5oRuHozCYtbcz1xx',1790962542,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T17:35:42.341Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('RtXZMVoKzcQ_qph4Dw6nJ9ZkxZ6SBKdj',1792838242,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T10:37:22.327Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('S2DlLMwq9LO9jB-rIAc3H9HisXKJzt8T',1793513309,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T06:08:20.017Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":\"23\",\"username\":\"9898989898\",\"name\":\"Librarian Auto\",\"role\":\"admin\",\"school_code\":\"AUTOTEST\",\"demo_mode\":false,\"school_name\":\"Automated Test School\",\"user_name\":\"Librarian Auto\",\"last_presence\":1790921300009}');
INSERT INTO "sessions" VALUES ('SLRffiwJ0iscmvY3YyVlBP2BfoRrnlai',1791352499,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T05:54:58.666Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('SVihSgtjpbRuh5NCrYUif_WWwzl0lMkM',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.670Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('SVx6vRZDpReRIttM40KIA-VifJwFXj9O',1792758590,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:29:49.860Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('SWqkspQ9GE3wt2V4cCV4T6URBOqcOXwc',1791199682,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T11:28:02.163Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('SZWOE2mBzl0m-AXVu0OZAlIp3V3N1skE',1791108924,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T10:15:23.925Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('SbbCDx3aLlEa0O3Rnz6EA4-fak__JcJt',1792709779,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T22:56:18.923Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ScV4hQ98AejnPDj6NDtrzleuFTxeydRt',1791134833,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:27:13.276Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Si9LbC5HubKEkoDP6EpqjJb5cWXd6oJC',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.072Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('SiIiHyvah8UqD0tkz2rSun7pIqBIJ7Z-',1791024394,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T10:46:34.403Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('SviFMvdLEpEmAsxFEgcGANENIQw113Ms',1791703598,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T07:26:38.019Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T-pel_1YRIqshJfcZLSJYgkwPqMDblCO',1791051319,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T18:15:19.347Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T223T_Ly0t0D_hZis8Io8gBNkqt66D5V',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.265Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T2fqKtQiuDupBB3ziC60beuzMW9sx4rT',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.990Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T4Ri90p9v-NMN7Ewp1QUCeX0U5rQkrfh',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.067Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T4eJONxXg5uJK3R6QeKEMaH7rtqPeyFw',1792209474,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T03:57:54.217Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T7DDRhX5jw0LFVc6qBYkfzQ9vHSEe2Pv',1791641117,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:05:16.997Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T7UjWi8t2PjBgNZb0xL_jC03ywmuYFQ6',1792894735,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T02:18:55.028Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('T8ti3z57m_j5L6_c8KZf029i4nvv90Fp',1792711318,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T23:21:57.555Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TASJ4he0fRgQbQ0K5lzQMEKW4LYObVz3',1791829970,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T18:32:49.881Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TGVAPTdpvu9NhreqmLO0jwA5WWMypuhG',1792788759,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T20:52:38.960Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TJ9hxmHXui8eaE30lIKoQOHudWrATSrk',1793083744,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T06:49:03.614Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TOlPMUu9YYMB7_fyQROFiSM1zU0FLpPI',1790961837,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T17:23:56.640Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TOsH635-zRvdGBTu3MDB_7lvh_Ewkm6-',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.611Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TS1FMBpv-tiGKsrVyQYyKQr444FpCz-e',1792654661,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T07:37:41.464Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Admin or Librarian login required.\"]}}');
INSERT INTO "sessions" VALUES ('Tc1pFUx94Mn1tCkf4YTKlQmGZsLLCZax',1792714337,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T00:12:17.221Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TflbU6V7PKYM-tCNl0wC3qCBJXLGVDqu',1791643244,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:40:43.688Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('TgEuRNuPEBC-AN-GVkwaRj9x5LgG7x4m',1792285000,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T00:56:39.986Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Th4BkKKfm1wXyYNwhs4-RkUbjHo3XNwl',1791805678,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T11:47:58.335Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('U2EDDL8DRTsjArf4ljMba5CH8sjy4u0e',1792324289,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T11:51:28.755Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('U2vl6Swk5pa7ma7tKUtLlN5pPi_-xWa2',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.239Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('U4QtT-8jeCbC4Ejnx_DwWeja2pLh5hB_',1792578999,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T10:36:38.690Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UA90kl2WB3QjdbM4jiG-8wR6wqeSgkWr',1792859326,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T16:28:46.075Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UJazzjq7zMVWP8GTgUgBbZ3AdmU7Iq5D',1791178924,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T05:42:04.197Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UOw4Ek21J84mjxRWpAD4H-9uDVkBzBZg',1793264736,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T09:05:35.572Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UZZna2OeaA9PLIhDCkNqai0V4wSaPJ2Z',1791801194,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T10:33:14.454Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UisSmUyUrDBtiv0wQ3Kig-rjQWCQ7wz3',1793312181,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:20.535Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UlzwPZmOFvAt9KtOIinVsUTQLxxVL5QV',1791803590,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T11:13:09.928Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UmQtJcuvE3S-lAgKFVG3MvJeue8PqaTs',1791244374,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T23:52:54.314Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UoNiFwRjPcID_jtQJd_8ouXK8hsud5Vq',1791651335,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T16:55:15.169Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Uov1531I7FxwU1esBF5U2NTO2oUveDGr',1791285059,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T11:10:59.200Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UxcLaziqtXQ-V8qbplhjaYpZbDttFOkQ',1791943015,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T01:56:55.100Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UyYfQnmkiiJfs03b8PTirW3Ewbzp6rvD',1791858154,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T02:22:33.629Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('UyaEDyQcx2Wfo9-6ib8P9kJzu7xcwnoy',1792257307,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T17:15:06.932Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Uyi0s-vSNqzLi0nehEueVhvvbFy1l7JD',1792080759,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T16:12:38.958Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('V2b8d9c6eJrNkyeYM0aDqU-Yv8pmzZZs',1792131528,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T06:18:48.423Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('V5m60RPrEqG2AWfxg5Z7vMDTkGjZSjN0',1791021625,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T10:00:25.290Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('V8lF64XaIGN09Yuc7Re8rA1z65CFcoMa',1792459819,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T01:30:19.048Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('V9Ay6BqWEk7e4GrdeGjrSJLUe5bNvml5',1791734716,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:05:15.965Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VFb490C9aIQPPl60LfidX2cFpjoJqiUt',1792311970,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T08:26:09.992Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VHC1GERTjWBxfA9E24lBPsKEXxy4f6xJ',1791244373,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T23:52:52.851Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VHbUnTgscYz1XEksCkzQqxwIhkusw3ue',1793305184,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T20:19:44.496Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VNU1zWweBkI9TRzSwIAklFS_dZUIar-3',1792289272,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T02:07:52.469Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VOSBd6Dlb4fDycAmKvBLn76d9GJVVhSi',1792402770,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T09:39:29.957Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VR--kN83RMtAcJl5cO9c0pvrzjjGonNw',1791042594,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T15:49:54.321Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VR3hH5CEG11gAKLtAaHjS1feFyHcx6Kp',1790930804,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T08:46:43.897Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VROUy9kXANlcJJNEkr1bAuulK1rlv3MI',1792232461,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T10:21:01.145Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VXPvkoUc8H5yTfyXZSSVDCHe4BWFg25H',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.123Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VXdoq4xdQxQ6FtL49XSSvE6j8twQLEaT',1791647983,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:59:43.340Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VmRd22xoz3OUlyBL-zZAXUadtFAz11o6',1791165935,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T02:05:35.380Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('VxQw1NU-iFwQ5b0oDckjTUxz4FTdbbYB',1792638701,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T03:11:40.653Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WBpFugUXkRkPsGXzWsRuAuaAoD20h_tG',1792526648,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T20:04:07.999Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WFBvLK3qLz0wvLd-Xzbl_fXxLOS2DqQQ',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.501Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WFV_n2poH8pscgPoV1VHkIDXyGpvotk6',1792857083,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T15:51:22.947Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WN5WDiZbZjLd-r3wbl_oYOECC3KS29l_',1793499939,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T02:25:38.834Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WNUNxCADNyEBb3aYO9KXdLdxSyq3iLuF',1793003842,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T08:37:22.352Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WPQiO95Q-aeebwu008CjZejLL40haT16',1792459820,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T01:30:19.833Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WRpUIIw9NnFcnsTbYPSvKvq27aBVxgEx',1792678779,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T14:19:39.132Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WaUo2SOje_ty4wQr3m6FzNfkuNx-F6KW',1792894734,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T02:18:54.389Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WizOqysbxs55n5nP2gnAwle4k_YfxbeP',1791644717,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:05:17.465Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('WnQ9ddxMy1L8V5852Ad5tVyjqNfEQ_jt',1791966882,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T08:34:42.240Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('WqV7i_XZmuo-RVPa7WgVA6OeU63RQY3e',1791730718,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:38.085Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Ww6vufKfysBURDfHQ72rlefVp5UHHuq8',1791906821,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T15:53:40.837Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('X-JRXsfakZmiYzpdjdJe4XUV7ID-oH3v',1791201226,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T11:53:45.580Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('X5PDjlqCB4W9GObgXoa82bmrz0GTj0Ob',1791134301,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:18:21.430Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XIXvx8bWrlisdIYb916EupEayq8KmPdc',1792839768,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T11:02:48.044Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XKvHtpqhLuSY8n2FQSdA8qkPOnn22sBq',1792916867,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:27:47.097Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XSlihAHwbPm9Vb_rVnZ-hFjcxsgtiEO2',1793326323,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T02:12:02.633Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XTRU0z3konyZKNDbE95GnTqkG5-wS-sT',1791748348,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T19:52:27.636Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"demo_mode\":true}');
INSERT INTO "sessions" VALUES ('X_5lst4ZPNV0REOhedZdlN1trtdxkVUJ',1792396046,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T07:47:25.727Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XgxQsCtQ-kmxeYr2f32vJQ7iQApuX_1Z',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.606Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Xi1JrW2aUEK9SVWVAwPwNIv0RMoYudPT',1791961620,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T07:06:59.833Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XiL3JcSH4lShDpxOaglZC4kfVWpZxIO-',1793140362,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T22:32:41.836Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XsJ3qEhKgplw1-lxgUzqNc4vsrvTK6pQ',1791028457,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T11:54:17.399Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XsqF8qd2O2GuAqZnu7fdJG0IV3RfX1wY',1793372487,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T15:01:27.387Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Xtfp7SQ1jyYVJjKC7qnqhalqS5RAzrT7',1793017097,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T12:18:17.168Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":\"18\",\"username\":\"8527198907\",\"name\":\"Ashish Kumar Gupta\",\"role\":\"super_admin\",\"school_code\":\"GLOBAL\",\"demo_mode\":false,\"user_name\":\"Ashish Kumar Gupta\",\"last_presence\":1790425097163}');
INSERT INTO "sessions" VALUES ('Xxr58FjwGZUfOpT9SOapCZQ34H9FS-iY',1792758432,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:27:12.032Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('XyNW6VhiI2IuHZrEX39y33aT-eWZ_ccI',1791822949,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T16:35:48.915Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Y4EpSbIvW94iPOWm5ohH6Ps5U6W6yEYo',1792310654,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T08:04:14.415Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Y90AdfrCVsPLhn7GK7fW7weXGhzYl83K',1791006894,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T05:54:54.488Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Y9A0LDA8xLCgLd3KlY7wS635UCQ89FK8',1791739023,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T17:17:02.676Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YAe5qbKPEnUzRCPmATSD0h1GanRlXh8t',1792336222,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T15:10:22.491Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YIK8jK-pAvrcVBB6q1uqT5XRuv7Zd19_',1791282622,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T10:30:22.196Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YJNeZcKRXXz8Oc7aZINvkBW4ko5M1fRK',1792949302,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-25T17:28:22.377Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YKpfJjmutYIep2Qk-RlyadHeoC84YSYY',1791815094,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T14:24:53.641Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YLBVpTK979brdbsDHLXt7PGJiH8Cc21f',1793251257,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T05:20:57.352Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YOhFa9FpKgc9qZ6AOH7yyaeFyvdmni5A',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.943Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YTS9QlOBpJRjtN1UrDcyDyT4C9GsuF6E',1791730764,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:59:24.188Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YbhLg3HDzB6aerV08zSJz8Q4IG6sn29i',1791645625,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:20:25.374Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YgNFulIC4i4xrED1P_FtyxTZ5jb7zL5e',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.529Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Yg_76IvegyotXDs5_0ZeKQFqG6nf6J9h',1793114770,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T15:26:09.564Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YhUyr32IlEqsltZlyh4WMVmFrvQciUVp',1791641173,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:06:12.600Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YqCAZnT4BIvIBfMMVR52t96bYLZ1UsDc',1792180264,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T19:51:04.156Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Ys2isPg8HU1rRs2WKLhhgP_6j4NV2xo8',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.476Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('YtyYSxE2qgtpUYmTG-6d8nV7BNuUHKAs',1793358551,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T11:09:11.394Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('Z1vdj6AIKVqWzbxlXQZK3EXACv7pbxC1',1793290330,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T16:12:09.747Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZEP_M0TGrnIksGLftbhkDYvmtlm_hwQ4',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.598Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZHpFRsE9SJ7qlsHDvO5vtJhdwDpVKMfz',1792918515,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:55:15.005Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZJGIQlxkCjgsl5-Zi2kFjPWl4h1TUMKz',1792583464,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T11:51:03.593Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZRPioN8GRjv9QISOWlYj8Putvqx2NN74',1791643393,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:43:13.483Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZWEJLeEmE9AaH1L_vvZsRpmvwaCe4bPR',1791867650,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T05:00:49.501Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZbasoqJM3rpGvktERCO9LvEB2xCcfKZm',1793245882,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T03:51:22.437Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZetvReAwMJdSsDQnvQdF6ZOKYV7NcukU',1791732679,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T15:31:19.180Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZhdrB8INtHFiwnP2bPHSg57JqILsWGlx',1791376853,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:40:53.101Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZnOzAAznVSv1DAz6XAbqSp4gipfK-UNR',1793499938,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T02:25:38.227Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ZocU7RsDra6FzyEjbdPAufZjc0aYSvko',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.744Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_5uOUZzvvuWCAH7AQrZKem2PRxeR2gi-',1793103591,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T12:19:51.163Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_BC3VlO2on029hEmYvm3HaMJtMP5ixgD',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.109Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_D2YJOlinAU7VIPr5P8jheftbWlHqPW9',1791645666,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:21:06.293Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_G7Nn3kQKRWloiOAJLDaq9C0GMlFQF20',1792049985,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T07:39:44.778Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_Ms5RUi8eoBf-QnCyEW7LW22UdKeSwOT',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.082Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_UmIzOi_t78YmbhqiLbOTyIpLAdnm6Su',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.506Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_ZXI-b8uMPu2xJUp3_HUaGb1pu320U6y',1792155535,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T12:58:55.277Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_bjF4l2tnkhY5Cdy0vNZ4Om9rAFyyPuF',1792308063,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T07:21:02.615Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_ggxW7uqgpo6-TwpAXpMMya5KSGd4IcA',1792071286,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T13:34:46.188Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_p9FdVVkhMCV_hoyJhzyxtNWhgtGfsEO',1791921212,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-13T19:53:32.326Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('_rpep0yB3twkKdSNIf9cO2n3OrHLxfRL',1792558478,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-21T04:54:38.210Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('a0uzqeza-HQ0eD5CV5UfFPr47vZWj8WC',1791921213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.836Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('a70qbxvo2x3LGycqJzzTpst0zYAL8oC9',1792414959,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T13:02:39.086Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('a8Ahz5nhjI2uHCh56oaw8UY8vdnJ7TXl',1791200652,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T11:44:12.463Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aGma4OjERRnD0Gq3RtDOcqw3fLbz2FfK',1791045658,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T16:40:58.026Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aHsDvuzxir3AzBKoCeFUvJekAd6oviEw',1792494856,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T11:14:16.083Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aIzjff4u5p_aqheyA_KufPTfcXnzebCJ',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.216Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aKwGZeG1f4rOkAPI5YUUzUGD5QV3axBd',1791181968,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T06:32:48.151Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aLyFGFpFqC22h2ZL1IfeI7c6k5hPgX66',1793409903,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T01:25:02.693Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aPA-T4Eg9HFPOkvLkSLxm3L6sSCasneY',1791135768,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:42:48.276Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aRIEeA0YD4TUkTR01tgcAsRHyY3q3rU5',1791640304,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T13:51:44.097Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ab3kVT4XkQccWvL3wN1TuLSItI3aZ_3l',1792392828,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T06:53:47.839Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ad9taeKxtOD7oZbdpxeMsP_emLfocxYe',1791006256,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T05:44:15.778Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('aipKYCOZr1l0U9fSctzhJtUMXYGiguGH',1792354446,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T20:14:05.774Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('am6GXLMP3qTfYIYUoZvC89TR3dY6EmFW',1792637513,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T02:51:52.993Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('arAZ1sE6u1X6Km4-LLiom7F7mwa6k80o',1791795702,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T09:01:42.133Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('b2cRYLkVxlKclYMHzVKPCFKbBo9i0whB',1792319506,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T10:31:45.895Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('b39zZ3noZkA4aLqiMdcwy2bxLeycD3Qf',1791820282,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T15:51:22.151Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('b9i4wiHf1BPnaw2wFoELrZKHdw3c1mWi',1791921209,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.421Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bHTYz2SFo1hHjXrlUqI4h19XRoMLCW7A',1792494899,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T11:14:58.908Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bSXezb7V0IVDnzOOSsDuvEjwcvZp2fE5',1792437357,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T19:15:57.019Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bUdseY08mfYe4HvAEfl96MdjeTEx5-LD',1792567904,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T07:31:43.645Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bbXBfyIEfJZ6rd0H12aML4GerdFO_vzd',1791733153,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T15:39:12.819Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bdD416Dbx3kYo5yLLv6dkeUoOUyX77my',1792854072,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T15:01:12.495Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bfi1NlYjBUaNjWCLm04je2X0yUuJOwuR',1792015724,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T22:08:43.775Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bkCsqQtrs2cNbo7Ga3JUqJysDsazoEld',1792054232,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T08:50:32.257Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('blpU1X-_C87JFT3TzZZsB28Ybjz85e8U',1791850834,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T00:20:34.273Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bm3oexJjanTZ8Ovfgoel4jWaGO0zCvl4',1793270371,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T10:39:30.616Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('btvBG-RCTohumN9je4m_mOtynqMyjUPT',1791730703,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:22.986Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('bu_ehkeR0WJDwvgMdxooiE_vUmn6rx92',1791692261,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T04:17:41.172Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":14,\"username\":\"9898989696\",\"name\":\"dps123\",\"role\":\"student\",\"school_code\":\"dps123\",\"demo_mode\":false,\"school_name\":\"dps\",\"user_name\":\"dps123\",\"last_presence\":1789100261172}');
INSERT INTO "sessions" VALUES ('c6Kthm9vb7j3MilsABBxHbhIzyz0f0hg',1791734711,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:05:11.004Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('cHMkU-orYE0cBtctKr1jewTz5v2DKSz_',1792319713,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T10:35:13.451Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('cKXLgVNZekb3_97qEWVpOg-WXF9XN0HJ',1791377429,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:50:29.354Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('cN0HSCsv_iqYn8S6--cimRwU-C4vf99u',1793146213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T00:10:12.992Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('cOAR3k-6Du_cK7Dw7DUmr6y1qtowzR46',1791199711,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T11:28:30.687Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('cQtOc4pS36QL9OOC1KplMEBlwQuaHR-5',1791890470,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T11:21:09.681Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('cTHHNkaBRJaYU-TJaPzv2QC3MOhC2M6P',1790938026,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:47:06.021Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('cXaJAsJqwqGibeldRh62amH5pacihAi_',1791108914,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T10:15:13.697Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('chEKfUPSxpL6PUU9vkMLIC0X2C_MLaV2',1793276924,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T12:28:44.355Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('d45tIXviQLsRHVuDo8hh9Bsgh0F8U_FH',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.133Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('d7tvO0roVV01ycN2KPYFH4S23gv3dLm_',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.211Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('dDDU0XxcOnYiVO3uUVHjtd6a19q_HBRK',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.243Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('dKkrXTMDTR94A_dgAVT2sebeQ3W4SM4V',1793470624,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T18:16:42.286Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":\"23\",\"username\":\"9898989898\",\"name\":\"Librarian Auto\",\"role\":\"admin\",\"school_code\":\"AUTOTEST\",\"demo_mode\":false,\"school_name\":\"Automated Test School\",\"user_name\":\"Librarian Auto\",\"last_presence\":1790878602276}');
INSERT INTO "sessions" VALUES ('dQ8uTqC2_VWwvSkEjikCIgkXkU1zl1gq',1791042701,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T15:51:40.680Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('dRnwYEI0g-zdDrPyYMD_vtUc85RUxil7',1791368640,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T10:23:59.795Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('dT8vYU7FFYHeZ1qSNM9TeHySh5Wf_DV3',1791640308,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T13:51:45.972Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Please enter both login ID and password\"]}}');
INSERT INTO "sessions" VALUES ('dZL3P_mATTcfu2AZa_eQHKe_1_udfieb',1791887613,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T10:33:32.725Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ddTQcaOuMLXePB2JpM1haKHm608ZC6G9',1792918705,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:58:25.483Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ddoqXbCrd2J3vmoM82-2rSo8WFZRvkmi',1793277315,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T12:35:14.819Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('doMl9r2I25L_oopm3xiMDnA4akP98tyf',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.420Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('dx_L5djQFkXKZ84Po1nPoQSvR-_YzLFd',1791246152,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T00:22:32.082Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('dxg7G6jNcSVakwU73bNgKbuhsYrJE0Mh',1792981913,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T02:31:52.917Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('e14en3OdkyvgYEmS0G9N_vohokPXPmsm',1793452955,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T13:22:35.138Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('e2RWVxFe3Kn0fwJ-4Apo5afldGRr8LGv',1792679814,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T14:36:54.257Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eD2MLRyGPrHA-XUK1AAMETB7YK7hRHNq',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.220Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eGxeKDOTxi96lQKIHNRV1sjkOY65cugO',1791730703,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:22.979Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eMtsEL_xiRCFpooiT7eoPbCKkffKUvug',1792406234,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T10:37:14.139Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eQFRCMgmt3xXJUq-IN5EFI1wmI_QLtUN',1791208491,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T13:54:51.115Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eQt_yZmD5uf4TBfwpPbi_RIgdCbUZ63j',1791921213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.703Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eYRmhIbB6TCV9o4Q0Xz6nPwZqHEvRc7Z',1792856466,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T15:41:05.563Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ebw-6Kd6Gp1f7aGrcUO3g3N94OW7QowW',1791921213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.702Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ekuPdE92w2Ufr1Izqa_ds2gApa528E1t',1793103594,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T12:19:53.983Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('emmd6pOMVI0Hvh7QhddX6L3F5ts29Gwd',1793358245,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T11:04:05.230Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eoKem6_DPDigqFM4c2LV_xwSty01uDd1',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.038Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('eoePqgNPEMopyqvILWlE8MEWOsHdBGbC',1792918514,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:55:14.115Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('evZNd-JkFnTjuhSHt-QQTqT_me1A_QgN',1791839693,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T21:14:52.793Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('evtdCHRmBrRuyFCHv_ufUoVbxN9NO-rU',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.170Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('exvl8dKd43MmHjqkdgDFozLWHDxN_EOh',1792233890,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T10:44:50.207Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('f8POJsv-Eclyhzq3pRQz1rNFhLdSwpzZ',1793114740,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T15:25:39.714Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('f9Z9aP3eUkKpv-uGCKjtymYIyGLYFo8C',1791861284,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T03:14:44.046Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fA3UM7n5bq36Y-20sbFKuTHe77JLNj1O',1792893932,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T02:05:31.763Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fL94OsXPuczBu4nzF0Xy2yvngpgC_B9K',1792054231,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T08:50:31.149Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fNePmX2xspsoxqo18DJpyCkCXaC42AIx',1793035510,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T17:25:09.638Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fXyfIH4LUMwDaapwRmPXibosvv6kl5Dk',1791730691,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:11.397Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fYH9Ojln1Ehd9ayy_sJ4pZ8r1wwV5II3',1792690003,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T17:26:43.315Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('f_4KhEWmhZR95OuoN25wFIxHunAourIS',1792080768,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T16:12:47.832Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fabSsVdWPTFJi42Kh4jmVW2y0Civm7qn',1792471490,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T04:44:49.728Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fka-enCwiK7SVhfl9sPjFz2Sb7z6tgBH',1792758583,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:29:43.304Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Your account has been suspended. Please contact your school administrator or librarian.\"]}}');
INSERT INTO "sessions" VALUES ('fkzutmHlkSRX50DiVy8gniT8zjebOXh0',1792698665,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T19:51:04.566Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fn4gkFTTdkeokco0AnrQqORdY94jKyqS',1791134763,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:26:02.930Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('fr3L9tzXtfT1a2dV23U2wFAQkfq4wPcS',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.617Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ftB3iwyy9hbAEC_-NWsa-oEplrlcjKXY',1791967610,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T08:46:49.924Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('g02INbdoayrzeliu1cL2xUhIVTgD7aRG',1792758348,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:25:47.649Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gEABSQuMBq7s02eBKODLFRMX3b8cXCSn',1791736920,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T16:41:59.544Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gEy42Fk7-brQ1PpzWavwsqL7nhg9bejQ',1791774422,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T03:07:01.764Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gFYNAP7ZWAHB60z5vp1Zbo8eEYS1a-U1',1790989956,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T01:12:35.595Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gFmAw-AkIMGDKAJAVCLFAAtFGkcjDqKw',1792137047,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T07:50:47.163Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gG40kuhGI6p6kggPt2A2ZBP_uS0p0tcX',1791921209,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.420Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gH9mscsNq7sjDB7fLqlJ5_namXYIddsZ',1793281935,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T13:52:15.318Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gMKbigxVX9MrB5B3I4mZI2iYTNkTPE4r',1792861764,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T17:09:24.312Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gO6naxiqH0K1fK_6MHzc0_Y0YIZugMal',1790963469,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T17:51:09.421Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gRoRg4_WpQIlY6ndoNvXWuBvQdgKIBCL',1791114416,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T11:46:55.619Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gWnOxXQ1P14OdjobxF3te2u548Gw7RDY',1791803704,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T11:13:13.600Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gYoNExbL-ON8GFYNitMWmEkbrRylckKn',1792597943,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T15:52:22.876Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('g_vkScuFItD-EnZZG8V08tQpODGKznzy',1791183519,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T06:58:39.423Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ghAhwpsmaKofInMfwyy83ChSZANHSyMZ',1792180263,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T19:51:03.274Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gmxlGJaed8w_gZogz9z7qoMStZLQVk8N',1793018899,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T12:48:19.106Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gpxdxzyXpNgi0lr59K-ZeNFyqzpmlG7k',1791921212,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.327Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('gyzqp6TvYZG6hf8KNKw8QWLE8MPcur1m',1792310654,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T08:04:14.035Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hDs3Yr-OIeQlBFir5XsFpUqN8EKABijA',1793312170,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:09.618Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hEX0d8olSKL9faXqMSSqLCZzdYQPSSPf',1793083739,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T06:48:58.807Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hGKRqlgNvpQf73Md4NEZb4v6nH8dzuHn',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.441Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hHuiDmjHDWtyD_yLJCoiL9RGV31dnaT9',1792758314,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:25:13.618Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Admin or Librarian login required.\"]}}');
INSERT INTO "sessions" VALUES ('hczPuR0Wyp-8YHfULjTw1dZ5JISPikpY',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.383Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hdq5x4M3pDvJ3jqtCOJKZYskIITAxu90',1792864032,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T17:47:12.271Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hetCDelVYftMwFVjM1O8jWRhl_8Cv8Rj',1792290352,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T02:25:51.660Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hmVPrsGyTliHFcHqtWUXA-NEd4tKuddq',1792202262,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T01:57:41.786Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('hvdrylpONazaN8dKwrliJ1Gx7MUjnD2q',1793171809,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T07:16:48.884Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('i1IgFMuHNvKofH1Ae3F5mIcxNQYqBuTO',1793263482,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T08:44:42.350Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('i3CwU3cfx-CyEAvZR5xtbpTRSoJ-NBXa',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.606Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('i4w1ZxzQP5xeBuHxm2RIJpG6qgEUGpe2',1792325119,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T12:05:19.050Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('iAacRHBRe_fRAri6C25KQNa6vBTiQAMr',1792046303,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T06:38:23.158Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('iGRVc5yJzYDD8UEU55_EtnhGVBac-5KN',1792244046,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T13:34:06.309Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('iNB9Lid46XHeqf_PxEtAV1sfgYjhDceJ',1792376967,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T02:29:26.938Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('iNEKZovK6Ku6lN-ZAU6CtYwCLSzjxlKB',1791643283,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:41:23.067Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('iNrSx8wy4rxPz_3Zs3TxdGVR8gQU-eab',1792432906,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T18:01:45.530Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('iWxDwH1Pdz6Lup683W2dZUCKcImrQubL',1792218180,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T06:23:00.136Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ikECslrC0ZAsyppn1hQxqH5XQ0LGQXyV',1791193509,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T09:45:08.812Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('izhS_iK0ACH41HAA1NFx11WOXPbAHdLK',1792260187,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T18:03:07.374Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('j89QG7krqmriYI7M_Yoiw6EILDQxFg8f',1791113843,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T11:37:23.321Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('j8cAk5-NXhWeRkug5QC77YkF0TfrTmNF',1792404530,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T10:08:49.722Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('j9fz7R6vXHBHLpmco-0KBGxdB5_MoxC2',1793399027,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T22:23:46.650Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('j9ydofWbAPjKzUi4-_9-Ec0kZ5JvBLSz',1791645669,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:21:08.966Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jBYP0mbl97iKCF70D3dvUS0FSzB6Nt0k',1791650219,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T16:36:58.638Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jCYO9k-t_rxse8du5xkdTZ6ZJ5gtEf8y',1791102406,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T08:26:46.364Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jKV7TafUl8S3fkZKnDrUVf00-jHTn0Rn',1792758295,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:24:54.904Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jRxamX8kbk0UW18IbUfPPI--QpTgbxuO',1793251256,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T05:20:55.937Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jS89IKD8W6YfoGbiFgedUavwngVpg2Ec',1791743616,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T18:33:36.066Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jTg_q92JepSgCYS78hX1NsN_ujSPYQY_',1791643242,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:40:42.190Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('jZEgjwkBwyBmUZQyqQODK1I6UYsv2ErH',1792210919,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T04:21:59.212Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jc3gwMbIFJkZolVeDtHqsqPTLDBXXMkC',1792766580,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:43:00.322Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('jgGktxrre_xeJ-7Bp_KlxnJSpHXpaZOx',1792758529,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:28:36.087Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jirdxOtqFtRLK9GsjG9BBcuvLo8geDvm',1790975024,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T21:03:44.414Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"demo_mode\":true}');
INSERT INTO "sessions" VALUES ('jpouI-qNZjBiHb8rvjMBW_p9QBJHbeUB',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.532Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jrJN1-ovdTWWwdr5YZ8D4UP_EF-0P7Db',1792788736,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T20:52:16.119Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jvAS7Deet7HIgeaRvRwG2reb6k7UYBA0',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.007Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jwcNS0TuzBwjhr3u4-xyrMijpGCd2OAb',1793312175,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:14.641Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jxxmu46dQlUZNUKdnYfd6U-zURDu1gNZ',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.062Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jxyZG6qSPs69TJl1-ufqjaUVsJPYlhkV',1792519827,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T18:55:06.716Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('jzNvck4aFVsHHb4LpcJUUhuXMASU87BL',1791101329,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T08:08:49.456Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('k1fPu9_MCWWMoQdvbsExaDCx1SwN1q7W',1793491707,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-11-01T00:08:27.162Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('k7E31FJx3D9UUV0CpO8-flY9LtP8D5Gq',1793009798,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T10:16:37.840Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('k7dtfbYPrx3lL6yT3DUPDeFAkT3a4pOM',1792047145,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T06:52:24.649Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kBVXym6iGsZQRaSG1r8Vzg-8PiZRVs1m',1791741541,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T17:59:01.345Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kCzzyyvPXu_lUVyhBgJtmrYpYCQAg8ZM',1791921205,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:25.313Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kDcRztzTCCA9HCXAglD2fu9MDTt_b8L0',1792619078,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T21:44:37.620Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kEB7WBxaaRvxTHTsZ0H6ii6J2Z8HtQUG',1793183932,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T10:38:52.407Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kFDZ5oxu9pdRB4SMHIzzwnF9g1Bj7215',1793007476,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T09:37:56.374Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kIM5Urfu7KRTKcSk1z3rVKY1akOBQYyc',1792049983,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T07:39:42.500Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kK4UEVSPhCDqfpNQOuh89q878t4eDI9B',1793339099,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T05:44:58.965Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kLBuROMo3aA21qxV2vKe4w9-hPzTYwjE',1791137955,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T18:19:15.105Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kb-2OSJtHrAB0oZayb92qVzxlJiwx2qR',1791643283,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:41:23.167Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kcUB_hh4sITcWw53MIeHr4uUtu3sBGXO',1791921206,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.498Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kcWha5n6elgYwU7k3f6qd-spzMw_RK25',1792597936,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T15:52:16.019Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kek2e2hmVuCJpX9_Ffev141J-S41sEh9',1790955282,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T15:34:41.818Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kgqIFHoTFv-KVvJINiMO2PsFAb72Q0N4',1792915511,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:05:11.245Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('knZFSFVTzRLMBWUi_UndCgBixTPJZkUu',1790978159,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T21:55:58.906Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('koMzRI1VCdvhhIskeImf18AT9UiIoqzQ',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.544Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('kqYeyRCVMTCsg1XNzemloMTdMuYn7UGr',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.505Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('krTx6PIDfkZgwe5LprKtSjSUoLDZhNOr',1793419753,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T04:09:12.636Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ktTI0vPix3WpPNZsHC6Ugu0PExrcrO61',1792847768,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T13:16:08.382Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('l60hvCKsw03FrQv2SVtCvSZ1V-8CdU-o',1791031488,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T12:44:48.072Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('l6ZUvUd5KJiV6Lx8MPbJL8dx7HfVpBBz',1793012535,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T11:02:15.413Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lFtv9ANCnoaqP0yXTC-bXNsK2Np0nRxg',1793232542,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T00:09:01.646Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lRRoGK-DpzfueSpTliGNwD7dDvkEq5wr',1791969170,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T09:12:50.364Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lY07uUA9u60-QfNatCJBG59cJRRxnknA',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.501Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('leqUNEBlR8vHqfRAE4e25YHZrYGJMs0C',1791236502,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T21:41:41.651Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('luCUnQ4Kd63uP1I1YrSKL0nOCpOifSe1',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.604Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lvoCRp3BYFFST_H1eN4bDzCKPzZYWItX',1791282642,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T10:30:41.999Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lvsm_xAMPnB1ZVq9x5sVvKlqbCaBFEAO',1792409551,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T11:32:31.078Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lvwUIFyw-zLGkG0KzgIaVWVNtHzWViyv',1792163846,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T15:17:25.952Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lwi4U1QCtjPwFlFvjomXCNca48i2sWOT',1792247536,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T14:32:16.334Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('lzT6_F0pbLTuMqi28adOMLFT4r53gODC',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.113Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mCd5GUJ3mDwRiXwQpECEQpEkj5WUFfjL',1791086235,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T03:57:14.637Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mD4EGasDwTbpX4TpehOTg5s9lO7AN8zV',1792922439,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T10:00:38.873Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mHJXnn16D3POP7BGXUBw0wRR9habD98u',1792755601,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T11:40:00.609Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mMdCv9YcUnAFAtCpqV9DJTRanNpEh_O3',1793212279,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T18:31:18.822Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mTWNL9_t-YaU2ZE8aLda5cUlz9SkxJZG',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:27.108Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('md5ZuoP3S5kufXbDc8flmotHr0goaiu2',1793157184,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T03:13:04.243Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('meHC3lnWEwR6ZyT0UkBd1Dwounp1mEQq',1791672286,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T22:44:46.028Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mh2tV6TfNU4Ha8BuZk2CzYUElSpC3iU0',1791009159,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T06:32:39.154Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mhjJrvTmQCqipNXk8iog78Oe-15U01D-',1792776680,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T17:31:20.033Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mnuaIImfOAfD2phOZtXtnIZpto0QO7pe',1793067232,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T02:13:52.160Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('mudybAgUrNfaB1k-z_4sDkXKih843vAi',1791927462,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T21:37:41.642Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('n21Dt2Q4oUZgIUyY_3llpNv6tnzYUzf5',1792274785,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T22:06:24.992Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('n5VnrYVOCHkcm7PXxitr69mGJxfCsQno',1791984077,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T13:21:17.249Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nCLx9sEFLoqmMXmpQqmO8uiI1p-D1dkd',1790968121,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T19:08:41.471Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nDfU-coMCkndF18RFU9nyv0XUtxzEA5s',1792319506,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T10:31:45.816Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nE7x6IVlUsYplPN9BX-6NJ-2mwBPCc8S',1792432905,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T18:01:45.349Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nFgPQ13NgfKgOgHhjRhx3c-Sn6eGap8B',1793045205,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T20:06:45.415Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nHjShBdStdCbb9xVYDsETVc4i9t8vqEo',1790963290,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T17:48:10.172Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nHxVJDsKm2bKBp1wcv9KHIa7dx7MGjH1',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.502Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nMZF8gHJSAeXgxT8d3k6nBNf6VpFWmRw',1792131049,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T06:10:48.841Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nMZnIGuyAPmx4T1if_cctH3H2eQ6INmr',1792514524,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T16:42:04.268Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nNOB8XXGrzLbrSzbikwkwe3t9ZA82AN0',1793312180,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:19.904Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nT9ZAaU1gmg4DB_M8aw_QYBwF8A1zZVy',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.519Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nUyG3RcyG5q3Jw4EiybKvQZR1-v211hD',1790993062,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T02:04:21.818Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nW08GiwIfSoTlRT7Dp2CjDR9XiRZVGF6',1791921208,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:28.121Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nZoW9MtLBUBO7KK_LEop24a3tiMzn0Pf',1792638700,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T03:11:40.461Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nZtNr-REmCZQqKZ8yvZPeQH5FpmokCFi',1791921212,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.328Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('n_wVBVAk06izInGzEtJpJqOB0Ncw_1i2',1793114745,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T15:25:45.432Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('n_zAHCsLADBsFOjiu4RTC_tn0oXNu4Nj',1791730684,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:04.475Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ndDPtb1uOMevA1jT8VZMDmDV07XqucO3',1793129510,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T19:31:50.246Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('npcmD7PgW2bbHugU8OnDyk1KhvygJlZU',1793009720,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T10:15:20.482Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('nt9nhN_p6pSElM9CYgGgBHFstWgYB1sz',1792917151,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T08:31:51.177Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('oDFT7DsvBobUZU-sgaDcTwwyThF06KdG',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:30.605Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('oFibdU32-Ww_xa7RCoFixBWLcxayQIf4',1792290353,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T02:25:53.086Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('oGJEgBZ8ww2csM2fq0ocRX1a57Q6xUaD',1791377499,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:51:39.252Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('oHbd8xEJdmBUL-fT9IEj1oilnGb9Ej9y',1793312186,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:25.750Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('oOK2KEB20gl5dK-1VeZ4y0ZNLWlsrrVF',1792577301,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T10:08:21.228Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('oYMdP3lOrvmrCwajkVvu8WS_MUd13BvT',1792690009,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T17:26:49.212Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('oZlgmph8WX_m58yTBfoO9e8BWiiBEucb',1792864977,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T18:02:56.656Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ohSfjUgYrSHmyuQ0W-Dv3W1_FODBQrgg',1792232462,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T10:21:01.612Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('om85AXob7Lb2QTfzBLV2FVzLPAYrk7JK',1793312179,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:19.493Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('p1tA1QxiigjIllujp4vFmF2adCHB0bv2',1791282639,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T10:30:39.050Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('p6UYAoqxmZGDl-IF41AJjAInXHH_zXpe',1793016722,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T12:12:02.471Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('p8LINWOP0F0CxKSt5llJNvIFFrhJkbXl',1790938071,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:47:50.620Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('pAkDcC3aBovifNZZd9U3gQCzeAeOiBlQ',1792310433,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T08:00:33.499Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('pBmQnoUPCUYcga_rpByfQWHh4REFU0N1',1793509550,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T05:05:49.982Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('pH_QrhnwI92b83Q9kp4AzoO8m9AwU0lr',1791642990,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:36:30.223Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('pL09923uqwh4xDVPuiTk5NXgD1izW5d9',1793412376,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T02:06:15.931Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('pLaCmYy4QTkv7oumK3miUm8T8QCVyj9S',1793510440,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T05:20:30.236Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":\"18\",\"username\":\"8527198907\",\"name\":\"Ashish Kumar Gupta\",\"role\":\"super_admin\",\"school_code\":\"GLOBAL\",\"demo_mode\":false,\"user_name\":\"Ashish Kumar Gupta\",\"last_presence\":1790918430166}');
INSERT INTO "sessions" VALUES ('pLsG6dzUtneAFBoAkmN7bOzwt_pk_-rW',1792186072,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T21:27:52.072Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('pY58PtvmIKxlaVIKQAGz9KOZzuTDkwbC',1793011173,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T10:39:32.649Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('p_eJ1iJKKl3UOMuj79tNQdKxsdeQBpYx',1791730340,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:52:20.450Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('piA2fM0DApSkYaoh1723VGeB2W0t6_LF',1792778076,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T17:54:35.515Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('poU1Sutc5ybOvdIi-QII6beb3gyby3tf',1791276090,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-06T08:41:30.367Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('q4i5lEWzjaBFCqQx4cwGmoQ3il4Mwcg7',1792233881,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T10:44:40.780Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('q7HbD6RBaKvL4Cer0SgMDBvL6hbKAjvX',1792952787,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T18:26:26.983Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qByNdADMETsqbvqBEGzRJJ8m-QNdjfXR',1792289272,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T02:07:51.842Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qNW5ndsWlhh7UO8vvlPbOYOw7z8yGKLD',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.105Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qNzr9YJNujKYwvOXpBiML74sXa6lobLv',1792229853,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T09:37:33.224Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qO6sT4X0VS53uTVF5bxBnLzCx1vuG9Kk',1793312180,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:19.891Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qPePu-rQ2k4pYwZbQNMOuVk6HkBS5GiE',1791921213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.902Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qSqqyVyPJcN0f_5kNStO94RUQWed8D1U',1791921209,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.427Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qXlwiGdRCpODnRL-h1jNGYluFd-iv_7q',1792690008,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T17:26:48.338Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('q_GO6m576aysmaH66Eiufl7p-FdXfyp5',1791730708,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:58:28.046Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qkYnvW_DfAp4H1fVlQwqaI6WgIinFBq_',1790938020,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T10:46:59.644Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qr_Uhyt2Kdu_qyms_kmZwcNn07T0ETpA',1791052295,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T18:31:35.242Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('qsFRssdWnHEbhJ7BhdOUy6-fS2ngF1Bj',1793399027,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T22:23:46.921Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('r-Tm_eWJFNsRHIFYLNvfwLYf_clxtucm',1791089889,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T04:58:08.818Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('r07TD3rTrL5IaLjM2tYWTznNtGuccz-7',1792489691,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T09:48:10.598Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{},\"user_id\":9999,\"username\":\"superadmin\",\"name\":\"Master Super Admin\",\"role\":\"super_admin\",\"school_code\":\"00000\",\"demo_mode\":false,\"school_name\":\"dps\",\"user_name\":\"Master Super Admin\",\"last_presence\":1789897690589}');
INSERT INTO "sessions" VALUES ('r4t6CZbJieXkKcm-mfnXH1AJDuvnjXn2',1792437883,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T19:24:42.624Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('r4zRT82qIDxTWUb1DBSwOXlykQg0uLQ_',1793358211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T11:03:30.612Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rBezXR970jBqbkF2wvYZJCP-KFvb-Z1n',1792281489,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T23:58:09.163Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rJK9K2lL9m-ItKrNvSMMA2XUjiuEMr2E',1792968114,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-25T22:41:53.548Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rQ1Joo8fDfPpZBUnpMYsUazLB4723lsZ',1793157250,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T03:14:10.283Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rSRTP3LS7CLBPecEFnPPz9DUEgBuqm3T',1791377522,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T12:52:01.931Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rUo2EPX78W1I_ZvkX-vILh3tZXF0MpAL',1791202274,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T12:11:13.706Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rVuv94xxPNDaq2DiMUhplYfhPiIxF_vC',1792070697,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T13:24:57.496Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rXHik0w9XdirgFSccPEjyzvAUaDlHP5P',1791943862,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T02:11:02.208Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rY5i2CJHZoY8Iy-HKPPrynuCHJYfHDJ9',1792834271,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T09:31:10.804Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rbePVnfs5Yry37W3i_iZreI3J_gArjxP',1791732586,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T15:29:46.211Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rc6CMO3GZ88cfa7CIQUVvWrWvtiHo3No',1791931740,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T22:49:00.162Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rfy8LTNvVMwsBWQ7o6V1M37uS0aAFAbe',1792747596,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T09:26:36.481Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rgrhCRpSh4YjsVExtdx3SrMdyBD1zEAi',1791961618,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T07:06:57.866Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rjd6JVmZAmcn6PTu716YFUOnAQm1OYRd',1792742022,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T07:53:42.269Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rkRmLmwfF4-w0Kn_8IZnWVTm7z1FLm--',1793004511,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T08:48:31.493Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rr-9gqqZqA_fzHd_DOCFOqgLvlbL_RCH',1791644718,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:05:17.618Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('rvHvylbXXc-ZC889-n3cF9dIAauAH438',1792519819,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T18:10:18.760Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('rvpTM-7E6cwMvbg82Adtpvd6oJTFHixI',1793218733,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-28T20:18:52.924Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('s-QgQTUvJ3fLY-RSsuSR0NyA64nuxtkT',1792758596,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:29:56.048Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Invalid login ID or password\"]}}');
INSERT INTO "sessions" VALUES ('s7IlWA766AEPocngIRL9HWiP9REnSJ6f',1791073560,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T00:26:00.212Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sHgNaSOimTW5g2HOfldzdqD3nddfgFLn',1793103381,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T12:16:21.054Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sHsB-RHrb5g6t9KRXMSh6z-8P6uRPj_p',1792839381,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T10:56:21.468Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sNjUZGEZn08dS5fUZpJr9wP96TkXNhmZ',1791334144,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T00:49:04.208Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sT0YIa3LvifhUsrimDubgX9a9_QXZ4O6',1792463091,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T02:24:50.608Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('s_wJENCGQ8hUq5wRhGYZPMESFla3Udun',1792785586,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T19:59:45.585Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sbuP_Jak5gAHzALMRlc9YheqRDWWI1E4',1791644303,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:58:23.397Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sepAsTP2ca8hUR1eWZZTAuyNofeUVuHR',1791969466,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T09:17:46.288Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sfEUCVVnjcctRxHI0Sh7vfWZep-yn-r2',1793312186,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:25.740Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('srqOinqawY3B7wysOWoLrxJ5GfGKgH87',1792899286,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T03:34:45.597Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('stKvb0taW2UM-oCismGA_EEWkZvwTYdc',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.924Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('swA7mojgXQzuSF4auU611QLGdFml6oWQ',1792761920,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T13:25:20.277Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('sxUuSMUhOOcw0jLhm-XUeYCykFGCefFx',1791815095,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T14:24:54.917Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('t2Da71G97LQKRWSigSjH93HEP4mC-0wO',1791921213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.901Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tG4D0Sd2dXYBp7WjZ3C2XFZhg4z_Soyw',1792820216,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T05:36:55.844Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tKQ-TSBeM4bqCgKD9VSGzqMNaNtfP9xO',1792578207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T10:23:27.383Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tL7N9MWQ2V4AIuMPECMqvjfXNeX0R-EH',1792380112,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T03:21:52.061Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tLzB3Gsjfvho7iQjC4wPyD3i1G0KT3uF',1792189263,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T22:21:03.188Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tMKpT6_rho4Ed79o5RCQ0wtInhbYdG8k',1792560647,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T05:30:47.439Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tPFdgCkvPb0nmZM4rt22_nTkl_vST8vf',1791643283,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:41:23.128Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tTHYjVEc8v_i8rTzBmxCLfvlPSuREmfY',1791795692,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T09:01:32.079Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tUWxwGcaVRtg-JP9rGQ_6MZn0nE0o4nZ',1793312155,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:15:55.104Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tWoEsSBSdrz6MeNS2dYDNQSK05GzxZE9',1792345915,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T17:51:54.582Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tdOsFk-duxUU5ModnS8_H0akai0_rxPn',1790965849,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-02T18:30:49.495Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tiNB7Np4ZktRFlazknRZvFwdWPRlbOEk',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.087Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tiQ53e4iHzb_yHimvlaQPVPhKF09yZwP',1791042526,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T15:48:45.962Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tmLntGqU4UD4R5_rtNhcZ77qKov4jts5',1792482738,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T07:52:18.281Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tqj9fBlnh-cvwYPmBf7UWUIyS4BoGE5l',1791672285,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T22:43:25.391Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tqkhSIy_ZZeJkCiDqJZS7X5SPn2Sh4q7',1792841256,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-24T11:27:35.785Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tr_Zv7YbYEK12odNOAVLnXf7atBpGmd8',1791643283,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:41:23.211Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('twjDWynPn1GJbfZFbjna5rMMT4nrpirq',1792073681,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T14:14:41.212Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('txOHH1CJ3gjOjRPjMR7fMwZjjQSTqeyZ',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.077Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('tzUOgVAQIqJmFqVvoYGNN2g20Ir0cbIx',1791861364,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T03:16:04.263Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uD70obQxFFLoFGKbs8G42u1Ts_NtPobx',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.920Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uF3BHQCD7QvqoHEji-u02oxvlu9QbWRz',1791643910,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:51:49.906Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uNwbAci5GQsg08jR2O8I5lim--2PoAcf',1791921212,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:32.328Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uPpmufjnaFciXtV3xU9Jo53eELTMefzI',1792242639,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T13:10:38.878Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uS2cigUY_s2R0uzDzuxC6SH_71uhYUEq',1792738239,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T06:50:39.300Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uSJU4YaZ5LIv3HMU0e2LNNHISU5Ng_Sn',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.933Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uX3towmKcfDmARq7mzCV2DfdpUsltPBv',1791048988,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T17:36:28.251Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uXLORn7gm5zOLriglfSBeesiUaHDlXJI',1791352495,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T05:54:55.348Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('u__yb9Kb9MSb6Os-lyqVX6LwkxPv4EJ_',1792033108,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-15T02:58:01.430Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uie9qLStESGb7ljKMNzNNPjapyruOhLs',1792464154,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T02:42:33.528Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('usmpJtKg3GmAMKv1S_Pm1ls8ioncodca',1793292514,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T16:48:34.087Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uuH43BbXE9rg07mx0rW1Sue7SNLmy2pA',1793359000,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T11:16:40.136Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uvOgZGkFNuTlMgrHenHjFueH75ukINKk',1791658372,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T18:52:51.935Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ux2XEjUGdS32c9tzU1KwW3zKxwGEeEKj',1793018814,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T12:46:54.379Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('uzYFuif-NjHt7EOGR7cTia-LDapox2TW',1792791734,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T21:42:14.407Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('v8bWaZgl6WdVpX28jEtpVGhfTDWp5-VM',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.512Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vCyYaX8sMcrdd8eawztCrz3cK1QHjLG-',1792060462,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T10:34:21.963Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vHaMd2bg-Si6E5-hIUbL94SfgayHYs0u',1791839693,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T21:14:52.789Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vMC_hJmQxlrK6G3QFTIY1PNcNTHbdKx1',1791927467,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T21:37:47.313Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vQOfKsI54IFgE1_8am1x8LHhtAG3pR0m',1791231394,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T20:16:34.490Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vTyC-svq7BVpeSR0NZLy16jgYU9ZDIiQ',1793509667,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T05:07:47.464Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vYVLxvoHeL8kJMJVLZFHl-Bx-ozwuPAs',1792396047,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T07:47:26.508Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vaP2Od_Q2nmAeEyswwHJgBHFZgV3U1NY',1793443215,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-31T10:40:15.365Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vi3HwMxQHnVpYKDd_AFgHv0IyCKLqcGK',1792131974,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-16T06:26:13.707Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vimL67qsUh0GSpnDOtLuLWSst0YVBDpP',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.985Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vl4wwAmjDTLZEx3tV2meGrjqSRJ8iw95',1792764585,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T14:09:44.736Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('vl_0v5eo2jUTB7qES8W2rHwKLmKOA8jZ',1792924670,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T10:37:50.468Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('w5p1OI6NvFqvuM1v-41l9Ek2sjPAYl7b',1792046299,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T06:38:19.120Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wCZIzda6XYDCHxZFZfLRkH1gQx3M0gF8',1792247537,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T14:32:17.145Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wCfOB5FEFDOyBiKiKfxb0iU0runEFcg6',1791246152,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-06T00:22:32.185Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wEAMKLvrqaidwCWjPh_kbJpY2Lx5LINF',1792004223,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T18:57:02.769Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wEywZ1vG2Yt6WHjPuT7K4Rrx9_av87JJ',1791921211,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:31.012Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wOW5-u7i9VuMAyxdnnmeldndbve1t2kC',1793381783,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T17:36:22.941Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wT2dA1O5L0DAAmBCBQxOU_e9jnAbRRsE',1791921210,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:29.509Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wXL5dyErxP-jn9Y4Zi3yMLAXiD2q0tNU',1793024139,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T14:15:38.760Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wZUVQCqb8cI2ULgFynSc_KIKhv3A1zLg',1791806212,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T11:56:51.663Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wbFlLJokGhvv21Mn_J4XPaJpSfcH1r1l',1791677322,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T00:08:41.859Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wc2H7p2J-dBLYya5RF4eGgdfScuF-Dma',1791052295,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T18:31:35.067Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wiC8N2zvjmVJ31VQWGf5nJgH3mBAF2y7',1791704313,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T07:38:33.090Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wjJRYXUp9dSBzn6LVf1CRONEeHm6J4Wl',1793381960,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T17:39:19.958Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wo_wxQMiw34wI-4y_UUZV2F07azcKMvh',1792923014,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T10:10:14.035Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('wxjS2gerF-cpPE3fJYSoDug0XL8cUHO0',1793337700,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T05:21:39.881Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('x2fZL1e5fR3xzRMhfR9IRkmN1HtpiTfJ',1793305185,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T20:19:44.648Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('x3gPEAYAFzJNBqtNjhMnQmA4VcDVcuME',1792899235,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-25T03:33:54.585Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('x8MJFjr7JmlduF8M17n5E2-XRixqn7Ql',1791677327,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T00:08:46.738Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('xK5K25Ra9HFUIiU6w8gEZarkD0ZQh0hh',1793064046,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-27T01:20:45.919Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('xLrwe2I5ctNbvX0aejxEa3xMGQrdCw5f',1793491249,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-11-01T00:00:49.157Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('xfIZuXBQDR-54yI2dcozJ3ap9oVjE0lf',1791135767,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T17:42:47.394Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('xg1v3-OtMh6W7cwQX-AbtmYFGR3EdAW5',1793387759,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-30T19:15:59.279Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('xpUjJeNe0qxbEE66ySX9GvE0ZFj2SReu',1791732947,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T15:35:46.674Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('xze-vcOcas5XL3AlmsMBsqdY2Lm63YSO',1792520244,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-20T18:17:24.124Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('y2NeC_1Ng6FhCu2RdFOrkDF9HuQgo5FO',1792753065,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T10:57:44.584Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('y3fs985vhfdPt-LNvX_FJ4gx9fRsJdxT',1792244050,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T13:34:09.558Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('y4ci7z0tmub7Da3IkinJyv7V-xgVaY3J',1792076343,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T14:59:02.593Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('y7belQkD1Z8OHttRBIgyiolMZ-jYveTJ',1792392502,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T06:48:22.221Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('y925eAk5DD9LAPoroPUZZbasr_VmuqvA',1793250032,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T05:00:32.442Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yDwc0XvF17LAfKipVvth2exvtWVMAw7x',1793312170,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T22:16:09.629Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yLuJb1h7DbtwhhIZDgPed4cy1wt2a-0o',1791347066,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T04:24:26.443Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yRg1N1JPAnHQenGyHkfri9-sRqehEA_S',1792046701,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T06:45:01.097Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yXGwszKIvFT7fThZ1jSExaywldotA5F1',1791704226,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T07:37:05.847Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yXUmXc9WeAQnIBzqrD11XdIMWSPmBSPq',1791168193,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-05T02:43:12.506Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yeRH1T58fGATqWey8XTyQKhq7v4RAynx',1791373411,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-07T11:43:30.999Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yi1AgWb4NMIhB5a0EFs4BfsvAZolWN_m',1792655795,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-22T07:56:35.488Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ylalTn7ruatOIz6g5ItBsE-Ba1yietcz',1792364618,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-18T23:03:38.377Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('ypu6wZl6PcyoOHB_GC_9bqu_SyBzVvss',1791795980,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-12T09:06:19.521Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('yrF12Rlvok8pDi4CFAWJVXCXvNXZHvPL',1791644718,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T15:05:17.772Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Access denied. Please log in.\"]}}');
INSERT INTO "sessions" VALUES ('yvx1pkAWXWN1IAXP8VJWL2n0TQCTC5_O',1791732679,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T15:31:19.123Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{\"error\":[\"Please log in to join this online meeting.\"]}}');
INSERT INTO "sessions" VALUES ('yz3DajwyTzPoo7VssaXTxddo5DY_EMLm',1792242639,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-17T13:10:39.003Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('z5pFdLyUGhSjf0V8GlkXymLQiJsvA3Ht',1792084910,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T17:21:50.094Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zBz8_v5cvBhEIJL5JImGZHY0r9ccYslh',1793381097,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-10-30T17:24:56.775Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zJKM2YTwLYk6PsACk3YlOQGcIJ0SHbjZ',1792406152,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T10:35:51.751Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zLQeqiY2K-Rs1HuCXOdpRNV9lyyx357n',1790994440,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-03T02:27:20.408Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zQFGKK8h3s0QKfY8kBhKHLjV9feKlhAv',1793232542,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-29T00:09:01.638Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zRm8o4WKv7tRttsM6kPy3Q3lO6XGLAB8',1791643283,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:41:23.127Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zS0oUdEptywsVemBkWL-ooNJ8y-wBv9x',1792046689,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-15T06:44:40.783Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zS84GaQohshzJzGRG61QZVLBWnb9SW2F',1792387409,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-19T05:23:28.660Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zUux-58BJpwI6jqN0RKwMPvIMmnvg701',1792592690,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-21T14:24:49.979Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zcj_e9BMAIwF72oS74m3RrAjEBGDzURV',1793011171,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T10:39:31.000Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zg8nVd0f4lvVtLu4b-hEyQEgCYG4VJFk',1791644213,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-10T14:56:53.408Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('znGOSOXGKpvha8G19PwZM-S1EYWnfB8S',1791996533,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-14T16:48:53.251Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('znHKkLlcHL5lBXLpclzU1-OvISIC8jAW',1791086293,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-04T03:58:13.490Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zobotw6m76oI-rK6us8AJugb6TmE97Lx',1791921207,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-13T19:53:26.505Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zpRjtmPdOdcAJMNsdZFmoUaV1XAfxAsP',1793057283,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-26T23:28:02.892Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zu3WIjOhnz7W-hleAGtXaBRWCcLgMs85',1792758356,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-23T12:25:56.473Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
INSERT INTO "sessions" VALUES ('zwo_RnMoO2MbnAM786gyYbJCjbFxzxEv',1791730343,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-10-11T14:52:23.093Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"flash\":{}}');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "student_achievements" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "achievement_id" int(11) NOT NULL,
  "earned_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_user_achievement" ("user_id","achievement_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "student_bookmarks" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "document_id" int(11) NOT NULL,
  "page_number" int(11) DEFAULT 1,
  "note" text DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "student_devices" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) DEFAULT NULL,
  "device_name" varchar(255) DEFAULT NULL,
  "device_type" varchar(100) DEFAULT NULL,
  "ip_address" varchar(45) DEFAULT NULL,
  "session_token" varchar(255) DEFAULT NULL,
  "user_agent" text DEFAULT NULL,
  "last_active" timestamp NULL DEFAULT current_timestamp(),
  "is_current" int(11) DEFAULT 1,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "student_devices" VALUES (1,18,'Android Device','Mobile','122.161.49.143','uZwVoADddLSTeZzbnnDkIboCucjcili9','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','2026-08-15 12:33:14',1,'2026-08-15 12:33:14');
INSERT INTO "student_devices" VALUES (2,57,'Android Device','Mobile','122.161.49.143','p1O36Fns8FagZ642VLParUPp98zoqzj6','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','2026-08-15 12:36:15',1,'2026-08-15 12:36:15');
INSERT INTO "student_devices" VALUES (3,11,'Windows PC','Desktop','167.103.4.106','aZa_Vt5Eu7ReaX_qfFM30H5fpmLd1EvC','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0','2026-09-07 09:35:23',1,'2026-09-07 09:35:23');
INSERT INTO "student_devices" VALUES (4,23,'Windows PC','Desktop','167.103.4.106','jPGPGYTaWXoREWk5Dl-9qN4Wzib98h2Y','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0','2026-09-07 15:04:39',1,'2026-09-07 12:49:43');
INSERT INTO "student_devices" VALUES (5,12,'Windows PC','Desktop','167.103.4.106','0FDLnt4wBmmBbvivxIFtnocTUAVnnp4u','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0','2026-09-07 12:50:33',1,'2026-09-07 12:50:33');
INSERT INTO "student_devices" VALUES (6,14,'Windows PC','Desktop','167.103.4.106','GWQlurJLmKdOrdPxqqQi2zvs4PTaV1YB','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0','2026-09-07 15:04:34',1,'2026-09-07 15:04:34');
INSERT INTO "student_devices" VALUES (7,14,'Mac','Desktop','122.161.50.168','sGwo0kn0SO7iGk7jvNFZb7C97t5l5L3W','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-07 15:40:06',1,'2026-09-07 15:25:23');
INSERT INTO "student_devices" VALUES (8,23,'Mac','Desktop','122.161.50.168','uLdN865NwVvFDbDfROp7mm8LEdgS7XNn','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-07 15:25:49',1,'2026-09-07 15:25:49');
INSERT INTO "student_devices" VALUES (9,23,'Mac','Desktop','122.161.50.162','JAfZsltETD8p51w3QCxk2-BqP6jZI5Qd','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-10 14:57:11',1,'2026-09-10 11:56:56');
INSERT INTO "student_devices" VALUES (10,14,'Android Device','Desktop','122.161.50.162','TvC_VJkGDLA0dGCWcJov280oMOZJiutw','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36','2026-09-11 17:08:17',1,'2026-09-10 11:59:21');
INSERT INTO "student_devices" VALUES (11,9999,'Mac','Desktop','122.161.50.162','QFNya-6e-cOVZXw95v0nHqXOilu1pJts','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-10 14:17:02',1,'2026-09-10 13:47:19');
INSERT INTO "student_devices" VALUES (12,14,'Windows PC','Desktop','136.226.230.175','pgQ2lhVl54mwW70_3qkbtVH_b9uKZBkr','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0','2026-09-10 15:00:03',1,'2026-09-10 14:39:07');
INSERT INTO "student_devices" VALUES (13,23,'Windows PC','Desktop','103.102.75.200','LwS37Aq2EE6oH4fvjz0auyRhDqAGWydp','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-12 03:55:52',1,'2026-09-12 03:55:51');
INSERT INTO "student_devices" VALUES (14,23,'Android Device','Desktop','122.161.50.189','Zc2Zw3w_PlLbhqvtMFeouX8k_DMhHXKU','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36','2026-09-15 14:14:43',1,'2026-09-15 06:39:40');
INSERT INTO "student_devices" VALUES (15,9999,'Mac','Desktop','122.161.50.189','-gE9k6pQ5uLtH8oDPZGra7jCXB9vaPvZ','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-15 06:51:02',1,'2026-09-15 06:44:36');
INSERT INTO "student_devices" VALUES (16,14,'Mac','Desktop','122.161.50.189','gJVSSvYSs7xgC6JBOUtj9Mag5N6XcwOP','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-15 13:57:23',1,'2026-09-15 13:57:23');
INSERT INTO "student_devices" VALUES (17,23,'Android Device','Mobile','122.161.48.255','R9JM4DX90_pV88DrLsRHKtduliV8sWVC','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36','2026-09-20 09:08:50',1,'2026-09-20 09:08:50');
INSERT INTO "student_devices" VALUES (18,14,'Android Device','Mobile','122.161.48.255','LYugdqx36LknbKXbPGSEQI4OLYx1vamd','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36','2026-09-20 09:10:17',1,'2026-09-20 09:10:17');
INSERT INTO "student_devices" VALUES (19,9999,'Android Device','Mobile','122.161.48.255','r07TD3rTrL5IaLjM2tYWTznNtGuccz-7','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36','2026-09-20 09:46:56',1,'2026-09-20 09:46:56');
INSERT INTO "student_devices" VALUES (20,23,'Mac','Desktop','122.161.50.173','TkvtULafNEAVuAXAb1mzkHZtGFLhXDNu','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-22 07:12:38',1,'2026-09-22 07:12:38');
INSERT INTO "student_devices" VALUES (21,9999,'Windows PC','Desktop','136.226.230.189','Xy5C0GFa5LmOY7v05GD0E8J0kzfeHz7V','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','2026-09-23 11:37:34',1,'2026-09-23 11:37:34');
INSERT INTO "student_devices" VALUES (22,14,'Mac','Desktop','122.161.48.19','A9596ivA3QAJ-oD3CdQ0bA--eRRR1sGV','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-23 14:42:17',1,'2026-09-23 11:54:44');
INSERT INTO "student_devices" VALUES (23,23,'Web Browser','Desktop','::1','MZxZvJDFIiXZ4GKnmj24QvOJv6qAKCEP','curl/8.5.0','2026-09-23 12:30:04',1,'2026-09-23 12:30:04');
INSERT INTO "student_devices" VALUES (24,23,'Mac','Desktop','122.161.48.19','xbHfD0MyhEJfZFhmX6BVWgfsH0zLffOb','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-23 14:42:30',1,'2026-09-23 14:42:30');
INSERT INTO "student_devices" VALUES (25,13,'Web Browser','Desktop','::ffff:127.0.0.1','MrnYK1xY3s9pnUqHWdtLKMX_ofoSGPLY','Browser','2026-09-23 14:43:26',1,'2026-09-23 14:43:26');
INSERT INTO "student_devices" VALUES (26,23,'Windows PC','Desktop','136.226.230.189','lVlXBwxSjwDxcnr30-ignGgzFeictB3W','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','2026-09-24 05:25:20',1,'2026-09-24 05:25:20');
INSERT INTO "student_devices" VALUES (27,14,'Mac','Desktop','122.161.49.73','TcwpR5N2NrnZDyJZZh7TL9qz5mjm3g8Z','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-26 12:41:06',1,'2026-09-26 10:43:30');
INSERT INTO "student_devices" VALUES (28,18,'Mac','Desktop','122.161.49.73','Xtfp7SQ1jyYVJjKC7qnqhalqS5RAzrT7','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-26 10:44:15',1,'2026-09-26 10:44:15');
INSERT INTO "student_devices" VALUES (29,23,'Mac','Desktop','122.161.49.73','yRd_m5PThlJaiCHkhJo7mQnKSCr-k51x','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-26 12:48:43',1,'2026-09-26 12:18:20');
INSERT INTO "student_devices" VALUES (30,11,'Windows PC','Desktop','136.226.230.172','59XKxenkbw6LCcxzkhBI8gKvNNxiNNL_','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','2026-09-27 08:14:38',1,'2026-09-27 08:14:38');
INSERT INTO "student_devices" VALUES (31,11,'Windows PC','Desktop','175.107.141.50','Mu1EZ0vn_2WatAWHfOFDkfJaOZMO-D-l','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0','2026-10-02 05:17:41',1,'2026-10-02 05:17:41');
INSERT INTO "student_devices" VALUES (32,23,'Windows PC','Desktop','175.107.141.50','IpaPUanCTkUS-M4tdhC9uf9Uv-4Wi4Xb','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0','2026-10-02 05:17:48',1,'2026-10-02 05:17:48');
INSERT INTO "student_devices" VALUES (33,18,'Windows PC','Desktop','175.107.141.50','pLaCmYy4QTkv7oumK3miUm8T8QCVyj9S','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0','2026-10-02 05:20:30',1,'2026-10-02 05:20:30');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "student_profiles" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "student_id" varchar(50) NOT NULL,
  "class_name" varchar(50) DEFAULT NULL,
  "section" varchar(20) DEFAULT NULL,
  "roll_number" varchar(30) DEFAULT NULL,
  "phone" varchar(30) DEFAULT NULL,
  "profile_photo" varchar(500) DEFAULT NULL,
  "digital_pass_token" varchar(255) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "updated_at" timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "user_id" ("user_id"),
  UNIQUE KEY "student_id" ("student_id"),
  UNIQUE KEY "digital_pass_token" ("digital_pass_token")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "student_profiles" VALUES (1,14,'STD-14','9',NULL,NULL,NULL,NULL,'LIBPASS-14','2026-09-26 12:43:04','2026-09-26 12:43:04');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "student_saved_books" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "book_id" int(11) NOT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_saved_book" ("user_id","book_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "student_saved_documents" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "document_id" int(11) NOT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_saved_doc" ("user_id","document_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "student_wishlist" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "book_id" int(11) NOT NULL,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_wishlist" ("user_id","book_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "studio_attendance" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "session_id" bigint(20) unsigned NOT NULL,
  "member_id" bigint(20) unsigned NOT NULL,
  "member_name" varchar(255) DEFAULT NULL,
  "role" varchar(50) DEFAULT 'student',
  "joined_at" datetime NOT NULL,
  "left_at" datetime DEFAULT NULL,
  "duration_seconds" int(11) DEFAULT 0,
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "user_id" bigint(20) unsigned DEFAULT NULL,
  "last_heartbeat_at" datetime DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_attendance_session" ("session_id"),
  KEY "idx_attendance_member" ("member_id")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "studio_attendance" VALUES (12,100001,14,'dps123','student','2026-09-10 20:28:43','2026-09-10 20:29:08',25,'2026-09-10 14:58:43',14,'2026-09-10 20:28:43');
INSERT INTO "studio_attendance" VALUES (14,3,14,'dps123','student','2026-09-10 20:29:32','2026-09-10 20:29:54',22,'2026-09-10 14:59:32',14,'2026-09-10 20:29:32');
INSERT INTO "studio_attendance" VALUES (19,3,23,'Librarian Auto','host','2026-09-11 20:58:55','2026-09-11 20:59:06',11,'2026-09-11 15:28:55',23,'2026-09-11 20:58:55');
INSERT INTO "studio_attendance" VALUES (20,3,23,'Librarian Auto','host','2026-09-11 20:59:09','2026-09-11 21:14:52',943,'2026-09-11 15:29:09',23,'2026-09-11 21:14:45');
INSERT INTO "studio_attendance" VALUES (21,3,23,'Librarian Auto','host','2026-09-11 21:14:52','2026-09-11 21:19:36',284,'2026-09-11 15:44:52',23,'2026-09-11 21:19:16');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "studio_sessions" (
  "id" bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  "title" varchar(255) NOT NULL,
  "description" text DEFAULT NULL,
  "host_id" bigint(20) unsigned NOT NULL,
  "host_name" varchar(255) DEFAULT NULL,
  "meeting_code" varchar(100) NOT NULL,
  "scheduled_start" datetime DEFAULT NULL,
  "scheduled_end" datetime DEFAULT NULL,
  "duration_minutes" int(11) DEFAULT 60,
  "status" varchar(50) DEFAULT 'SCHEDULED',
  "class_name" varchar(100) DEFAULT NULL,
  "school_code" varchar(50) DEFAULT 'DPS123',
  "created_at" timestamp NULL DEFAULT current_timestamp(),
  "updated_at" timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  "jaas_room_name" varchar(120) DEFAULT NULL,
  "visibility" varchar(50) DEFAULT 'CLASS',
  PRIMARY KEY ("id"),
  UNIQUE KEY "meeting_code" ("meeting_code"),
  KEY "idx_meeting_code" ("meeting_code"),
  KEY "idx_scheduled_start" ("scheduled_start"),
  KEY "idx_status" ("status"),
  KEY "idx_ss_host" ("host_id"),
  KEY "idx_ss_start" ("scheduled_start"),
  KEY "idx_ss_status" ("status"),
  KEY "idx_ss_code" ("meeting_code"),
  KEY "idx_ss_jaas" ("jaas_room_name")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "studio_sessions" VALUES (3,'hello bacho','bla',23,'Librarian Auto','LIB-EAS-T6A','2026-09-11 15:28:00','2026-09-11 16:28:00',60,'SCHEDULED','All Students','AUTOTEST','2026-09-11 15:28:51','2026-09-11 15:28:51','librika-mtg_9jDfmB9LS8mnHK-993885ab','CLASS');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "system_settings" (
  "key" longtext DEFAULT NULL,
  "value" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "system_settings" VALUES ('maintenance_mode','0');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "transactions" (
  "id" longtext DEFAULT NULL,
  "user_id" longtext DEFAULT NULL,
  "book_id" longtext DEFAULT NULL,
  "issue_date" longtext DEFAULT NULL,
  "due_date" longtext DEFAULT NULL,
  "return_date" longtext DEFAULT NULL,
  "fine" longtext DEFAULT NULL,
  "class" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "status" varchar(50) DEFAULT 'issued',
  "book_size" varchar(10) DEFAULT 'MEDIUM',
  "allowed_days" int(11) DEFAULT 15,
  "late_days" int(11) DEFAULT 0
);
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "user_roles" (
  "id" int(11) NOT NULL AUTO_INCREMENT,
  "user_id" int(11) NOT NULL,
  "role_id" int(11) NOT NULL,
  "portfolio_type" varchar(50) DEFAULT 'school',
  "school_code" varchar(50) DEFAULT NULL,
  "assigned_by" int(11) DEFAULT NULL,
  "assigned_at" timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY ("id"),
  UNIQUE KEY "uk_user_role_context" ("user_id","role_id","portfolio_type","school_code")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "user_roles" VALUES (1,10,1,'school','00000',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (2,11,2,'school','SCH8912',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (3,12,5,'school','DPSGZB',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (4,13,5,'school','dps123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (5,14,5,'school','dps123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (6,17,5,'school','DPS123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (7,18,1,'school','GLOBAL',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (8,19,2,'school','ORG33184',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (9,20,2,'school','SCH8259',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (10,21,1,'school','codex',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (11,22,1,'school','12345678',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (12,23,2,'school','AUTOTEST',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (13,24,5,'school','AUTOTEST',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (14,25,5,'school','AUTOTEST',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (15,26,1,'school','GLOBAL',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (16,27,5,'school','SCH8259',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (17,28,9,'school','PERS_1686430576',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (18,29,9,'school','PERS_1686469424',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (19,30,9,'school','PERS_1687169676',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (20,31,9,'school','PERS_1010',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (21,32,9,'school','PERS_1687915531',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (22,33,9,'school','PERS_1688425985',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (23,34,9,'school','PERS_1698080521',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (24,35,9,'school','PERS_1698635237',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (25,36,9,'school','PERS_1698664310',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (26,37,9,'school','PERS_1698985699',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (27,38,9,'school','PERS_1699721478',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (28,39,1,'school','GLOBAL',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (29,40,1,'school','DPS123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (30,41,5,'school','DPS123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (31,42,2,'school','ORG67207',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (32,43,5,'school','DPS123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (33,44,5,'school','DPS123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (34,45,9,'school','PERS_2220685710',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (35,46,9,'school','PERS_2220723439',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (36,47,9,'school','PERS_2221315654',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (37,48,2,'school','2321',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (38,49,5,'school','2321',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (39,50,2,'school','ABC',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (40,51,5,'school','ABC',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (41,52,9,'school','PERS_1111',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (42,53,2,'school','SAS',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (43,55,5,'school','123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (44,56,5,'school','123',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (45,57,2,'school','4343',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (46,9999,1,'school','00000',NULL,'2026-09-26 10:40:06');
INSERT INTO "user_roles" VALUES (47,9998,1,'school','00000',NULL,'2026-09-26 10:40:06');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "users" (
  "id" longtext DEFAULT NULL,
  "name" longtext DEFAULT NULL,
  "admission_no" longtext DEFAULT NULL,
  "class" longtext DEFAULT NULL,
  "phone" longtext DEFAULT NULL,
  "password" longtext DEFAULT NULL,
  "role" longtext DEFAULT NULL,
  "session_token" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "is_banned" longtext DEFAULT NULL,
  "permissions" longtext DEFAULT NULL,
  "email" longtext DEFAULT NULL,
  "stream" longtext DEFAULT NULL,
  "dob" longtext DEFAULT NULL,
  "plan_name" longtext DEFAULT NULL,
  "physical_reader_score" longtext DEFAULT NULL,
  "digital_reader_score" longtext DEFAULT NULL,
  "overall_reader_score" longtext DEFAULT NULL,
  "quizzes_passed" longtext DEFAULT NULL,
  "approved_reviews" longtext DEFAULT NULL,
  "reading_streak" longtext DEFAULT NULL,
  "longest_streak" longtext DEFAULT NULL,
  "last_read_date" longtext DEFAULT NULL,
  "badges" longtext DEFAULT NULL,
  "section" longtext DEFAULT NULL,
  "fcm_token" longtext DEFAULT NULL,
  "two_factor_enabled" int(11) DEFAULT 0,
  "two_factor_secret" text DEFAULT NULL,
  "profile_complete" tinyint(1) DEFAULT 0,
  "last_active_at" datetime DEFAULT current_timestamp(),
  "is_online" tinyint(4) DEFAULT 0,
  "uid" varchar(30) DEFAULT NULL,
  "first_name" varchar(100) DEFAULT NULL,
  "last_name" varchar(100) DEFAULT NULL,
  "gender" varchar(20) DEFAULT NULL,
  "alt_phone" varchar(20) DEFAULT NULL,
  "address" text DEFAULT NULL,
  "city" varchar(100) DEFAULT NULL,
  "state" varchar(100) DEFAULT NULL,
  "country" varchar(100) DEFAULT 'India',
  "pincode" varchar(20) DEFAULT NULL,
  "profile_picture" varchar(255) DEFAULT NULL,
  "avatar_id" varchar(50) DEFAULT NULL,
  "student_id" varchar(50) DEFAULT NULL,
  "employee_id" varchar(50) DEFAULT NULL,
  "department" varchar(100) DEFAULT NULL,
  "designation" varchar(100) DEFAULT NULL,
  "academic_year" varchar(50) DEFAULT NULL,
  "interests" text DEFAULT NULL,
  "communication_preferences" text DEFAULT NULL,
  "email_verified" tinyint(1) DEFAULT 0,
  "phone_verified" tinyint(1) DEFAULT 0,
  "deleted_at" datetime DEFAULT NULL,
  "last_login_at" datetime DEFAULT NULL,
  "last_password_change" datetime DEFAULT NULL,
  "created_at" datetime DEFAULT current_timestamp(),
  UNIQUE KEY "uid" ("uid"),
  KEY "idx_users_uid" ("uid")
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "users" VALUES ('10','OM','','null','8527198907','12345','super_admin','f51940f7-a50d-41c8-8a2f-75c9e1389a96','00000','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','null','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000010',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00003',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('11','POOJA GUPTA','null','null','9911914800','Nokia@123','admin','443b4010-49da-4f60-8d9d-cdf30201a916','SCH8912','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','null','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-10-02 10:47:42',0,'lib_usr_000011',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00004',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('12','divya','1022','9','999','studentpass','student','null','DPSGZB','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','null','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,1,'2026-09-10 19:14:29',0,'lib_usr_000012',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00005',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('13','dps123','','9','123','123','student','null','dps123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','ayushmangupta003@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-23 20:13:26',1,'lib_usr_000013',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00006',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('14','dps123','1','9','123','123','student','null','dps123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','ayushmangupta003@gmail.com','null','null','FREE','0','0','25','1','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-26 18:18:18',0,'lib_usr_000014',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,'/uploads/596da3bbf680762d02ac9348e710de90','avatar_28__EA580C','VBPS00007',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('17','d','1','1','1234','1234','student','8ff56703-24ab-43da-9fe1-65a608d31f63','DPS123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','ayushmangupta003@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000017',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00008',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('18','Ashish Kumar Gupta','','','8527198907','2321','super_admin','7f6d4aa7-1e9b-4bff-b485-2d25a37bab8d','GLOBAL','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','guptaashish123@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-10-02 10:50:30',0,'lib_usr_000018',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00009',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('19','Ayushman Gupta','null','null','123','t699agDy','admin','5a15af88-7ab6-4796-afd4-3ac921298ddc','ORG33184','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','ayushmangupta003@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000019',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00010',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('20','codex','null','null','codex','codex','admin','null','SCH8259','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','codexbot@codex','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000020',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00011',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('21','codex','','','codex','codex','super_admin','null','codex','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','codex@gmail','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000021',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00012',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('22','1','','','1','1','super_admin','null','12345678','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','1@G','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000022',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00013',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('23','Librarian Auto','null','null','9898989898','libpassword','admin','b2a71a38-4f40-4266-beb8-323270ad1192','AUTOTEST','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','auto_lib@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-10-02 11:38:27',1,'lib_usr_000023',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00014',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('24','Auto Student One','ADM001','10','9797979797','studentpass1','student','b90df5b9-9193-4fb6-9341-25c277e080d8','AUTOTEST','suspended','1','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','stud1@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000024',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00015',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('25','Auto Student Two','ADM002','11','9696969696','studentpass2','student','6df8da81-de72-4dbb-ab15-8893379ce4ad','AUTOTEST','suspended','1','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','stud2@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000025',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00016',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('26','Ashish kumar Gupta','','','08527198907','2321','super_admin','e5cc2caf-bbce-444e-80bb-10212f7152d9','GLOBAL','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','guptaashish123@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00017',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('27','test','ADMOO3','1','2321','ABC','student','bac90071-92fc-4c6a-9d3d-6521cb4b78be','SCH8259','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','ABC@GMAIL.COM','','','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000027',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00018',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('28','Test Owner','null','null','1686430576','password123','owner','null','PERS_1686430576','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1686430576@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000028',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00019',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('29','Test Owner','null','null','1686469424','password123','owner','null','PERS_1686469424','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1686469424@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000029',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00020',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('30','Test Owner','null','null','1687169676','password123','owner','null','PERS_1687169676','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1687169676@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000030',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00021',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('31','Ayushman Gupta','null','null','1010','123','owner','c6265c95-70a8-4476-9fa4-b36082a2f5ce','PERS_1010','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','ayushmangupta003@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000031',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00022',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('32','Test Owner','null','null','1687915531','password123','owner','null','PERS_1687915531','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1687915531@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000032',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00023',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('33','Test Owner','null','null','1688425985','password123','owner','null','PERS_1688425985','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1688425985@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000033',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00024',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('34','Test Owner','null','null','1698080521','password123','owner','null','PERS_1698080521','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1698080521@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000034',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00025',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('35','Test Owner','null','null','1698635237','password123','owner','null','PERS_1698635237','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1698635237@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000035',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00026',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('36','Test Owner','null','null','1698664310','password123','owner','null','PERS_1698664310','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1698664310@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000036',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00027',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('37','Test Owner','null','null','1698985699','password123','owner','null','PERS_1698985699','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1698985699@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000037',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00028',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('38','Test Owner','null','null','1699721478','password123','owner','null','PERS_1699721478','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_1699721478@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000038',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00029',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('39','Ashish Kumar Gupta','','','8527198907','2321','super_admin','null','GLOBAL','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','guptaashish123@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000039',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00030',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('40','lib_test','','','8527198907','2321','super_admin','e86001c7-3ce1-489e-9e52-be4ef648a9d6','DPS123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','lib_test@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000040',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00031',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('41','rahul','1234','9','9911914300','1234','student','8ea45f71-28ec-441c-8656-f3c3ed18312d','DPS123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','rahul@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000041',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00032',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('42','Sudip Chakraborty','null','null','09999243533','Qbt40HJF','admin','null','ORG67207','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','sudip.chakraborty@ukg.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000042',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00033',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('43','Ayushman Gupta','A','9','09354713610','2321','student','null','DPS123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','ayushmangupta003@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000043',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00034',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('44','Ayushman Gupta','null','null','9354713610','2321','student','315760e8-1491-4df4-9d7c-bce00874df30','DPS123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','null','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000044',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00035',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('45','Test Owner','null','null','2220685710','password123','owner','null','PERS_2220685710','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_2220685710@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000045',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00036',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('46','Test Owner','null','null','2220723439','password123','owner','null','PERS_2220723439','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_2220723439@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000046',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00037',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('47','Test Owner','null','null','2221315654','password123','owner','null','PERS_2221315654','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','test_2221315654@example.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000047',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00038',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('48','Ashish Kumar Gupta','null','null','1','1','admin','ec6f979c-d8a3-45f2-964d-a060bac4ae35','2321','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','guptaashish123@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000048',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00039',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('49','AHAHHA','1','9','112233','userpass','student','932505e1-09e7-4472-870c-9057dc8b5b14','2321','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','AHAHA@AHAH','null','null','FREE','5','0','5','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000049',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00040',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('50','Deepak','null','null','112233','112233','admin','08af2012-91be-4c2a-8a82-9733d7802288','ABC','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','abc@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000050',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00041',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('51','123','Qwerty','1','123456','userpass','student','null','ABC','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','123@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000051',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00042',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('52','Ayushman Gupta','null','null','1111','123','owner','9e2acc7c-ffd6-4a2d-ab95-189c2f306de4','PERS_1111','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','123@123','null','null','PRO','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000052',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00043',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('53','Sanshay','null','null','676767','123','admin','786a48ec-7388-4d89-89c1-224f8dd26104','SAS','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','sanshray@gmail.com','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000053',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00044',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('55','Ashish Kumar Gupta','ADM002','1','11112222','userpass','student','13c28610-7df1-4c2a-901e-749461efa366','123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','123@123','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000055',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00045',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('56','Ayush','11','1','111333','studentpass','student','ef8b74ca-baa6-42b9-ad7d-6970dc85c6e4','123','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','null','null','null','FREE','0','75','75','0','0','1','1','2026-07-24','[\"First Book Completed\"]','null','sample_firebase_device_token_xyz',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000056',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00046',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('57','JHON PIG','null','null','8971','6567','admin','a0d59cd6-ab30-4844-b7e8-4a9d29ed304c','4343','active','0','[\"manage_books\", \"manage_students\", \"manage_transactions\", \"approve_content\"]','JOHNPIG@123','null','null','FREE','0','0','0','0','0','0','0','null','[]','null','null',0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_000057',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00047',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('9999','Master Super Admin',NULL,NULL,'7000000000','super123','super_admin',NULL,'00000',NULL,'0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-09-24 10:55:05',0,'lib_usr_009999',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00049',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES ('9998','Master Super Admin',NULL,NULL,'superadmin','super123','super_admin',NULL,'00000',NULL,'0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-09-10 19:14:29',0,'lib_usr_009998',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,'VBPS00048',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES (NULL,'Sanjeevini Sasikumar',NULL,NULL,'8270277153','$2b$10$hfaHluiU98ZBg1Q0ZXnOgujrNZLdENx5ihlYniFhSIZ7MuJYgQiyS','student',NULL,'DL-140307',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-09-10 19:14:29',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
INSERT INTO "users" VALUES (NULL,'Bhoopendra Singh',NULL,NULL,'09352423669','$2b$10$dLztZ0LFxt0n2DOPFiAUWe9/KYfrcfk3IlTRgimEdYnLs2fU/0biG','student',NULL,'library',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-09-12 09:25:33',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-09-26 16:21:20');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE "vendors" (
  "id" longtext DEFAULT NULL,
  "school_code" longtext DEFAULT NULL,
  "name" longtext DEFAULT NULL,
  "email" longtext DEFAULT NULL,
  "phone" longtext DEFAULT NULL,
  "address" longtext DEFAULT NULL,
  "status" longtext DEFAULT NULL,
  "created_at" longtext DEFAULT NULL
);
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO "vendors" VALUES ('1','2321','Vendor-INV-10293','null','null','null','active','2026-07-07 22:28');
INSERT INTO "vendors" VALUES ('2','2321','Vendor-INV-10293','null','null','null','active','2026-07-07 22:28');
INSERT INTO "vendors" VALUES ('3','2321','Vendor-INV-85310','null','null','null','active','2026-07-07 22:57');
INSERT INTO "vendors" VALUES (NULL,'DPS123','National Book Depository','orders@nationalbooks.in','9811002233','New Delhi',NULL,NULL);
