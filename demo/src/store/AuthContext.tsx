import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppContext, AppUser, AppCompany, AppRole } from './types'
import { defaultAppContext } from './types'
import { session } from './session'
import { apiClient, getErrorMessage } from './apiClient'

// ============================================================
// AuthContext — аналог RouterContext + beforeLoad из оригинала
//
// В TanStack Router:
//   beforeLoad → вызывается перед каждым роутом
//   useRouteContext() → читает контекст в любом компоненте
//
// Здесь:
//   AuthProvider → монтируется один раз, загружает контекст
//   useAuth()    → читает контекст в любом компоненте
//
// Принцип одинаковый:
//   1. Проверяем есть ли токен в сессии
//   2. Если есть — параллельно грузим user + company + roles
//   3. Сохраняем в контекст
//   4. Все компоненты-потомки имеют доступ
// ============================================================

// Расширяем контекст методами для логина/логаута
type AuthContextValue = AppContext & {
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    isLoading: boolean
    error: string | null
}

const AuthContext = createContext<AuthContextValue>({
    ...defaultAppContext,
    login: async () => {},
    logout: () => {},
    isLoading: false,
    error: null,
})

// ============================================================
// getAppContext — аналог getRouterContextFn из authFunctions.ts
//
// В оригинале: createServerFn → параллельно загружает
//   user, roles, company, bankAccounts, activityAreas
//
// Здесь то же самое но на клиенте:
//   Promise.all → параллельно загружаем user + company + roles
// ============================================================
async function getAppContext(): Promise<AppContext> {
    const { token } = session.get()

    if (!token) {
        return defaultAppContext
    }

    try {
        // Promise.all — все запросы параллельно, как в getRouterContextFn
        const [user, company, roles] = await Promise.all([
            apiClient.get<AppUser>('/api/users/current'),
            apiClient.get<AppCompany>('/api/companies/current'),
            apiClient.get<AppRole[]>('/api/users/roles'),
        ])

        return {
            user,
            company,
            roles,
            isAuthenticated: true,
        }
    } catch {
        // Токен невалиден — очищаем сессию
        // В оригинале: session.clear() + redirect('/')
        session.clear()
        return defaultAppContext
    }
}

// ============================================================
// AuthProvider — оборачивает всё приложение
// Аналог Wrap в createRouter + beforeLoad в Route
// ============================================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [ctx, setCtx] = useState<AppContext>(defaultAppContext)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Загружаем контекст при монтировании — аналог beforeLoad
    useEffect(() => {
        getAppContext()
            .then(setCtx)
            .finally(() => setIsLoading(false))
    }, [])

    // login — аналог loginFn из authFunctions.ts
    // loginFn: POST /api/auth → сохраняет token в session cookie
    const login = useCallback(async (email: string, password: string) => {
        setError(null)
        try {
            const data = await apiClient.post<{
                token: string
                refreshToken: string
                userId: string
            }>('/api/auth/login', { email, password })

            // Сохраняем токен в сессию (в оригинале: session.update({ token, refreshToken }))
            session.update({ token: data.token, refreshToken: data.refreshToken, userId: data.userId })

            // Перезагружаем контекст (в оригинале: router.invalidate())
            const newCtx = await getAppContext()
            setCtx(newCtx)
        } catch (err) {
            setError(getErrorMessage(err))
        }
    }, [])

    // logout — аналог logoutFn из authFunctions.ts
    // logoutFn: session.clear() → redirect('/')
    const logout = useCallback(() => {
        session.clear()
        setCtx(defaultAppContext)
    }, [])

    return (
        <AuthContext.Provider value={{ ...ctx, login, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    )
}

// ============================================================
// useAuth — аналог Route.useRouteContext() из оригинала
//
// В оригинале: const context = Route.useRouteContext()
// Здесь:       const { user, company, roles } = useAuth()
//
// Результат одинаковый: читаем глобальный контекст приложения
// ============================================================
export const useAuth = () => useContext(AuthContext)
