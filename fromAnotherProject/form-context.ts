import { createFormHook, createFormHookContexts, formOptions } from '@tanstack/react-form'
import * as v from 'valibot'
import { components } from '@api/schema.ts'

type EVatType = components['schemas']['EVatType']

export const { fieldContext, formContext, useFieldContext } =
    createFormHookContexts()

export const { useAppForm, withForm } = createFormHook({
    fieldContext,
    formContext,
    fieldComponents: {},
    formComponents: {},
})

// Shared schemas
const documentFileInputSchema = v.object({
    fileId: v.string(),
    isVisible: v.boolean(),
    forSign: v.boolean(),
})

const documentSignerInputSchema = v.object({
    companyId: v.nullable(v.string()),
    userId: v.nullable(v.string()),
    idn: v.nullable(v.string()),
    companyName: v.nullable(v.string()),
    email: v.nullable(v.string()),
    userName: v.nullable(v.string()),
})

const documentApproverInputSchema = v.object({
    userId: v.string(),
})

const documentObserverInputSchema = v.object({
    userId: v.string(),
})

export const initialSignerValues = {
    companyId: null,
    userId: null,
    idn: null,
    companyName: null,
    email: null,
    userName: null,
}

// Create Schema
const createContractSchema = v.object({
    companyId: v.string(),
    name: v.string(),
    description: v.string(),
    registrationNumber: v.string(),
    currencyId: v.nullable(v.string()),
    startDate: v.nullable(v.string()),
    endDate: v.nullable(v.string()),
    amount: v.nullable(v.number()),
    vatTypeId: v.nullable(v.custom<components['schemas']['EVatType']>(() => true)),
    sourceId: v.nullable(v.string()),
    additionalData: v.nullable(v.string()),
    files: v.array(documentFileInputSchema),
    signers: v.array(documentSignerInputSchema),
    approvers: v.nullable(v.array(documentApproverInputSchema)),
    observers: v.nullable(v.array(documentObserverInputSchema)),
})

export const createFormSchema = v.object({
    contract: createContractSchema,
    files: v.array(v.any()),
})

export const defaultCreateValues = {
    contract: {
        companyId: "",
        name: "",
        description: "",
        registrationNumber: '',
        currencyId: null,
        startDate: null,
        endDate: null,
        amount: null,
        vatTypeId: null,
        sourceId: null,
        additionalData: null,
        files: [],
        signers: [],
        approvers: null,
        observers: null,
    },
    files: [],
}

export const createFormOptions = formOptions({
    defaultValues: defaultCreateValues as v.InferOutput<typeof createFormSchema>,
    validators: {
        onSubmit: createFormSchema
    }
})

// Update Schema
const updateContractSchema = v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    registrationNumber: v.string(),
    currencyId: v.nullable(v.string()),
    startDate: v.nullable(v.string()),
    endDate: v.nullable(v.string()),
    amount: v.nullable(v.number()),
    vatTypeId: v.nullable(v.custom<EVatType>(() => true)),
    sourceId: v.nullable(v.string()),
    additionalData: v.nullable(v.string()),
    files: v.array(documentFileInputSchema),
    signers: v.array(documentSignerInputSchema),
    approvers: v.nullable(v.array(documentApproverInputSchema)),
})

export const updateFormSchema = v.object({
    contract: updateContractSchema,
    files: v.array(v.any()),
})

export const defaultUpdateValues = {
    contract: {
        id: "",
        name: "",
        description: "",
        registrationNumber: '',
        currencyId: null,
        startDate: null,
        endDate: null,
        amount: null,
        vatTypeId: null,
        sourceId: null,
        additionalData: null,
        files: [],
        signers: [],
        approvers: null,
    },
    files: [],
}

export const updateFormOptions = formOptions({
    defaultValues: defaultUpdateValues as v.InferOutput<typeof updateFormSchema>,
    validators: {
        onSubmit: updateFormSchema
    }
})