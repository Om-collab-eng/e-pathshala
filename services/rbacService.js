/**
 * services/rbacService.js
 * Centralized Role-Based Access Control (RBAC) and User Management Service for Librika.
 * Manages roles, permissions, dynamic role building, cloning, and user assignments.
 */

const db = require('../db');

/**
 * Normalize and validate Indian 10-digit mobile number
 * Returns { valid: boolean, normalized: string, error?: string }
 */
function normalizeIndianMobile(rawInput) {
  if (!rawInput) return { valid: false, normalized: '', error: 'Mobile number is required' };
  let str = String(rawInput).trim();
  // Strip non-digit characters except leading plus
  str = str.replace(/[\s\-\(\)\.]/g, '');
  // Strip +91 or 91 country code prefix if 12 digits
  if (str.startsWith('+91')) {
    str = str.substring(3);
  } else if (str.startsWith('91') && str.length === 12) {
    str = str.substring(2);
  } else if (str.startsWith('0') && str.length === 11) {
    str = str.substring(1);
  }

  // Validate 10 digits starting with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(str)) {
    return {
      valid: false,
      normalized: str,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).'
    };
  }

  return { valid: true, normalized: str };
}

/**
 * Generate a clean URL-friendly unique slug from role name
 */
function generateSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Fetch all permissions grouped by module
 */
async function getAllPermissions() {
  const res = await db.query(
    'SELECT id, module, feature, action, code, name, description FROM permissions ORDER BY module ASC, id ASC'
  );
  const perms = res.rows || [];
  const grouped = {};

  perms.forEach(p => {
    if (!grouped[p.module]) {
      grouped[p.module] = {
        module: p.module,
        label: p.module.charAt(0).toUpperCase() + p.module.slice(1),
        permissions: []
      };
    }
    grouped[p.module].permissions.push(p);
  });

  return { list: perms, grouped: Object.values(grouped) };
}

/**
 * Fetch all roles with assigned user counts and permission counts
 */
async function getAllRoles(onlyActive = false) {
  const where = onlyActive ? "WHERE r.status = 'active'" : "";
  const queryStr = `
    SELECT r.id, r.name, r.slug, r.description, r.is_system, r.status, r.created_at, r.updated_at,
           (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur WHERE ur.role_id = r.id) as user_count,
           (SELECT COUNT(rp.permission_id) FROM role_permissions rp WHERE rp.role_id = r.id) as perm_count
    FROM roles r
    ${where}
    ORDER BY (CASE WHEN r.slug = 'super_admin' THEN 1 WHEN r.is_system = 1 THEN 2 ELSE 3 END), r.name ASC
  `;
  const res = await db.query(queryStr);
  return res.rows || [];
}

/**
 * Fetch a single role by ID with all its permission codes and IDs
 */
async function getRoleById(roleId) {
  const roleRes = await db.query(
    'SELECT id, name, slug, description, is_system, status, created_at FROM roles WHERE id = $1',
    [roleId]
  );
  if (!roleRes.rows || roleRes.rows.length === 0) return null;
  const role = roleRes.rows[0];

  const permRes = await db.query(`
    SELECT p.id, p.code, p.module, p.name 
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = $1
  `, [roleId]);

  role.permissions = permRes.rows || [];
  role.permission_ids = role.permissions.map(p => p.id);
  role.permission_codes = role.permissions.map(p => p.code);
  return role;
}

/**
 * Create a new custom role
 */
async function createRole({ name, description, permission_ids = [], status = 'active' }) {
  if (!name || !name.trim()) throw new Error('Role name is required');
  let slug = generateSlug(name);
  if (!slug) slug = 'custom_role_' + Date.now();

  // Check unique slug
  const check = await db.query('SELECT id FROM roles WHERE slug = $1', [slug]);
  if (check.rows && check.rows.length > 0) {
    slug = `${slug}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const insRes = await db.query(
    'INSERT INTO roles (name, slug, description, is_system, status) VALUES ($1, $2, $3, 0, $4)',
    [name.trim(), slug, description || '', status || 'active']
  );

  let newRoleId = null;
  if (insRes.rows && insRes.rows[0] && insRes.rows[0].id) {
    newRoleId = insRes.rows[0].id;
  } else {
    const fetchId = await db.query('SELECT id FROM roles WHERE slug = $1', [slug]);
    if (fetchId.rows && fetchId.rows[0]) newRoleId = fetchId.rows[0].id;
  }

  if (newRoleId && Array.isArray(permission_ids) && permission_ids.length > 0) {
    for (const pId of permission_ids) {
      await db.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
        [newRoleId, parseInt(pId, 10)]
      ).catch(() => {});
    }
  }

  return await getRoleById(newRoleId);
}

/**
 * Update an existing role
 */
async function updateRole(roleId, { name, description, permission_ids, status }) {
  const role = await getRoleById(roleId);
  if (!role) throw new Error('Role not found');

  if (role.is_system && (status === 'inactive' || status === 'disabled')) {
    throw new Error('System-protected roles cannot be disabled');
  }

  await db.query(
    'UPDATE roles SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4',
    [name ? name.trim() : role.name, description !== undefined ? description : role.description, status || role.status, roleId]
  ).catch(async () => {
    // Fallback SQLite without NOW()
    await db.query(
      'UPDATE roles SET name = $1, description = $2, status = $3 WHERE id = $4',
      [name ? name.trim() : role.name, description !== undefined ? description : role.description, status || role.status, roleId]
    );
  });

  // Update permissions if provided
  if (Array.isArray(permission_ids)) {
    // Super admin permissions are immutable (always has all)
    if (role.slug !== 'super_admin') {
      await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      for (const pId of permission_ids) {
        await db.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [roleId, parseInt(pId, 10)]
        ).catch(() => {});
      }
    }
  }

  return await getRoleById(roleId);
}

/**
 * Clone an existing role
 */
async function cloneRole(sourceRoleId, { newName, newDescription }) {
  const source = await getRoleById(sourceRoleId);
  if (!source) throw new Error('Source role not found');
  const cloneName = newName ? newName.trim() : `${source.name} (Copy)`;
  const cloneDesc = newDescription !== undefined ? newDescription : `Cloned from ${source.name}. ${source.description || ''}`;

  return await createRole({
    name: cloneName,
    description: cloneDesc,
    permission_ids: source.permission_ids,
    status: 'active'
  });
}

/**
 * Delete a custom role
 */
async function deleteRole(roleId) {
  const role = await getRoleById(roleId);
  if (!role) throw new Error('Role not found');
  if (role.is_system) throw new Error('System-protected roles cannot be deleted');

  // Verify no users are assigned
  const checkUsers = await db.query('SELECT COUNT(*) as c FROM user_roles WHERE role_id = $1', [roleId]);
  const userCount = parseInt(checkUsers.rows[0]?.c || 0, 10);
  if (userCount > 0) {
    throw new Error(`Cannot delete role '${role.name}'. It is currently assigned to ${userCount} user(s). Reassign them first.`);
  }

  await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
  await db.query('DELETE FROM roles WHERE id = $1', [roleId]);
  return { success: true, message: `Role '${role.name}' deleted successfully.` };
}

/**
 * Calculate user effective permissions (union across all assigned roles)
 */
async function getUserEffectivePermissions(userId, roleStringFallback = null) {
  if (!userId) return [];

  // Super admin always has all permissions
  if (roleStringFallback && String(roleStringFallback).toLowerCase().includes('super')) {
    const all = await db.query('SELECT code FROM permissions');
    return (all.rows || []).map(p => p.code);
  }

  const res = await db.query(`
    SELECT DISTINCT p.code 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id AND r.status = 'active'
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1
  `, [userId]);

  if (res.rows && res.rows.length > 0) {
    return res.rows.map(r => r.code);
  }

  // Fallback if user_roles not populated yet: map from users.role
  if (roleStringFallback) {
    const rRes = await db.query(`
      SELECT DISTINCT p.code 
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.slug = $1 AND r.status = 'active'
    `, [String(roleStringFallback).toLowerCase().trim()]);
    return (rRes.rows || []).map(r => r.code);
  }

  return [];
}

/**
 * Assign a role to a user (syncs both user_roles and users.role)
 */
async function assignUserRole(userId, roleIdOrSlug, context = {}) {
  let role = null;
  if (typeof roleIdOrSlug === 'number' || !isNaN(parseInt(roleIdOrSlug, 10))) {
    role = await getRoleById(parseInt(roleIdOrSlug, 10));
  } else {
    const rRes = await db.query('SELECT id, name, slug FROM roles WHERE slug = $1', [String(roleIdOrSlug).toLowerCase().trim()]);
    if (rRes.rows && rRes.rows[0]) role = rRes.rows[0];
  }

  if (!role) throw new Error('Role does not exist');

  const portfolioType = context.portfolio_type || (role.slug === 'personal' ? 'personal' : 'school');
  const schoolCode = context.school_code || 'GLOBAL';
  const assignedBy = context.assigned_by || null;

  // Insert or update in user_roles
  await db.query(`
    INSERT INTO user_roles (user_id, role_id, portfolio_type, school_code, assigned_by)
    VALUES ($1, $2, $3, $4, $5)
    ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), assigned_by = VALUES(assigned_by)
  `, [userId, role.id, portfolioType, schoolCode, assignedBy]).catch(async () => {
    // Fallback SQLite / PG
    await db.query('DELETE FROM user_roles WHERE user_id = $1 AND portfolio_type = $2', [userId, portfolioType]).catch(() => {});
    await db.query(`
      INSERT INTO user_roles (user_id, role_id, portfolio_type, school_code, assigned_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, role.id, portfolioType, schoolCode, assignedBy]);
  });

  // Synchronize users.role for complete backward compatibility
  await db.query('UPDATE users SET role = $1 WHERE id = $2', [role.slug, userId]);

  return { success: true, role };
}

module.exports = {
  normalizeIndianMobile,
  generateSlug,
  getAllPermissions,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  cloneRole,
  deleteRole,
  getUserEffectivePermissions,
  assignUserRole
};
