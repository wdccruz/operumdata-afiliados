PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tiers (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, min_companies INTEGER NOT NULL UNIQUE CHECK(min_companies>=0),
 rate_bps INTEGER NOT NULL CHECK(rate_bps BETWEEN 0 AND 10000)
);
INSERT OR IGNORE INTO tiers VALUES (1,'Inicial · simulação',0,500),(2,'Crescimento · simulação',3,750),(3,'Destaque · simulação',10,1000);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','affiliate')),
 status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS companies (
 id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL,
 cnpj TEXT NOT NULL UNIQUE, domain TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payments (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), affiliate_id TEXT NOT NULL REFERENCES users(id),
 period TEXT NOT NULL, base_cents INTEGER NOT NULL CHECK(base_cents>0), rate_bps INTEGER NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')),
 reference TEXT, paid_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(company_id,period)
);
CREATE TABLE IF NOT EXISTS audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL,
 target_id TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO migrations(version) VALUES (1);
