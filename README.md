# PF_Project_4P1W
4 Pics 1 Word with randomized puzzle packs and an admin CMS for image/tag/puzzle/pack management.

## Repository structure
- `auth-api` — ASP.NET Core Web API for authentication and JWT role claims (`player`, `admin`)
- `resource-api` — ASP.NET Core Web API for packs, puzzles, images, tags, gameplay, progress
- `web-app` — React + Vite app for player pages and admin CMS pages

Each service is independently runnable.

## Local prerequisites
- .NET SDK 10+
- Node.js 20+ and npm

## Run each service
### auth-api
```powershell
cd auth-api
dotnet run
```

### resource-api
```powershell
cd resource-api
dotnet run
```

### web-app
```powershell
cd web-app
npm install
npm run dev
```

## Iteration guide (6)
1. Foundations & Auth
2. Packs & Randomization (Player)
3. Puzzles & Core Gameplay
4. CMS: Images + Tags
5. CMS: Puzzles + Packs
6. Polish, QA, and Launch

## API contract targets
### Public/Player (resource-api)
- `GET /packs?random=true`
- `GET /puzzles/next?packId=...`
- `POST /game/submit`
- `GET /profile/progress`

### Admin CMS (resource-api)
- `GET/POST/PUT/DELETE /cms/images`
- `GET/POST/DELETE /cms/tags`
- `POST /cms/images/{id}/tags`
- `DELETE /cms/images/{id}/tags/{tag}`
- `GET/POST/PUT/DELETE /cms/packs`
- `GET/POST/PUT/DELETE /cms/puzzles`
- `POST /cms/packs/{id}/publish`

## Notes
- Keep admin write operations protected with `role=admin`.
- Keep payloads small and version endpoints when needed.
- Use local file storage first, return image URLs from API.
