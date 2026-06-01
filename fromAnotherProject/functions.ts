import { createServerFn } from "@tanstack/react-start"
import { client, getErrorMessage } from "@api/index"
import {operations, components} from "@api/schema.ts"

type GetDocumentPath = operations["GetDocument"]['parameters']['path']
type GetDocumentQuery = operations["GetDocument"]['parameters']['query']

export const getDocumentFn = createServerFn({ method: 'GET' })
    .inputValidator((data: GetDocumentPath & GetDocumentQuery) => data)
    .handler(async (ctx) => {
        const { id, ...query } = ctx.data
        const { data, error, response } = await client.GET('/api/documents/{id}', {
            params: { path: { id }, query },
        })
        if (error) {
            if (response.status === 403) {
                const body = error as components["schemas"]["CompanyAccessProblemDetails"]
                if (Array.isArray(body.availableCompanies)) {
                    return { document: null, availableCompanies: body.availableCompanies }
                }
            }
            throw new Error(getErrorMessage(error))
        }
        return { document: data, availableCompanies: null }
    })

type GetDocumentsQuery = operations["GetDocuments"]['parameters']['query']

export const getDocumentsListFn = createServerFn({ method: 'GET' })
    .inputValidator((data: GetDocumentsQuery) => data)
    .handler(async (ctx) => {
        const { data, error } = await client.GET('/api/documents/list', {
            params: { query: ctx.data }
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type CreateDocumentCommand = components["schemas"]["CreateDocumentCommand"]

export const createDocumentFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { body: CreateDocumentCommand }) => data)
    .handler(async (ctx) => {
        const { data, error } = await client.POST('/api/documents', {
            body: ctx.data.body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type SignDocumentCommand = components["schemas"]["SignDocumentCommand"]

type SignDocumentData = {
    id: string,
    body: SignDocumentCommand
}

export const signDocumentFn = createServerFn({ method: 'POST' })
    .inputValidator((data: SignDocumentData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.POST('/api/documents/{id}/sign', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateDocumentStatusCommand = components["schemas"]["UpdateDocumentStatusCommand"]

type UpdateDocumentStatusData = {
    id: string,
    body: UpdateDocumentStatusCommand
}

export const updateDocumentStatusFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateDocumentStatusData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/documents/{id}/status', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateDocumentApproverCommand = components["schemas"]["UpdateDocumentApproverCommand"]

type UpdateDocumentApproverData = {
    id: string,
    body: UpdateDocumentApproverCommand
}

export const updateDocumentApproverFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateDocumentApproverData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/documents/{id}/approver', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateDocumentObserversCommand = components["schemas"]["UpdateDocumentObserversCommand"]

type UpdateDocumentObserversData = {
    id: string,
    body: UpdateDocumentObserversCommand
}

export const updateDocumentObserversFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateDocumentObserversData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/documents/{id}/observer/list', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateDocumentCommand = components["schemas"]["UpdateDocumentCommand"]

type UpdateDocumentData = {
    id: string,
    body: UpdateDocumentCommand
}

export const updateDocumentFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateDocumentData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/documents/{id}', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

// ==================== Contracts ====================

type GetContractPath = operations["GetContract"]['parameters']['path']
type GetContractQuery = operations["GetContract"]['parameters']['query']

export const getContractFn = createServerFn({ method: 'GET' })
    .inputValidator((data: GetContractPath & GetContractQuery) => data)
    .handler(async (ctx) => {
        const { id, ...query } = ctx.data
        const { data, error, response } = await client.GET('/api/contracts/{id}', {
            params: { path: { id }, query },
        })
        if (error) {
            if (response.status === 403) {
                const body = error as components["schemas"]["CompanyAccessProblemDetails"]
                if (Array.isArray(body.availableCompanies)) {
                    return { contract: null, availableCompanies: body.availableCompanies }
                }
            }
            throw new Error(getErrorMessage(error))
        }
        return { contract: data, availableCompanies: null }
    })

type GetContractsQuery = operations["GetContracts"]['parameters']['query']

export const getContractsListFn = createServerFn({ method: 'GET' })
    .inputValidator((data: GetContractsQuery) => data)
    .handler(async (ctx) => {
        const { data, error } = await client.GET('/api/contracts/list', {
            params: { query: ctx.data }
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type CreateContractCommand = components["schemas"]["CreateContractCommand"]

export const createContractFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { body: CreateContractCommand }) => data)
    .handler(async (ctx) => {
        const { data, error } = await client.POST('/api/contracts', {
            body: ctx.data.body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateContractCommand = components["schemas"]["UpdateContractCommand"]

type UpdateContractData = {
    id: string,
    body: UpdateContractCommand
}

export const updateContractFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateContractData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/contracts/{id}', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type SignContractCommand = components["schemas"]["SignContractCommand"]

type SignContractData = {
    id: string,
    body: SignContractCommand
}

export const signContractFn = createServerFn({ method: 'POST' })
    .inputValidator((data: SignContractData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.POST('/api/contracts/{id}/sign', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateContractStatusCommand = components["schemas"]["UpdateContractStatusCommand"]

type UpdateContractStatusData = {
    id: string,
    body: UpdateContractStatusCommand
}

export const updateContractStatusFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateContractStatusData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/contracts/{id}/status', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateContractApproverCommand = components["schemas"]["UpdateContractApproverCommand"]

type UpdateContractApproverData = {
    id: string,
    body: UpdateContractApproverCommand
}

export const updateContractApproverFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateContractApproverData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/contracts/{id}/approver', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })

type UpdateContractObserversCommand = components["schemas"]["UpdateContractObserversCommand"]

type UpdateContractObserversData = {
    id: string,
    body: UpdateContractObserversCommand
}

export const updateContractObserversFn = createServerFn({ method: 'POST' })
    .inputValidator((data: UpdateContractObserversData) => data)
    .handler(async (ctx) => {
        const { id, body } = ctx.data
        const { data, error } = await client.PUT('/api/contracts/{id}/observer/list', {
            params: { path: { id } },
            body
        })
        if (error) throw new Error(getErrorMessage(error))
        return data
    })