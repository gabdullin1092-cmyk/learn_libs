// ============================================================
// AppContext — аналог RouterContext из router.tsx оригинала
//
// В оригинале это тип контекста TanStack Router:
//   export type RouterContext = {
//     queryClient: QueryClient
//     user: User | null
//     roles: Roles
//     company: Company | null
//     ...
//   }
//
// Здесь то же самое но как React Context.
// В обоих случаях — единое место хранения глобального состояния приложения.
// ============================================================

export type AppUser = {
    id: string
    fullName: string
    email: string
}

export type AppCompany = {
    id: string
    name: string
    idn: string
}

// Роли — в оригинале это enum с сервера
export type AppRole = 'admin' | 'manager' | 'user'

export type AppContext = {
    user: AppUser | null
    company: AppCompany | null
    roles: AppRole[]
    isAuthenticated: boolean
}

export const defaultAppContext: AppContext = {
    user: null,
    company: null,
    roles: [],
    isAuthenticated: false,
}
