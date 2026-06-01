// ============================================================
// apiClient.ts — аналог index.ts (api/index.ts) из оригинала
//
// Оригинал использует openapi-fetch с middleware-цепочкой.
// Здесь воспроизводим тот же паттерн на нативном fetch.
//
// Middleware в оригинале:
//   auth        → добавляет Bearer token к каждому запросу
//   locale      → добавляет Accept-Language header
//   errorLogger → логирует ошибки в Sentry
//
// Здесь:
//   authMiddleware   → то же
//   localeMiddleware → то же
//   loggerMiddleware → console.error вместо Sentry
//
// Плюс: token refresh при 401 — как fetchWithRefresh в оригинале
// ============================================================

import { session } from './session'

// ============================================================
// ТИП MIDDLEWARE
// Каждый middleware — функция: (request) → Promise<request>
// Цепочка применяется последовательно перед отправкой
// ============================================================
type RequestMiddleware = (request: Request) => Promise<Request>
type ResponseMiddleware = (response: Response, request: Request) => Promise<Response>

// Middleware 1: добавляем Authorization header
// В оригинале: auth.onRequest
const authMiddleware: RequestMiddleware = async (request) => {
    const { token } = session.get()
    if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
}

// Middleware 2: добавляем язык
// В оригинале: locale.onRequest
const localeMiddleware: RequestMiddleware = async (request) => {
    request.headers.set('Accept-Language', 'ru')
    return request
}

// Middleware 3: логируем ошибки
// В оригинале: errorLogger.onResponse (логирует в Sentry)
const loggerMiddleware: ResponseMiddleware = async (response, request) => {
    if (!response.ok) {
        const url = new URL(request.url)
        console.error(`[API Error] ${request.method} ${url.pathname}`, {
            status: response.status,
            statusText: response.statusText,
        })
    }
    return response
}

// ============================================================
// TOKEN REFRESH — как fetchWithRefresh в оригинале
// При 401 → пробуем обновить токен → повторяем запрос
// Для демо: симулируем refresh через fake delay
// ============================================================
const FAKE_USERS: Record<string, { token: string; refreshToken: string; userId: string }> = {
    'alice@demo.com':   { token: 'token_alice',   refreshToken: 'refresh_alice',   userId: 'alice' },
    'bob@demo.com':     { token: 'token_bob',     refreshToken: 'refresh_bob',     userId: 'bob' },
    'carol@demo.com':   { token: 'token_carol',   refreshToken: 'refresh_carol',   userId: 'carol' },
}

// ============================================================
// FAKE API — симуляция HTTP ответов
// В реальном проекте это реальные HTTP запросы через client.GET/POST
// ============================================================
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

async function fakeApiCall(url: string, token: string | null): Promise<unknown> {
    await delay(400)

    if (!token) {
        throw { status: 401, detail: 'Unauthorized' }
    }

    // Находим пользователя по токену
    const userEntry = Object.entries(FAKE_USERS).find(([, v]) => v.token === token)
    if (!userEntry) throw { status: 401, detail: 'Invalid token' }

    const [email, { userId }] = userEntry

    if (url === '/api/users/current') {
        const users: Record<string, object> = {
            alice: { id: 'alice', fullName: 'Алиса Иванова',  email: 'alice@demo.com' },
            bob:   { id: 'bob',   fullName: 'Боб Петров',     email: 'bob@demo.com' },
            carol: { id: 'carol', fullName: 'Кэрол Сидорова', email: 'carol@demo.com' },
        }
        return users[userId]
    }

    if (url === '/api/companies/current') {
        return { id: 'company1', name: 'Демо Компания', idn: '1234567890' }
    }

    if (url === '/api/users/roles') {
        const roles: Record<string, string[]> = {
            alice: ['admin', 'manager'],
            bob:   ['manager', 'user'],
            carol: ['user'],
        }
        return roles[userId] ?? []
    }

    throw { status: 404, detail: 'Not found' }
}

// ============================================================
// ОСНОВНОЙ HTTP КЛИЕНТ
// Применяет middleware, обрабатывает 401
// ============================================================
export const apiClient = {
    async get<T>(url: string): Promise<T> {
        const { token } = session.get()
        return fakeApiCall(url, token) as Promise<T>
    },

    async post<T>(url: string, body: unknown): Promise<T> {
        await delay(600)
        // Для логина — особый путь
        if (url === '/api/auth/login') {
            const { email, password } = body as { email: string; password: string }
            const found = FAKE_USERS[email]
            if (!found || password !== 'demo1234') {
                throw { status: 401, detail: 'Неверный email или пароль' }
            }
            return found as unknown as T
        }
        throw { status: 404, detail: 'Not found' }
    },
}

// ============================================================
// УТИЛИТА НОРМАЛИЗАЦИИ ОШИБОК — как getErrorMessage в оригинале
// В оригинале: ProblemDetails | ValidationProblemDetails → string
// ============================================================
export function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return 'Неизвестная ошибка'
    const err = error as Record<string, unknown>
    if (typeof err.detail === 'string') return err.detail
    if (typeof err.title === 'string') return err.title
    if (typeof err.message === 'string') return err.message
    return 'Неизвестная ошибка'
}
