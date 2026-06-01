import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient } from "@tanstack/react-query"
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { Provider } from "@components/ui/provider"
import { NotFoundComponent } from "@layout/NotFoundComponent"
import { ErrorComponent } from "@layout/ErrorComponent"
import { PendingComponent } from "@layout/PendingComponent.tsx"
import type { components } from "@api/schema"

type User = components["schemas"]["UserResponse"]
type Roles = components["schemas"]["AvailableRoles"]
type Company = components["schemas"]["CompanyResponse"]
type CompanyRole = components["schemas"]["EnumResponseOfEUserCompanyAccessType"]
type CompanyBankAccountResponse = components["schemas"]["CompanyBankAccountResponse"]
type CompanyActivityAreaResponse = components["schemas"]["CompanyActivityAreaResponse"]

export type RouterContext = {
    queryClient: QueryClient
    user: User | null
    roles: Roles
    company: Company | null
    currentUserCompanyRoles: CompanyRole[]
    bankAccounts: CompanyBankAccountResponse[]
    activityAreas: CompanyActivityAreaResponse[]
}

export const defaultRouterContext = {
    user: null,
    roles: [],
    company: null,
    currentUserCompanyRoles: [],
    bankAccounts: [],
    activityAreas: []
}

export async function getRouter() {
    const queryClient = new QueryClient()
    const router = createRouter({
        context: {
            ...defaultRouterContext,
            queryClient
        },
        routeTree,
        scrollRestoration: true,
        defaultStaleTime: 30_000,
        defaultNotFoundComponent: NotFoundComponent,
        defaultErrorComponent: ErrorComponent,
        defaultPendingComponent: PendingComponent,
        Wrap: ({ children }) => (
            <I18nProvider i18n={i18n}>
                <Provider>
                    {children}
                </Provider>
            </I18nProvider>
        )
    })
    setupRouterSsrQueryIntegration({
        router,
        queryClient,
    })
    return router
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof getRouter>
    }
}
