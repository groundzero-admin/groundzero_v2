# GroundZero Frontend Rules

## HTTP Calls
- ALWAYS use `import { api } from "@/api/client"` for all API calls
- NEVER use raw `fetch()` for internal API calls — the `api` client handles auth tokens, refresh, and interceptors automatically
- `api.get/post/put/delete` — that's it

## Architecture
- Frontend is a dumb renderer — no business logic
- Backend decides everything: next question, competency selection, BKT updates
- Never compute scores, mastery, or ordering on the frontend

## React Best Practices
- Use React Query for all server state — hooks in `src/api/hooks/`
- Keep components small and focused — one responsibility per component
- No useEffect for data fetching — use React Query
- No prop drilling more than 2 levels — use context or co-locate state
- Invalidate queries after mutations — don't manually update cache
- Use TypeScript strictly — no `any`, define interfaces for all API responses

## State Management
- Server state: React Query
- UI state: useState / useReducer local to component
- Global UI state: React context (AuthContext etc.)
- Never store server data in useState

## Performance
- Use `staleTime` on queries that don't change frequently
- Memoize expensive computations with useMemo
- Avoid re-renders: don't create objects/arrays inline in JSX props

## Patterns
- Question templates drive UI via `input_schema.fields` — add field types in `FieldInput` in `CreateQuestionPage.tsx`
- Question widgets: `packages/question-widgets/src/` — use `shared.ts` style tokens
- Admin pages: CSS modules from `src/pages/admin/admin.css`
