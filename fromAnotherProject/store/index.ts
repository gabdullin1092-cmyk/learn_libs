import createFetchClient, {type Middleware} from "openapi-fetch"
import {type components, type paths} from "./schema"
import {useAppSession} from "@features/common/useAppSession.ts"
import * as Sentry from "@sentry/tanstackstart-react"
import { i18n } from "@lingui/core"

type LoginResponse = components['schemas']['LoginResponse']

export const auth: Middleware = {
    async onRequest({ request }) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const session = await useAppSession()
        if (session.data.token) {
            request.headers.set('Authorization', `Bearer ${session.data.token}`)
        }
        return request
    },
    async onResponse({ response }) {
        if (!response.ok && response.status === 401) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const session = await useAppSession()
            await session.clear()
        }
        return response
    }
}

export const locale: Middleware = {
    async onRequest({ request }) {
        request.headers.set('Accept-Language', i18n.locale)
        return request
    },
}

// Error logging middleware
export const errorLogger: Middleware = {
    async onResponse({ request, response }) {
        if (!response.ok) {
            const url = new URL(request.url)
            let responseBody: unknown = null
            let requestBody: unknown = null

            try {
                const clonedResponse = response.clone()
                responseBody = await clonedResponse.json()
            } catch {
                // Response body is not JSON
            }

            try {
                const clonedRequest = request.clone()
                requestBody = await clonedRequest.json()
            } catch {
                // Request body is not JSON or empty
            }

            Sentry.logger.error(Sentry.logger.fmt`API Error: ${request.method} ${url.pathname}`, {
                status: response.status,
                statusText: response.statusText,
                endpoint: url.pathname,
                method: request.method,
                requestBody,
                responseBody,
            })
        }
        return response
    }
}

// Token refresh function
export async function refreshToken(token?: string | null): Promise<LoginResponse | null | undefined> {
    if (!token) return null
    const response = await fetch(`${process.env.API_URL}/api/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
    })
    if (!response.ok) return null
    return await response.json() as Promise<LoginResponse>
}

// Custom fetch with token refresh
async function fetchWithRefresh(input: Request): Promise<Response> {
    let response = await fetch(input)

    if (response.status === 401) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const session = await useAppSession()
        const data = await refreshToken(session.data.refreshToken)
        if (data) {
            await session.update({
                token: data.token,
                refreshToken: data.refreshToken,
                companyId: session.data.companyId
            })
            response = await fetch(input, {
                headers: {
                    Authorization: `Bearer ${data.token}`
                }
            })
        }
    }
    return response
}

export const client = createFetchClient<paths>({
    baseUrl: process.env.API_URL,
    fetch: fetchWithRefresh,
})

client.use(auth)
client.use(locale)
client.use(errorLogger)

type ProblemDetails = components['schemas']['ProblemDetails']
type ValidationProblemDetails = components['schemas']['ValidationProblemDetails']
type ApiError = ProblemDetails | ValidationProblemDetails

export function getErrorMessage(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') return undefined

    const err = error as ApiError & { message?: string }

    // ValidationProblemDetails - has errors object with field-specific messages
    if ('errors' in err && err.errors) {
        const messages = Object.values(err.errors).flat().filter(Boolean)
        if (messages.length > 0) return messages.join('. ')
    }

    // ProblemDetails - detail is the main error message
    if (err.detail) return err.detail

    // ProblemDetails - title as fallback
    if (err.title) return err.title

    // Some endpoints return { message: "..." } directly (e.g. Humora 404)
    if (err.message) return err.message

    return undefined
}
