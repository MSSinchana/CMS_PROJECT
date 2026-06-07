import pool from '../db/connection.js';

export function normalizeMediaItems(mediaItems) {
  if (!Array.isArray(mediaItems)) {
    return [];
  }

  return mediaItems
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      name: item.name || 'media',
      type: item.type || 'application/octet-stream',
      dataUrl: item.dataUrl || '',
      kind: item.kind || inferMediaKind(item.type)
    }))
    .filter((item) => item.dataUrl && (item.kind === 'image' || item.kind === 'video'));
}

export async function loadMediaMap(contentIds) {
  const ids = normalizeContentIds(contentIds);

  if (ids.length === 0) {
    return new Map();
  }

  const placeholders = ids.map(() => '?').join(', ');

  const [rows] = await pool.query(
    `SELECT media_id, content_id, media_name, media_type, media_data, media_kind, created_at
     FROM content_media
     WHERE content_id IN (${placeholders})
     ORDER BY media_id ASC`,
    ids
  );

  return rows.reduce((map, row) => {
    const key = row.content_id;
    const list = map.get(key) || [];
    list.push(mapMediaRow(row));
    map.set(key, list);
    return map;
  }, new Map());
}

export async function loadPreviewMediaMap(contentIds) {
  const ids = normalizeContentIds(contentIds);

  if (ids.length === 0) {
    return new Map();
  }

  const placeholders = ids.map(() => '?').join(', ');

  const [rows] = await pool.query(
    `SELECT media_id, content_id, media_name, media_type, media_data, media_kind, created_at
     FROM content_media
     WHERE content_id IN (${placeholders})
     ORDER BY content_id ASC, media_id ASC`,
    ids
  );

  return rows.reduce((map, row) => {
    if (!map.has(row.content_id)) {
      map.set(row.content_id, [mapMediaRow(row)]);
    }
    return map;
  }, new Map());
}

export async function replaceContentMedia(contentId, mediaItems) {
  const normalized = normalizeMediaItems(mediaItems);

  await pool.query('DELETE FROM content_media WHERE content_id = ?', [contentId]);

  if (normalized.length === 0) {
    return [];
  }

  const values = normalized.map((item) => [
    contentId,
    item.name,
    item.type,
    item.dataUrl,
    item.kind
  ]);

  await pool.query(
    'INSERT INTO content_media (content_id, media_name, media_type, media_data, media_kind) VALUES ?',
    [values]
  );

  return normalized;
}

export function mapMediaRow(row) {
  return {
    id: row.media_id,
    contentId: row.content_id,
    name: row.media_name,
    type: row.media_type,
    kind: row.media_kind,
    dataUrl: row.media_data,
    createdAt: row.created_at
  };
}

function inferMediaKind(type) {
  return typeof type === 'string' && type.startsWith('video/') ? 'video' : 'image';
}

function normalizeContentIds(contentIds) {
  return Array.isArray(contentIds)
    ? contentIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    : [];
}
