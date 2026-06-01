import {createFormHook, createFormHookContexts, formOptions} from "@tanstack/react-form";
import {BankCodeField} from "@features/bank/fields/BankCodeField.tsx";
import {BankNameField} from "@features/bank/fields/BankNameField.tsx";
import {BankCurrencyField} from "@features/bank/fields/BankCurrencyField.tsx";
import {TextField} from "@features/bank/fields/TextField.tsx";
import {CheckboxField} from "@features/bank/fields/CheckboxField.tsx";
import * as v from 'valibot'
import { t } from '@lingui/core/macro'

export const { fieldContext, formContext, useFieldContext } =
    createFormHookContexts()

export const { useAppForm, withForm } = createFormHook({
    fieldComponents: {
        BankCodeField,
        BankNameField,
        BankCurrencyField,
        TextField,
        CheckboxField
    },
    fieldContext,
    formComponents: {},
    formContext
})

const defaultCreateValues = {
    bank: {
        bankId: '',
        currencyId: '',
        number: '',
        isMain: false
    },
    extra: {
        bankNameInput: '',
        bankCodeInput: '',
        bankIsResident: null as boolean | null
    }
}

export type CreateFormValues = typeof defaultCreateValues

export function getFieldError(error: string | { message: string } | undefined): string | undefined {
    if (!error) return undefined
    return typeof error === 'string' ? error : error.message
}

export const normalizeAccountNumber = (val: string) => val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

const bankSchema = v.pipe(
    v.object({
        bank: v.object({
            bankId: v.pipe(v.string(), v.minLength(1, () => t`Выберите банк`)),
            currencyId: v.pipe(v.string(), v.minLength(1, () => t`Выберите валюту`)),
            number: v.pipe(v.string(), v.minLength(1, () => t`Введите номер счёта`)),
            isMain: v.boolean()
        }),
        extra: v.object({
            bankNameInput: v.string(),
            bankCodeInput: v.string(),
            bankIsResident: v.nullable(v.boolean())
        })
    }),
    v.forward(
        v.check(
            (data) => {
                const val = (data.bank?.number ?? '').replace(/\s/g, '')
                return !val || data.extra?.bankIsResident !== true || /^\d{20}$/.test(val)
            },
            () => t`Номер счета должен содержать 20 цифр`
        ),
        ['bank', 'number']
    ),
    v.forward(
        v.check(
            (data) => {
                const val = (data.bank?.number ?? '').replace(/\s/g, '')
                return !val || data.extra?.bankIsResident === true || val.length <= 34
            },
            () => t`IBAN или номер счёта не должен превышать 34 символа`
        ),
        ['bank', 'number']
    )
)

export const createFormOptions = formOptions({
    defaultValues: defaultCreateValues as CreateFormValues,
    validators: {
        onSubmit: bankSchema,
        onChange: bankSchema,
    }
})