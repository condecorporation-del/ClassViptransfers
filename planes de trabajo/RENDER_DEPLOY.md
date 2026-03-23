# Render Deployment Setup

## Repository Structure

The repository is structured for Render deployment:

```
/
├── backend/          # Express.js backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   ├── src/
│   └── dist/        # Generated (gitignored)
├── src/              # Frontend (Vite/React)
├── public/
├── package.json      # Frontend package.json
└── vite.config.ts
```

## Backend Structure

The `backend/` folder is at the repository root and contains:

- ✅ `package.json` - With build and start scripts
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `prisma/` - Prisma schema and migrations
- ✅ `src/` - Source code
- ✅ `dist/` - Build output (generated, gitignored)

## Render Configuration

### Build Command

**Exact command for Render:**
```
cd backend && npm install && npm run build
```

### Start Command

**Exact command for Render:**
```
cd backend && npm start
```

### Render Dashboard Settings

When setting up the service in Render:

1. **Root Directory:** Leave empty (or set to `/`)
2. **Build Command:** `cd backend && npm install && npm run build`
3. **Start Command:** `cd backend && npm start`
4. **Environment:** Node
5. **Node Version:** 18.x or higher

### Environment Variables

Set all required environment variables in Render dashboard:
- See `backend/env.example.txt` for complete list
- See `ENV_CHECKLIST.md` for setup guide

## Build Scripts

**package.json scripts:**
- `build`: `tsc` - Compiles TypeScript to JavaScript
- `start`: `node dist/server.js` - Runs the compiled server
- `postinstall`: `prisma generate` - Generates Prisma client after npm install

## Deployment Steps

1. **Connect Repository:**
   - Connect GitHub repo to Render
   - Select backend folder as root

2. **Configure Build:**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`

3. **Set Environment Variables:**
   - Copy from `backend/env.example.txt`
   - Set all required variables

4. **Deploy:**
   - Render will automatically build and deploy
   - Check logs for any errors

## Verification

After deployment, verify:
- [ ] Server starts successfully
- [ ] Health check endpoint works: `/health`
- [ ] Database connection works
- [ ] API endpoints respond correctly

## Troubleshooting

**Build fails:**
- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check TypeScript compilation errors

**Start fails:**
- Verify `dist/server.js` exists
- Check environment variables are set
- Review server logs

**Database connection fails:**
- Verify `DATABASE_URL` is correct
- Check Supabase connection string format
- Ensure SSL mode is enabled

## Notes

- Backend folder is at repository root ✅
- Build and start scripts are configured ✅
- Prisma client generates on install ✅
- Environment variables documented ✅

