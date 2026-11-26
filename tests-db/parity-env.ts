import "./scratch-env";
// the unit tests read the store synchronously: keep a fresh copy after every commit
process.env.PG_SYNC_CACHE = "1";
process.env.PG_TEST_ALIASES = "1";
