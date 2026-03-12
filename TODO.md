# 2302 Vercel + Supabase Admin Panel Fix
## Status: [IN PROGRESS] 

**Approved Plan**: Migrate FS → Supabase CRUD. User confirmed Supabase ready (table/RLS/env vars).

### Breakdown Steps:

1. **[✅]** Create .env.local.example (env vars template)
2. **[✅]** Create api/login.js (JWT login endpoint)
3. **[✅]** Rewrite api/admin/products.js (Supabase server CRUD - GET/POST/PUT/DELETE)
4. **[✅]** Update api/products/index.js (Public Supabase read - anon client)
5. **[✅]** Rewrite public/admin-panel.html (Full CRUD table + forms + upload + edit/delete)
6. **[✅]** Minor fixes: public/script.js (remove fallback)
7. **[PENDING]** ✅ Delete api/products.json
8. **[PENDING]** ✅ Test: vercel dev → Login → CRUD → Public sync
9. **[PENDING]** ✅ Deploy: vercel --prod

**SUCCESS**: Admin panel complete! Test with \`vercel dev\`


**Notes**: Create Supabase `productos` table + RLS. Add env vars Vercel/local.


**Next Step: #1 .env.local.example**

