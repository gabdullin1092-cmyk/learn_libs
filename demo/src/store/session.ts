// ============================================================
// session.ts — аналог useAppSession из оригинала
//
// В оригинале (SSR): useSession из @tanstack/react-start/server
//   — хранит токены в HTTP-only cookie (безопасно, не доступно JS)
//   — работает только на сервере (в server functions)
//
// В нашем demo (SPA): localStorage
//   — доступно клиентскому JS (менее безопасно, достаточно для обучения)
//   — работает в браузере
//
// Интерфейс одинаковый: get / set / clear
// ============================================================

const SESSION_KEY = 'demo_session'

type SessionData = {
    token: string | null
    refreshToken: string | null
    userId: string | null
}

const defaultSession: SessionData = {
    token: null,
    refreshToken: null,
    userId: null,
}

export const session = {
    // Читаем данные из localStorage
    get(): SessionData {
        try {
            const raw = localStorage.getItem(SESSION_KEY)
            return raw ? (JSON.parse(raw) as SessionData) : defaultSession
        } catch {
            return defaultSession
        }
    },

    // Обновляем данные (merge с текущими, как session.update в оригинале)
    update(data: Partial<SessionData>): void {
        const current = session.get()
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...data }))
    },

    // Удаляем сессию (как session.clear() в оригинале)
    clear(): void {
        localStorage.removeItem(SESSION_KEY)
    },
}
