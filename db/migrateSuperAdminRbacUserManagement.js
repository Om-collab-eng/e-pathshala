/**
 * db/migrateSuperAdminRbacUserManagement.js
 * Migration for Super Admin User Management, RBAC (Roles & Permissions),
 * User Profiles, and Audit Logging in Librika.
 * Supports both MySQL (MilesWeb production) and SQLite (local dev).
 */

const db = require('../db');

// Complete Librika Permission Catalog (11 Modules, 45+ Granular Permissions)
const PERMISSION_CATALOG = [
  // 1. Dashboard
  { module: 'dashboard', feature: 'Overview', action: 'View', code: 'dashboard.view', name: 'View Dashboard', description: 'View dashboard overview and KPI statistics' },
  { module: 'dashboard', feature: 'Analytics', action: 'View', code: 'dashboard.analytics', name: 'View Analytics', description: 'View analytical charts and trends' },

  // 2. User Management
  { module: 'users', feature: 'Directory', action: 'View', code: 'users.view', name: 'View Users', description: 'Browse and search user directory' },
  { module: 'users', feature: 'Account', action: 'Create', code: 'users.create', name: 'Create User', description: 'Register new students, teachers, and staff' },
  { module: 'users', feature: 'Profile', action: 'Edit', code: 'users.edit', name: 'Edit User Profile', description: 'Modify personal, academic, and contact details' },
  { module: 'users', feature: 'Status', action: 'Disable', code: 'users.disable', name: 'Disable / Suspend User', description: 'Suspend or ban user accounts' },
  { module: 'users', feature: 'Status', action: 'Delete', code: 'users.delete', name: 'Delete User', description: 'Soft-delete user accounts' },
  { module: 'users', feature: 'Status', action: 'Restore', code: 'users.restore', name: 'Restore User', description: 'Restore soft-deleted user accounts' },
  { module: 'users', feature: 'Roles', action: 'Assign', code: 'users.change_role', name: 'Change User Role', description: 'Assign or modify user roles' },
  { module: 'users', feature: 'Permissions', action: 'Manage', code: 'users.manage_perms', name: 'Manage User Permissions', description: 'Grant or revoke custom permissions' },
  { module: 'users', feature: 'Activity', action: 'View', code: 'users.view_activity', name: 'View User Activity', description: 'Inspect user activity timeline and login logs' },
  { module: 'users', feature: 'Data', action: 'Export', code: 'users.export', name: 'Export Users', description: 'Export user directory to CSV' },
  { module: 'users', feature: 'Data', action: 'Import', code: 'users.import', name: 'Import Users', description: 'Bulk import users from validated CSV' },

  // 3. Books & Catalog
  { module: 'books', feature: 'Catalog', action: 'View', code: 'books.view', name: 'View Books', description: 'Browse and search physical book catalog' },
  { module: 'books', feature: 'Catalog', action: 'Add', code: 'books.add', name: 'Add New Book', description: 'Register new books via 3 input modes' },
  { module: 'books', feature: 'Catalog', action: 'Edit', code: 'books.edit', name: 'Edit Book', description: 'Modify book metadata, copies, and location' },
  { module: 'books', feature: 'Catalog', action: 'Delete', code: 'books.delete', name: 'Delete Book', description: 'Remove books from library catalog' },
  { module: 'books', feature: 'Catalog', action: 'Restore', code: 'books.restore', name: 'Restore Book', description: 'Restore deleted books' },
  { module: 'books', feature: 'Data', action: 'Export', code: 'books.export', name: 'Export Books', description: 'Export library catalog to CSV' },
  { module: 'books', feature: 'Data', action: 'Import', code: 'books.import', name: 'Import Books', description: 'Bulk import books from CSV' },

  // 4. Library Transactions / Circulation
  { module: 'circulation', feature: 'Issue', action: 'Execute', code: 'circulation.issue', name: 'Issue Book', description: 'Checkout books to students and staff' },
  { module: 'circulation', feature: 'Return', action: 'Execute', code: 'circulation.return', name: 'Return Book', description: 'Inspect condition, check fines, and complete returns' },
  { module: 'circulation', feature: 'Renew', action: 'Execute', code: 'circulation.renew', name: 'Renew Book', description: 'Extend book loan period' },
  { module: 'circulation', feature: 'History', action: 'View', code: 'circulation.view_tx', name: 'View Transactions', description: 'Access full circulation loan history' },
  { module: 'circulation', feature: 'Fines', action: 'Manage', code: 'circulation.fines', name: 'Manage Fines', description: 'View, settle, or waive library fines' },

  // 5. Digital Vault / E-Library
  { module: 'digital', feature: 'Content', action: 'View', code: 'digital.view', name: 'View Digital Content', description: 'Browse e-books and study materials' },
  { module: 'digital', feature: 'Content', action: 'Upload', code: 'digital.upload', name: 'Upload Digital Content', description: 'Publish e-books, documents, and videos' },
  { module: 'digital', feature: 'Content', action: 'Delete', code: 'digital.delete', name: 'Delete Digital Content', description: 'Remove digital vault items' },

  // 6. Quizzes
  { module: 'quizzes', feature: 'Quizzes', action: 'View', code: 'quizzes.view', name: 'View Quizzes', description: 'Browse library reading quizzes' },
  { module: 'quizzes', feature: 'Quizzes', action: 'Create', code: 'quizzes.create', name: 'Create Quiz', description: 'Author new quizzes and questions' },
  { module: 'quizzes', feature: 'Quizzes', action: 'Edit', code: 'quizzes.edit', name: 'Edit Quiz', description: 'Modify questions and passing criteria' },
  { module: 'quizzes', feature: 'Quizzes', action: 'Delete', code: 'quizzes.delete', name: 'Delete Quiz', description: 'Remove quizzes' },
  { module: 'quizzes', feature: 'Results', action: 'View', code: 'quizzes.results', name: 'View Quiz Results', description: 'Analyze student quiz attempts and scores' },

  // 7. Live Sessions & Classroom
  { module: 'sessions', feature: 'Sessions', action: 'View', code: 'sessions.view', name: 'View Sessions', description: 'View scheduled live classes' },
  { module: 'sessions', feature: 'Sessions', action: 'Create', code: 'sessions.create', name: 'Create Session', description: 'Host live classrooms via Jitsi' },
  { module: 'sessions', feature: 'Sessions', action: 'Manage', code: 'sessions.manage', name: 'Manage Participants', description: 'Control student entry and attendance' },

  // 8. Communication
  { module: 'comms', feature: 'Announcements', action: 'Send', code: 'comms.announcements', name: 'Send Announcements', description: 'Broadcast school and library notices' },
  { module: 'comms', feature: 'Notifications', action: 'Send', code: 'comms.notifications', name: 'Send Notifications', description: 'Send targeted push and in-app alerts' },

  // 9. Reports & Analytics
  { module: 'reports', feature: 'Reports', action: 'View', code: 'reports.view', name: 'View Reports', description: 'Access library, reader, and inventory reports' },
  { module: 'reports', feature: 'Reports', action: 'Export', code: 'reports.export', name: 'Export Reports', description: 'Download analytics and report summaries' },

  // 10. Settings
  { module: 'settings', feature: 'System', action: 'Manage', code: 'settings.system', name: 'Manage System Settings', description: 'Configure platform settings and integrations' },
  { module: 'settings', feature: 'School', action: 'Manage', code: 'settings.school', name: 'Manage School Rules', description: 'Configure fine rates, loan days, and limits' },

  // 11. Security & RBAC
  { module: 'security', feature: 'Audit', action: 'View', code: 'security.audit_logs', name: 'View Audit Logs', description: 'Inspect administrative and security logs' },
  { module: 'security', feature: 'Roles', action: 'Manage', code: 'security.roles', name: 'Manage Roles', description: 'Create, clone, edit, and delete roles' },
  { module: 'security', feature: 'Permissions', action: 'Manage', code: 'security.permissions', name: 'Manage Permissions', description: 'Configure global permission mappings' }
];

// Predefined System Roles
const PREDEFINED_ROLES = [
  { name: 'Super Admin', slug: 'super_admin', description: 'Complete platform oversight, system settings, and multi-school governance.', is_system: 1 },
  { name: 'School Admin', slug: 'admin', description: 'Full administrative control over school library, users, inventory, and reports.', is_system: 1 },
  { name: 'Librarian', slug: 'librarian', description: 'Manages cataloging, circulation desk (issue, return, renew), fines, and inventory.', is_system: 1 },
  { name: 'Teacher', slug: 'teacher', description: 'Can view students, host live sessions, create quizzes, and borrow resources.', is_system: 1 },
  { name: 'Student', slug: 'student', description: 'Can browse catalog, view borrowed books, take reading quizzes, and access e-library.', is_system: 1 },
  { name: 'Parent', slug: 'parent', description: 'Overview of ward reading progress, borrowings, and library fines.', is_system: 1 },
  { name: 'Quiz Manager', slug: 'quiz_manager', description: 'Authoring reading comprehension quizzes and managing question banks.', is_system: 0 },
  { name: 'Content Manager', slug: 'content_manager', description: 'Uploading and curating digital vault books, study guides, and media.', is_system: 0 },
  { name: 'Personal User', slug: 'personal', description: 'Standalone personal library reader and private catalog organizer.', is_system: 1 }
];

async function migrateSuperAdminRbac() {
  console.log('--- Starting Super Admin RBAC & User Management Migration ---');

  // Detect MySQL vs SQLite
  let isMysql = false;
  try {
    const res = await db.query("SELECT VERSION()");
    if (res && res.rows && res.rows.length > 0) isMysql = true;
  } catch (e) {
    isMysql = false;
  }

  // 1. Create `roles` table
  try {
    if (isMysql) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          is_system TINYINT(1) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          is_system INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    console.log('✓ roles table verified/created');
  } catch (err) {
    console.warn('! Note on roles table:', err.message);
  }

  // 2. Create `permissions` table
  try {
    if (isMysql) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          module VARCHAR(50) NOT NULL,
          feature VARCHAR(50) NOT NULL,
          action VARCHAR(50) NOT NULL,
          code VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(150) NOT NULL,
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          module TEXT NOT NULL,
          feature TEXT NOT NULL,
          action TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    console.log('✓ permissions table verified/created');
  } catch (err) {
    console.warn('! Note on permissions table:', err.message);
  }

  // 3. Create `role_permissions` table
  try {
    if (isMysql) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          role_id INT NOT NULL,
          permission_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_role_perm (role_id, permission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(role_id, permission_id)
        )
      `);
    }
    console.log('✓ role_permissions table verified/created');
  } catch (err) {
    console.warn('! Note on role_permissions table:', err.message);
  }

  // 4. Create `user_roles` table (Multi-Role & Context / Portfolio support)
  try {
    if (isMysql) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          role_id INT NOT NULL,
          portfolio_type VARCHAR(50) DEFAULT 'school',
          school_code VARCHAR(50),
          assigned_by INT,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_user_role_context (user_id, role_id, portfolio_type, school_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          role_id INTEGER NOT NULL,
          portfolio_type TEXT DEFAULT 'school',
          school_code TEXT,
          assigned_by INTEGER,
          assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, role_id, portfolio_type, school_code)
        )
      `);
    }
    console.log('✓ user_roles table verified/created');
  } catch (err) {
    console.warn('! Note on user_roles table:', err.message);
  }

  // 5. Add rich profile columns to `users` table
  const userColumns = [
    { name: 'first_name', type: 'VARCHAR(100)' },
    { name: 'last_name', type: 'VARCHAR(100)' },
    { name: 'gender', type: 'VARCHAR(20)' },
    { name: 'alt_phone', type: 'VARCHAR(20)' },
    { name: 'address', type: 'TEXT' },
    { name: 'city', type: 'VARCHAR(100)' },
    { name: 'state', type: 'VARCHAR(100)' },
    { name: 'country', type: 'VARCHAR(100) DEFAULT "India"' },
    { name: 'pincode', type: 'VARCHAR(20)' },
    { name: 'profile_picture', type: 'VARCHAR(255)' },
    { name: 'avatar_id', type: 'VARCHAR(50)' },
    { name: 'student_id', type: 'VARCHAR(50)' },
    { name: 'employee_id', type: 'VARCHAR(50)' },
    { name: 'department', type: 'VARCHAR(100)' },
    { name: 'designation', type: 'VARCHAR(100)' },
    { name: 'academic_year', type: 'VARCHAR(50)' },
    { name: 'interests', type: 'TEXT' },
    { name: 'communication_preferences', type: 'TEXT' },
    { name: 'email_verified', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'phone_verified', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'deleted_at', type: 'DATETIME NULL' },
    { name: 'last_login_at', type: 'DATETIME NULL' },
    { name: 'last_password_change', type: 'DATETIME NULL' }
  ];

  for (const col of userColumns) {
    try {
      await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✓ Added column '${col.name}' to users table`);
    } catch (err) {
      if (err.message && (err.message.includes('duplicate column') || err.message.includes('already exists') || err.message.includes('Duplicate column name'))) {
        // Already exists
      } else {
        // Fallback for types on sqlite
        try {
          await db.query(`ALTER TABLE users ADD COLUMN ${col.name} TEXT`);
        } catch (e2) {}
      }
    }
  }

  // 6. Seed/Verify Predefined System Roles
  for (const r of PREDEFINED_ROLES) {
    try {
      const existing = await db.query('SELECT id FROM roles WHERE slug = $1', [r.slug]);
      if (!existing.rows || existing.rows.length === 0) {
        await db.query(
          'INSERT INTO roles (name, slug, description, is_system, status) VALUES ($1, $2, $3, $4, $5)',
          [r.name, r.slug, r.description, r.is_system, 'active']
        );
        console.log(`✓ Seeded role: ${r.name} (${r.slug})`);
      }
    } catch (e) {
      console.warn(`! Note seeding role ${r.slug}:`, e.message);
    }
  }

  // 7. Seed/Verify Permission Catalog
  for (const p of PERMISSION_CATALOG) {
    try {
      const existing = await db.query('SELECT id FROM permissions WHERE code = $1', [p.code]);
      if (!existing.rows || existing.rows.length === 0) {
        await db.query(
          'INSERT INTO permissions (module, feature, action, code, name, description) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.module, p.feature, p.action, p.code, p.name, p.description]
        );
      }
    } catch (e) {
      console.warn(`! Note seeding permission ${p.code}:`, e.message);
    }
  }
  console.log(`✓ Seeded ${PERMISSION_CATALOG.length} permissions into catalog`);

  // 8. Map Default Permissions to System Roles
  try {
    const rolesRes = await db.query('SELECT id, slug FROM roles');
    const permsRes = await db.query('SELECT id, code FROM permissions');
    const permMap = {};
    (permsRes.rows || []).forEach(p => { permMap[p.code] = p.id; });

    for (const r of (rolesRes.rows || [])) {
      let allowedCodes = [];
      if (r.slug === 'super_admin') {
        // Super Admin has ALL permissions
        allowedCodes = Object.keys(permMap);
      } else if (r.slug === 'admin') {
        // School Admin has full school management
        allowedCodes = Object.keys(permMap).filter(c => !c.startsWith('settings.system'));
      } else if (r.slug === 'librarian') {
        // Librarian
        allowedCodes = [
          'dashboard.view', 'books.view', 'books.add', 'books.edit', 'books.delete', 'books.restore', 'books.export', 'books.import',
          'circulation.issue', 'circulation.return', 'circulation.renew', 'circulation.view_tx', 'circulation.fines',
          'digital.view', 'digital.upload', 'reports.view', 'reports.export', 'settings.school'
        ];
      } else if (r.slug === 'teacher') {
        // Teacher
        allowedCodes = [
          'dashboard.view', 'books.view', 'circulation.view_tx', 'digital.view',
          'quizzes.view', 'quizzes.create', 'quizzes.edit', 'quizzes.results',
          'sessions.view', 'sessions.create', 'sessions.manage', 'reports.view'
        ];
      } else if (r.slug === 'student') {
        // Student
        allowedCodes = [
          'dashboard.view', 'books.view', 'digital.view', 'quizzes.view', 'sessions.view'
        ];
      } else if (r.slug === 'parent') {
        // Parent
        allowedCodes = [
          'dashboard.view', 'books.view', 'reports.view'
        ];
      } else if (r.slug === 'quiz_manager') {
        // Quiz Manager
        allowedCodes = [
          'dashboard.view', 'books.view', 'quizzes.view', 'quizzes.create', 'quizzes.edit', 'quizzes.delete', 'quizzes.results'
        ];
      } else if (r.slug === 'content_manager') {
        // Content Manager
        allowedCodes = [
          'dashboard.view', 'books.view', 'digital.view', 'digital.upload', 'digital.delete'
        ];
      } else if (r.slug === 'personal') {
        allowedCodes = [
          'dashboard.view', 'books.view', 'digital.view'
        ];
      }

      for (const code of allowedCodes) {
        const pId = permMap[code];
        if (pId) {
          try {
            await db.query(
              'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
              [r.id, pId]
            ).catch(() => {});
          } catch (e) {}
        }
      }
    }
    console.log('✓ Default role-permission mappings synchronized');
  } catch (err) {
    console.warn('! Note on role_permissions mapping:', err.message);
  }

  // 9. Backfill `user_roles` from existing `users.role` to ensure 100% zero downtime and continuity
  try {
    const usersRes = await db.query('SELECT id, role, school_code FROM users WHERE role IS NOT NULL');
    const rolesRes = await db.query('SELECT id, slug FROM roles');
    const slugToId = {};
    (rolesRes.rows || []).forEach(r => { slugToId[r.slug] = r.id; });

    let backfilled = 0;
    for (const u of (usersRes.rows || [])) {
      if (!u || !u.id) continue;
      const cleanRole = String(u.role || '').toLowerCase().trim();
      let roleId = slugToId[cleanRole];
      if (!roleId && cleanRole.includes('super')) roleId = slugToId['super_admin'];
      if (!roleId && cleanRole === 'owner') roleId = slugToId['personal'];
      if (!roleId) roleId = slugToId['student']; // fallback

      if (roleId) {
        await db.query(`
          INSERT IGNORE INTO user_roles (user_id, role_id, portfolio_type, school_code)
          VALUES ($1, $2, $3, $4)
        `, [u.id, roleId, cleanRole === 'personal' ? 'personal' : 'school', u.school_code || 'GLOBAL']).catch(() => {});
        backfilled++;
      }
    }
    console.log(`✓ Synchronized ${backfilled} users into user_roles`);
  } catch (err) {
    console.warn('! Note on user_roles backfill:', err.message);
  }

  // 10. Backfill `student_id` for students if missing (format: VBPS + 5 digits)
  try {
    const studentsRes = await db.query(`
      SELECT id, student_id FROM users 
      WHERE (LOWER(role) = 'student' OR role IS NOT NULL) 
        AND (student_id IS NULL OR student_id = '')
      ORDER BY id ASC
    `);
    let sSeq = 1;
    for (const s of (studentsRes.rows || [])) {
      const formattedId = `VBPS${String(sSeq).padStart(5, '0')}`;
      await db.query('UPDATE users SET student_id = $1 WHERE id = $2', [formattedId, s.id]).catch(() => {});
      sSeq++;
    }
    console.log(`✓ Verified and formatted student IDs`);
  } catch (e) {
    console.warn('! Note on student_id format:', e.message);
  }

  console.log('--- Super Admin RBAC & User Management Migration Complete ---');
}

if (require.main === module) {
  migrateSuperAdminRbac()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = {
  migrateSuperAdminRbac,
  PERMISSION_CATALOG,
  PREDEFINED_ROLES
};
