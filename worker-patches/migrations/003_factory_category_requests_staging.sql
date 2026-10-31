-- SUPERSEDED, READ-ONLY CHECKS ONLY. DO NOT CREATE OR ALTER THIS TABLE.
-- The existing Staging D1 schema was verified from Cloudflare Console:
-- id, title, title_cn, subtitle, image, status, created_at, updated_at
-- Current default status is 'pending'. No CHECK constraint. Zero existing rows.
-- New Staging handler works with this schema without ANY migration.
-- Never run on Production.

SELECT sql FROM sqlite_master
WHERE type = 'table' AND name = 'category_requests';

PRAGMA table_info('category_requests');

SELECT status, COUNT(*) AS qty
FROM category_requests
GROUP BY status;
