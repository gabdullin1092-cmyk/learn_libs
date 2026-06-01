import { createServerFn } from "@tanstack/react-start"
import { client, getErrorMessage } from "@api/index"
import { useAppSession } from "@features/common/useAppSession.ts"
import { components } from "@api/schema.ts"
import {defaultRouterContext, RouterContext} from "../../router.tsx";
import {redirect} from "@tanstack/react-router";

type LoginCommand = components["schemas"]["LoginCommand"]
type AvailableRoles = components["schemas"]["AvailableRoles"]

export const getRouterContextFn = createServerFn({ method: 'GET' })
    .handler(async (): Promise<Omit<RouterContext, 'queryClient'>> => {
        const session = await useAppSession()

        if (!session.data.token) {
            return defaultRouterContext
        }

        const [
            { data: user  },
            { data: roles },
            { data: company },
            { data: currentUserCompanyRoles },
            { data: bankAccounts },
            { data: activityAreas }
        ] = await Promise.all([
            client.GET('/api/users/current'),
            client.GET('/api/users/role/list'),
            session.data.companyId
                ? client.GET('/api/companies/{id}', { params: { path: { id: session.data.companyId } } })
                : Promise.resolve({ data: null, error: null }),
            session.data.companyId
                ? client.GET('/api/users/company/{id}/accesstype/list', { params: { path: { id: session.data.companyId } } })
                : Promise.resolve({ data: null, error: null }),
            session.data.companyId
                ? client.GET('/api/companies/{id}/bankaccount/list', { params: { path: { id: session.data.companyId } } })
                : Promise.resolve({ data: null, error: null }),
            session.data.companyId
                ? client.GET('/api/companies/{id}/activityarea/list', { params: { path: { id: session.data.companyId } } })
                : Promise.resolve({ data: null, error: null }),
        ])

        return {
            user: user ?? null,
            roles: (roles as unknown as AvailableRoles) ?? [],
            company: company ?? null,
            currentUserCompanyRoles: currentUserCompanyRoles ?? [],
            bankAccounts: bankAccounts?.items ?? [],
            activityAreas: activityAreas?.items ?? []
        }
    })

export const loginFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { body: LoginCommand }) => data)
    .handler(async (ctx) => {
        const { data, error } = await client.POST('/api/auth', {
            body: ctx.data.body,
        })
        if (error) {
            throw new Error(getErrorMessage(error))
        }
        if (data) {
            const { token, refreshToken } = data
            const session = await useAppSession()
            await session.update((state) => ({ ...state, token, refreshToken }))
        }
    })

export const logoutFn = createServerFn({ method: 'POST' })
    .handler(async () => {
        const session = await useAppSession()
        await session.clear()
        throw redirect({ to: '/' })
    })
