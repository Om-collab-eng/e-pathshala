const bcrypt = require('bcryptjs');
const db = require('../db');

async function getNextNumericId(tableName, maxLimit = null) {
  try {
    const limitClause = maxLimit ? `AND CAST(id AS UNSIGNED) < ${maxLimit}` : '';
    const r = await db.query(`SELECT COALESCE(MAX(CAST(id AS UNSIGNED)), 0) + 1 as next_id FROM ${tableName} WHERE id REGEXP '^[0-9]+$' ${limitClause}`);
    if (r.rows && r.rows[0] && r.rows[0].next_id) return String(r.rows[0].next_id);
  } catch (e) {
    try {
      const limitClause = maxLimit ? `AND CAST(id AS INTEGER) < ${maxLimit}` : '';
      const r = await db.query(`SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) + 1 as next_id FROM ${tableName} WHERE id GLOB '[0-9]*' ${limitClause}`);
      if (r.rows && r.rows[0] && r.rows[0].next_id) return String(r.rows[0].next_id);
    } catch (e2) {}
  }
  return '101';
}

async function seedSchoolsAndUsers() {
  console.log('🚀 Starting Seeding for VBPS Ghaziabad & VBPS Noida...');

  // 1. Ensure location column exists in schools table
  try {
    await db.query("ALTER TABLE schools ADD COLUMN location TEXT");
    console.log('✓ Added location column to schools table');
  } catch (e) {
    // Column may already exist
  }

  // 2. Insert or Update School 1: VBPS Ghaziabad (VBPGZ)
  const existingVbpgz = await db.query("SELECT id FROM schools WHERE school_code = 'VBPGZ'");
  if (existingVbpgz.rows && existingVbpgz.rows.length > 0) {
    await db.query(`
      UPDATE schools SET 
        name = 'VBPS Ghaziabad', 
        location = 'Ghaziabad',
        librarian_name = 'Meenakshi Rao',
        status = 'active',
        activePlan = 'PROFESSIONAL',
        subscriptionStatus = 'active',
        studentLimit = '5000',
        librarianLimit = '10',
        adminLimit = '10',
        due_days = '14'
      WHERE school_code = 'VBPGZ'
    `);
    console.log('✓ Updated existing VBPS Ghaziabad school record');
  } else {
    const nextSchoolId = await getNextNumericId('schools');
    await db.query(`
      INSERT INTO schools (
        id, name, school_code, location, librarian_name, max_books, max_students,
        created_at, status, activePlan, subscriptionStatus, expiryDate,
        studentLimit, librarianLimit, adminLimit, due_days
      ) VALUES (
        $1, 'VBPS Ghaziabad', 'VBPGZ', 'Ghaziabad', 'Meenakshi Rao', '5000', '2000',
        CURRENT_TIMESTAMP, 'active', 'PROFESSIONAL', 'active', '2028-12-31',
        '5000', '10', '10', '14'
      )
    `, [nextSchoolId]);
    console.log(`✓ Inserted VBPS Ghaziabad (ID: ${nextSchoolId}, Code: VBPGZ)`);
  }

  // 3. Insert or Update School 2: VBPS Noida (VBPNO)
  const existingVbpno = await db.query("SELECT id FROM schools WHERE school_code = 'VBPNO'");
  if (existingVbpno.rows && existingVbpno.rows.length > 0) {
    await db.query(`
      UPDATE schools SET 
        name = 'VBPS Noida', 
        location = 'Noida',
        librarian_name = 'Deepak Chawla',
        status = 'active',
        activePlan = 'PROFESSIONAL',
        subscriptionStatus = 'active',
        studentLimit = '5000',
        librarianLimit = '10',
        adminLimit = '10',
        due_days = '14'
      WHERE school_code = 'VBPNO'
    `);
    console.log('✓ Updated existing VBPS Noida school record');
  } else {
    const nextSchoolId = await getNextNumericId('schools');
    await db.query(`
      INSERT INTO schools (
        id, name, school_code, location, librarian_name, max_books, max_students,
        created_at, status, activePlan, subscriptionStatus, expiryDate,
        studentLimit, librarianLimit, adminLimit, due_days
      ) VALUES (
        $1, 'VBPS Noida', 'VBPNO', 'Noida', 'Deepak Chawla', '5000', '2000',
        CURRENT_TIMESTAMP, 'active', 'PROFESSIONAL', 'active', '2028-12-31',
        '5000', '10', '10', '14'
      )
    `, [nextSchoolId]);
    console.log(`✓ Inserted VBPS Noida (ID: ${nextSchoolId}, Code: VBPNO)`);
  }

  // Common hashed passwords
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const libHash = bcrypt.hashSync('Lib@123', 10);
  const teachHash = bcrypt.hashSync('Teach@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);
  const parentHash = bcrypt.hashSync('Parent@123', 10);

  const adminPermissions = JSON.stringify([
    'manage_books', 'manage_students', 'manage_transactions', 
    'approve_content', 'view_reports', 'manage_settings'
  ]);
  const librarianPermissions = JSON.stringify([
    'manage_books', 'manage_students', 'manage_transactions', 
    'approve_content', 'view_reports'
  ]);

  // Define 10 users for VBPGZ and 10 users for VBPNO
  const usersToSeed = [
    // ═════════════════════════════════════════════════════════════════
    // SCHOOL 1: VBPS GHAZIABAD (VBPGZ)
    // ═════════════════════════════════════════════════════════════════
    {
      school_code: 'VBPGZ',
      name: 'Rajesh Sharma',
      role: 'admin',
      designation: 'Vice Principal & Admin',
      department: 'Administration',
      phone: '9810100001',
      email: 'admin1.vbpgz@librika.in',
      plain_pass: 'Admin@123',
      pass_hash: adminHash,
      permissions: adminPermissions,
      employee_id: 'VBPGZ-EMP-001',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'School Administrator' })
    },
    {
      school_code: 'VBPGZ',
      name: 'Sunita Verma',
      role: 'admin',
      designation: 'Academic Coordinator & Admin',
      department: 'Administration',
      phone: '9810100002',
      email: 'admin2.vbpgz@librika.in',
      plain_pass: 'Admin@123',
      pass_hash: adminHash,
      permissions: adminPermissions,
      employee_id: 'VBPGZ-EMP-002',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'School Administrator' })
    },
    {
      school_code: 'VBPGZ',
      name: 'Meenakshi Rao',
      role: 'librarian',
      designation: 'Head Librarian',
      department: 'Library Services',
      phone: '9810100003',
      email: 'lib1.vbpgz@librika.in',
      plain_pass: 'Lib@123',
      pass_hash: libHash,
      permissions: librarianPermissions,
      employee_id: 'VBPGZ-LIB-001',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'Chief Librarian' })
    },
    {
      school_code: 'VBPGZ',
      name: 'Alok Tripathi',
      role: 'librarian',
      designation: 'Assistant Librarian',
      department: 'Library Services',
      phone: '9810100004',
      email: 'lib2.vbpgz@librika.in',
      plain_pass: 'Lib@123',
      pass_hash: libHash,
      permissions: librarianPermissions,
      employee_id: 'VBPGZ-LIB-002',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'Associate Librarian' })
    },
    {
      school_code: 'VBPGZ',
      name: 'Vikram Malhotra',
      role: 'teacher',
      designation: 'Senior PGT English',
      department: 'Languages',
      phone: '9810100005',
      email: 'teach1.vbpgz@librika.in',
      plain_pass: 'Teach@123',
      pass_hash: teachHash,
      permissions: '[]',
      employee_id: 'VBPGZ-TCH-001',
      student_id: null,
      class_name: 'Class 11 & 12',
      section: 'A',
      interests: JSON.stringify({ subject: 'English Literature', role: 'Faculty' })
    },
    {
      school_code: 'VBPGZ',
      name: 'Pooja Saxena',
      role: 'teacher',
      designation: 'TGT Science & Mathematics',
      department: 'Science',
      phone: '9810100006',
      email: 'teach2.vbpgz@librika.in',
      plain_pass: 'Teach@123',
      pass_hash: teachHash,
      permissions: '[]',
      employee_id: 'VBPGZ-TCH-002',
      student_id: null,
      class_name: 'Class 9 & 10',
      section: 'B',
      interests: JSON.stringify({ subject: 'Mathematics & Science', role: 'Faculty' })
    },
    {
      school_code: 'VBPGZ',
      name: 'Aarav Singhania',
      role: 'student',
      designation: 'Student',
      department: 'High School',
      phone: '9810100007',
      email: 'aarav.vbpgz@librika.in',
      plain_pass: 'Student@123',
      pass_hash: studentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPGZ-STU-1001',
      admission_no: 'VBPGZ-STU-1001',
      class_name: 'Class 10',
      section: 'A',
      alt_phone: '9810100008', // Father's phone
      interests: JSON.stringify({ favorites: ['Science Fiction', 'Physics', 'History'] })
    },
    {
      school_code: 'VBPGZ',
      name: 'Sanjay Singhania',
      role: 'parent',
      designation: 'Parent / Guardian',
      department: null,
      phone: '9810100008',
      email: 'parent1.vbpgz@librika.in',
      plain_pass: 'Parent@123',
      pass_hash: parentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPGZ-STU-1001', // Linked to Aarav
      admission_no: null,
      class_name: null,
      section: null,
      alt_phone: '9810100007',
      interests: JSON.stringify({ 
        relation: 'Father', 
        child_name: 'Aarav Singhania', 
        child_student_id: 'VBPGZ-STU-1001',
        child_class: 'Class 10-A'
      })
    },
    {
      school_code: 'VBPGZ',
      name: 'Ananya Gupta',
      role: 'student',
      designation: 'Student',
      department: 'Senior Secondary',
      phone: '9810100009',
      email: 'ananya.vbpgz@librika.in',
      plain_pass: 'Student@123',
      pass_hash: studentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPGZ-STU-1002',
      admission_no: 'VBPGZ-STU-1002',
      class_name: 'Class 11',
      section: 'B',
      alt_phone: '9810100010', // Father's phone
      interests: JSON.stringify({ favorites: ['Biographies', 'Psychology', 'Chemistry'] })
    },
    {
      school_code: 'VBPGZ',
      name: 'Rakesh Gupta',
      role: 'parent',
      designation: 'Parent / Guardian',
      department: null,
      phone: '9810100010',
      email: 'parent2.vbpgz@librika.in',
      plain_pass: 'Parent@123',
      pass_hash: parentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPGZ-STU-1002', // Linked to Ananya
      admission_no: null,
      class_name: null,
      section: null,
      alt_phone: '9810100009',
      interests: JSON.stringify({ 
        relation: 'Father', 
        child_name: 'Ananya Gupta', 
        child_student_id: 'VBPGZ-STU-1002',
        child_class: 'Class 11-B'
      })
    },

    // ═════════════════════════════════════════════════════════════════
    // SCHOOL 2: VBPS NOIDA (VBPNO)
    // ═════════════════════════════════════════════════════════════════
    {
      school_code: 'VBPNO',
      name: 'Amitabh Sen',
      role: 'admin',
      designation: 'Headmaster & Admin',
      department: 'Administration',
      phone: '9820200001',
      email: 'admin1.vbpno@librika.in',
      plain_pass: 'Admin@123',
      pass_hash: adminHash,
      permissions: adminPermissions,
      employee_id: 'VBPNO-EMP-001',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'School Administrator' })
    },
    {
      school_code: 'VBPNO',
      name: 'Kavita Nambiar',
      role: 'admin',
      designation: 'Senior Administrator',
      department: 'Administration',
      phone: '9820200002',
      email: 'admin2.vbpno@librika.in',
      plain_pass: 'Admin@123',
      pass_hash: adminHash,
      permissions: adminPermissions,
      employee_id: 'VBPNO-EMP-002',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'School Administrator' })
    },
    {
      school_code: 'VBPNO',
      name: 'Deepak Chawla',
      role: 'librarian',
      designation: 'Chief Librarian',
      department: 'Library Services',
      phone: '9820200003',
      email: 'lib1.vbpno@librika.in',
      plain_pass: 'Lib@123',
      pass_hash: libHash,
      permissions: librarianPermissions,
      employee_id: 'VBPNO-LIB-001',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'Chief Librarian' })
    },
    {
      school_code: 'VBPNO',
      name: 'Rashmi Deshmukh',
      role: 'librarian',
      designation: 'Resource Center Specialist',
      department: 'Library Services',
      phone: '9820200004',
      email: 'lib2.vbpno@librika.in',
      plain_pass: 'Lib@123',
      pass_hash: libHash,
      permissions: librarianPermissions,
      employee_id: 'VBPNO-LIB-002',
      student_id: null,
      class_name: null,
      section: null,
      interests: JSON.stringify({ title: 'Associate Librarian' })
    },
    {
      school_code: 'VBPNO',
      name: 'Pradeep Joshi',
      role: 'teacher',
      designation: 'PGT Computer Science',
      department: 'IT & Computer Science',
      phone: '9820200005',
      email: 'teach1.vbpno@librika.in',
      plain_pass: 'Teach@123',
      pass_hash: teachHash,
      permissions: '[]',
      employee_id: 'VBPNO-TCH-001',
      student_id: null,
      class_name: 'Class 11 & 12',
      section: 'A',
      interests: JSON.stringify({ subject: 'Computer Science & AI', role: 'Faculty' })
    },
    {
      school_code: 'VBPNO',
      name: 'Neha Kapoor',
      role: 'teacher',
      designation: 'TGT Social Sciences',
      department: 'Humanities',
      phone: '9820200006',
      email: 'teach2.vbpno@librika.in',
      plain_pass: 'Teach@123',
      pass_hash: teachHash,
      permissions: '[]',
      employee_id: 'VBPNO-TCH-002',
      student_id: null,
      class_name: 'Class 9 & 10',
      section: 'C',
      interests: JSON.stringify({ subject: 'Social Studies & Civics', role: 'Faculty' })
    },
    {
      school_code: 'VBPNO',
      name: 'Kabir Mehta',
      role: 'student',
      designation: 'Student',
      department: 'Middle School',
      phone: '9820200007',
      email: 'kabir.vbpno@librika.in',
      plain_pass: 'Student@123',
      pass_hash: studentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPNO-STU-2001',
      admission_no: 'VBPNO-STU-2001',
      class_name: 'Class 9',
      section: 'C',
      alt_phone: '9820200008', // Father's phone
      interests: JSON.stringify({ favorites: ['Robotics', 'Graphic Novels', 'Astronomy'] })
    },
    {
      school_code: 'VBPNO',
      name: 'Naveen Mehta',
      role: 'parent',
      designation: 'Parent / Guardian',
      department: null,
      phone: '9820200008',
      email: 'parent1.vbpno@librika.in',
      plain_pass: 'Parent@123',
      pass_hash: parentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPNO-STU-2001', // Linked to Kabir
      admission_no: null,
      class_name: null,
      section: null,
      alt_phone: '9820200007',
      interests: JSON.stringify({ 
        relation: 'Father', 
        child_name: 'Kabir Mehta', 
        child_student_id: 'VBPNO-STU-2001',
        child_class: 'Class 9-C'
      })
    },
    {
      school_code: 'VBPNO',
      name: 'Rhea Nair',
      role: 'student',
      designation: 'Student',
      department: 'Senior Secondary',
      phone: '9820200009',
      email: 'rhea.vbpno@librika.in',
      plain_pass: 'Student@123',
      pass_hash: studentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPNO-STU-2002',
      admission_no: 'VBPNO-STU-2002',
      class_name: 'Class 12',
      section: 'A',
      alt_phone: '9820200010', // Father's phone
      interests: JSON.stringify({ favorites: ['World Literature', 'Economics', 'Art'] })
    },
    {
      school_code: 'VBPNO',
      name: 'Girish Nair',
      role: 'parent',
      designation: 'Parent / Guardian',
      department: null,
      phone: '9820200010',
      email: 'parent2.vbpno@librika.in',
      plain_pass: 'Parent@123',
      pass_hash: parentHash,
      permissions: '[]',
      employee_id: null,
      student_id: 'VBPNO-STU-2002', // Linked to Rhea
      admission_no: null,
      class_name: null,
      section: null,
      alt_phone: '9820200009',
      interests: JSON.stringify({ 
        relation: 'Father', 
        child_name: 'Rhea Nair', 
        child_student_id: 'VBPNO-STU-2002',
        child_class: 'Class 12-A'
      })
    }
  ];

  // Insert or update each user
  for (const u of usersToSeed) {
    const existing = await db.query(
      "SELECT id FROM users WHERE phone = $1 OR email = $2",
      [u.phone, u.email]
    );

    if (existing.rows && existing.rows.length > 0) {
      const uId = existing.rows[0].id;
      await db.query(`
        UPDATE users SET
          name = $1,
          role = $2,
          school_code = $3,
          password = $4,
          permissions = $5,
          admission_no = $6,
          class = $7,
          section = $8,
          status = 'active',
          is_banned = '0',
          profile_complete = 1,
          designation = $9,
          department = $10,
          employee_id = $11,
          student_id = $12,
          alt_phone = $13,
          interests = $14
        WHERE id = $15
      `, [
        u.name, u.role, u.school_code, u.pass_hash, u.permissions,
        u.admission_no || null, u.class_name || null, u.section || null,
        u.designation || null, u.department || null, u.employee_id || null,
        u.student_id || null, u.alt_phone || null, u.interests || null,
        uId
      ]);
      console.log(`✓ Updated user: [${u.role.toUpperCase()}] ${u.name} (${u.school_code}) - Phone: ${u.phone}`);
    } else {
      // Find max ID < 9000 to keep away from master admin 9998/9999
      const nextId = await getNextNumericId('users', 9000);
      const uid = `lib_usr_${String(nextId).padStart(6, '0')}`;

      await db.query(`
        INSERT INTO users (
          id, uid, name, email, phone, password, role, school_code,
          admission_no, class, section, status, is_banned, permissions,
          profile_complete, designation, department, employee_id, student_id,
          alt_phone, interests, plan_name, physical_reader_score, digital_reader_score,
          overall_reader_score, reading_streak, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, 'active', '0', $12,
          1, $13, $14, $15, $16,
          $17, $18, 'FREE', '10', '10',
          '20', '3', CURRENT_TIMESTAMP
        )
      `, [
        nextId, uid, u.name, u.email, u.phone, u.pass_hash, u.role, u.school_code,
        u.admission_no || null, u.class_name || null, u.section || null, u.permissions,
        u.designation || null, u.department || null, u.employee_id || null, u.student_id || null,
        u.alt_phone || null, u.interests || null
      ]);
      console.log(`✓ Inserted user (ID: ${nextId}): [${u.role.toUpperCase()}] ${u.name} (${u.school_code}) - Phone: ${u.phone}`);
    }
  }

  console.log('\n🎉 Successfully seeded all 2 schools and 20 users!');
  process.exit(0);
}

seedSchoolsAndUsers().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
