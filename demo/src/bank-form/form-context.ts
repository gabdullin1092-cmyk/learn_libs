import { createFormHook, createFormHookContexts, formOptions } from '@tanstack/react-form'
import { TextFormField } from './fields/TextFormField'
import { SelectFormField } from './fields/SelectFormField'
import { CheckboxFormField } from './fields/CheckboxFormField'
import * as v from 'valibot'

// ============================================================
// 1. КОНТЕКСТЫ ФОРМЫ
//
// createFormHookContexts() создаёт два React.Context:
//   fieldContext  — несёт field API внутрь кастомных field-компонентов
//   formContext   — несёт form API (используется в formComponents)
//   useFieldContext — хук для чтения field из контекста
//
// Почему контексты а не props?
//   → Кастомные компоненты (TextFormField и т.д.) не принимают field
//     как пропс. Они читают его из контекста через useFieldContext().
//     Это разделяет "логику поля" (form.AppField) и "UI поля" (TextFormField).
// ============================================================
export const { fieldContext, formContext, useFieldContext } =
    createFormHookContexts()

// ============================================================
// 2. КАСТОМНЫЙ ХУК ФОРМЫ
//
// createFormHook регистрирует fieldComponents и возвращает:
//   useAppForm — как useForm, но form.AppField знает о зарегистрированных компонентах
//   withForm   — HOC для создания типизированных форм-компонентов
//
// После регистрации внутри form.AppField рендер-prop доступны:
//   field.TextFormField    → вместо <Input ... />
//   field.SelectFormField  → вместо <Select ... />
//   field.CheckboxFormField → вместо <Checkbox ... />
// ============================================================
export const { useAppForm, withForm } = createFormHook({
    fieldComponents: {
        TextFormField,
        SelectFormField,
        CheckboxFormField,
    },
    fieldContext,
    formContext,
    formComponents: {},
})

// ============================================================
// 3. СТРУКТУРА ДАННЫХ
//
// Два раздела, как в оригинале:
//   bank   — данные которые уйдут на сервер
//   extra  — вспомогательные UI-данные (хранят состояние без отправки)
//
// Пример extra из оригинала: bankNameInput, bankCodeInput, bankIsResident.
// Здесь: accountType (влияет на валидацию номера, но не является полем банка)
// ============================================================
const defaultBankValues = {
    bank: {
        accountNumber: '',
        currency: '',
        isMain: false,
    },
    extra: {
        // Тип счёта — влияет на правило валидации номера (резидент/нерезидент)
        // Хранится в extra потому что это UI-выбор, а не поле данных банка
        accountType: '' as '' | 'resident' | 'non-resident',
    },
}

export type BankFormValues = typeof defaultBankValues

// ============================================================
// 4. УТИЛИТА НОРМАЛИЗАЦИИ ОШИБОК
//
// errors[0] может быть:
//   - string (от field-level validators функции)
//   - { message: string } (от Standard Schema / valibot)
//   - undefined
//
// Эта утилита унифицирует оба варианта в string | undefined.
// ============================================================
export const getFieldError = (
    error: string | { message: string } | undefined
): string | undefined => {
    if (!error) return undefined
    return typeof error === 'string' ? error : error.message
}

// ============================================================
// 5. СХЕМА ВАЛИДАЦИИ С ДВОЙНЫМ v.forward
//
// v.pipe(object, v.forward(...), v.forward(...)) — цепочка:
//   сначала валидирует структуру объекта,
//   затем применяет кросс-field правила последовательно.
//
// v.forward(v.check(fn, msg), ['path', 'to', 'field']):
//   - fn — предикат над всем объектом
//   - если false — ошибка msg "перебрасывается" на указанное поле
//   - оба v.forward могут добавить ошибку к bank.accountNumber независимо
//
// Логика:
//   Резидент РФ  → счёт = ровно 20 цифр
//   Нерезидент   → IBAN = не более 34 символов
//   Пустое поле  → первое условие !val пропускает проверку (required отдельно)
// ============================================================
const bankSchema = v.pipe(
    v.object({
        bank: v.object({
            accountNumber: v.pipe(v.string(), v.minLength(1, 'Введите номер счёта')),
            currency: v.pipe(v.string(), v.minLength(1, 'Выберите валюту')),
            isMain: v.boolean(),
        }),
        extra: v.object({
            accountType: v.pipe(v.string(), v.minLength(1, 'Выберите тип счёта')),
        }),
    }),

    // Правило 1: резидент → ровно 20 цифр
    v.forward(
        v.check(
            (data) => {
                const num = data.bank.accountNumber.replace(/\D/g, '')
                // Пустое поле пропускаем (required выше уже поймает)
                return (
                    !data.bank.accountNumber ||
                    data.extra.accountType !== 'resident' ||
                    /^\d{20}$/.test(num)
                )
            },
            'Для резидента номер счёта должен содержать 20 цифр'
        ),
        ['bank', 'accountNumber']
    ),

    // Правило 2: нерезидент → IBAN ≤ 34 символа
    v.forward(
        v.check(
            (data) =>
                !data.bank.accountNumber ||
                data.extra.accountType !== 'non-resident' ||
                data.bank.accountNumber.length <= 34,
            'IBAN не должен превышать 34 символа'
        ),
        ['bank', 'accountNumber']
    ),
)

// ============================================================
// 6. ОПЦИИ ФОРМЫ
//
// formOptions() — выносит defaultValues + validators в объект,
// который можно spread'ить в:
//   useAppForm({ ...bankFormOptions, onSubmit: ... })
//   withForm({ ...bankFormOptions, render: ... })
//
// Зачем? Одно место для defaultValues и validators.
// withForm использует их для TypeScript-инференса типа form.
// ============================================================
export const bankFormOptions = formOptions({
    defaultValues: defaultBankValues,
    validators: {
        // onChange — валидируем при каждом изменении (не только при blur)
        // Пользователь видит ошибку сразу как только делает поле невалидным
        onChange: bankSchema,
        onSubmit: bankSchema,
    },
})
