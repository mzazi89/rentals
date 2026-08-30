import postgres from "postgres";
const sql = postgres("postgresql://neondb_owner:npg_6Xg3oZGvQwdE@ep-sparkling-mountain-aeziq3ki-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require", { max: 1 });
const del = await sql`delete from "user" where email like 'audit-bot-%' returning email`;
console.log("deleted:", del.length ? del[0].email : "none");
const p = await sql`delete from profiles where email like 'audit-bot-%' returning email`;
console.log("profiles cleaned:", p.length);
await sql.end();
