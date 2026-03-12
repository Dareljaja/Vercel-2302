# 2302 Vercel App Fix TODO

## Status: [IN PROGRESS] ✅

### Approved Plan Steps:

1. **[✅ COMPLETED]** Fix Products Display
   - ✅ Updated `public/script.js`: Now fetches `/api/products`, uses modals
   - ✅ Populated `api/products.json`: 10 full products
   - ✅ Updated `api/products/index.js`: Dynamic JSON server

2. **[✅ COMPLETED]** Fix Admin Panel
   - ✅ Created `api/admin/products.js` (GET/POST auth)
   - ✅ Created `api/admin/upload.js` (Vercel Blob)
   - ✅ Full `admin-panel.html` UI (table + CRUD)
   - ✅ Removed old Express `admin-api.js`

3. **[PENDING]** ✅ Clean Tech Stack
   - Remove PHP links from `public/script.js` & `index.html`
   - Add missing endpoints (`/api/create-preference.js`)

4. **[PENDING]** ✅ Test & Deploy
   - `npm i && vercel dev`
   - Deploy: `vercel --prod`
   - Verify products/admin

**Next Step: #1 Products Display**

