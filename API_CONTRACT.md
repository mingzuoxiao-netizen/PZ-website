# Peng-Zhan Platform — Frozen API Contract (v1.0)

⚠️ This document is AUTHORITATIVE.

Any frontend or backend implementation MUST strictly follow this contract.
Endpoints, behaviors, or permissions NOT listed here are FORBIDDEN and MUST NOT be implemented or called.

---

## 0. Global Rules

- Base URL:
  https://pz-inquiry-api.mingzuoxiao29.workers.dev

- API Style:
  REST / JSON over HTTPS

- All timestamps are ISO 8601 strings.

---

## 1. Authentication

### Login

POST /login

Request Body:
```json
{
  "username": "string",
  "password": "string"
}
Response:

json
复制代码
{
  "token": "string",
  "user": {
    "id": "uuid",
    "username": "string",
    "role": "ADMIN | FACTORY",
    "org_id": "string | null"
  }
}
Auth Model
Authentication uses Bearer Token

Token is stateless

Token is sent via HTTP header:

makefile
复制代码
Authorization: Bearer <token>
Token Storage (Frontend)
sessionStorage["pz_auth_token"]

Explicitly NOT Supported
No logout endpoint

No refresh token

No session endpoint

No /me endpoint

2. Roles & Permissions
ADMIN
Full system access

May access ALL endpoints listed in this document

FACTORY
Limited access

May ONLY access:

GET /factory/products

POST /factory/products

PUT /factory/products/:id

POST /upload-image

Must NOT access any /admin/* endpoints

PUBLIC
No authentication

May ONLY access:

GET /products

GET /site-config

3. Products
Public Products (Website)
GET /products

Auth: NONE

Returns only products where is_published = 1

Admin Products (Management)
GET /admin/products
POST /admin/products
PUT /admin/products/:id
DELETE /admin/products/:id

Auth: ADMIN only

Factory Products (Submission)
GET /factory/products
POST /factory/products
PUT /factory/products/:id

Auth: FACTORY only

Factory may NOT delete products

4. Accounts (Admin Only)
GET /admin/accounts?role=FACTORY
POST /admin/accounts/create
POST /admin/accounts/set-active
POST /admin/accounts/reset-password

Auth: ADMIN only

5. Site Configuration
GET /site-config
PUT /site-config

GET:

Public access allowed

Returns published site configuration

PUT:

ADMIN only

Overwrites current configuration

6. Media / Images
POST /upload-image

Auth: ADMIN or FACTORY

Multipart FormData

Returns:

json
复制代码
{
  "url": "https://cdn..."
}
POST /admin/delete-image

Auth: ADMIN only

Request Body:

json
复制代码
{
  "key": "string"
}
7. Inquiries
POST /inquiries

Public endpoint

Creates inquiry record

GET /admin/inquiries

Auth: ADMIN only

8. Forbidden / Removed Endpoints
The following endpoints MUST NOT exist and MUST NOT be reintroduced:

/site-config/history

/admin/logout

/admin/me

/collections

/assets

Any endpoint not explicitly listed in this document

Any frontend or backend code referencing the above is INVALID.
