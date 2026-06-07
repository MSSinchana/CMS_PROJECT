import pool from '../db/connection.js';

export async function getCurrentUserSocial(userId) {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM user_follows WHERE following_id = ?) AS follower_count,
       (SELECT COUNT(*) FROM user_follows WHERE follower_id = ?) AS following_count,
       (
         SELECT COUNT(*)
         FROM user_follows uf1
         INNER JOIN user_follows uf2
           ON uf1.following_id = uf2.follower_id
          AND uf1.follower_id = uf2.following_id
         WHERE uf1.follower_id = ?
       ) AS connection_count
     `,
    [userId, userId, userId]
  );

  const row = rows[0] || {};

  return {
    followerCount: Number(row.follower_count || 0),
    followingCount: Number(row.following_count || 0),
    connectionCount: Number(row.connection_count || 0)
  };
}

export async function getPeopleForUser(currentUserId) {
  const [rows] = await pool.query(
    `SELECT
       u.user_id,
       u.username,
       u.email,
       u.role,
       u.created_at,
       (SELECT COUNT(*) FROM user_follows WHERE following_id = u.user_id) AS follower_count,
       (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.user_id) AS following_count,
       EXISTS(
         SELECT 1
         FROM user_follows
         WHERE follower_id = ? AND following_id = u.user_id
       ) AS is_following,
       EXISTS(
         SELECT 1
         FROM user_follows a
         INNER JOIN user_follows b
           ON a.following_id = b.follower_id
          AND a.follower_id = b.following_id
         WHERE a.follower_id = ? AND b.following_id = u.user_id
       ) AS is_connected
     FROM users u
     WHERE u.user_id <> ? AND u.role <> 'admin'
     ORDER BY follower_count DESC, u.created_at DESC, u.user_id DESC`,
    [currentUserId, currentUserId, currentUserId]
  );

  return rows.map((row) => ({
      id: row.user_id,
      username: row.username,
      email: row.email,
      role: row.role,
      isAnonymous: false,
      createdAt: row.created_at,
      followerCount: Number(row.follower_count || 0),
      followingCount: Number(row.following_count || 0),
      isFollowing: Boolean(row.is_following),
      isConnected: Boolean(row.is_connected)
    }));
}
