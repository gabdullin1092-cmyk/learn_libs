import { Stack, HStack, Text } from '@chakra-ui/react'
import { useStore } from '@tanstack/react-form'
import { withForm, bankFormOptions, getFieldError } from './form-context'

const CURRENCIES = [
    { value: 'USD', label: 'USD — Доллар США' },
    { value: 'EUR', label: 'EUR — Евро' },
    { value: 'UZS', label: 'UZS — Узбекский сум' },
    { value: 'KZT', label: 'KZT — Казахстанский тенге' },
]

const ACCOUNT_TYPES = [
    { value: 'resident', label: 'Резидент (РФ, 20 цифр)' },
    { value: 'non-resident', label: 'Нерезидент (IBAN, до 34 симв.)' },
]

// ============================================================
// withForm — фабрика типизированного компонента
//
// Принимает:
//   ...bankFormOptions — defaultValues + validators (для TypeScript-инференса)
//   props: {} as <тип> — дополнительные пропсы от родителя (здесь нет)
//   render: ({ form }) => JSX — render-функция с доступом к form
//
// Возвращает: React-компонент который ПОЛУЧАЕТ form от родителя как пропс.
// Родитель создаёт form через useAppForm и передаёт: <BankFormFields form={form} />
//
// Зачем withForm а не просто function({ form })?
//   → TypeScript автоматически типизирует form из defaultValues + validators
//   → Нет нужды вручную писать тип AppFieldExtendedReactFormApi<BankFormValues, ...>
//   → form.AppField получает автодополнение по полям BankFormValues
// ============================================================
export const BankFormFields = withForm({
    ...bankFormOptions,
    props: {} as Record<string, never>,
    render: function Render({ form }) {
        // useStore — читаем extra.accountType реактивно.
        // Когда тип меняется: меняется label, placeholder и hint у номера счёта.
        // Компонент не перерендерится при изменении других полей (bank.currency и т.д.)
        const extra = useStore(form.store, (s) => s.values.extra)
        const accountType = extra.accountType

        const accountNumberLabel =
            accountType === 'resident'
                ? 'Номер счёта (20 цифр)'
                : accountType === 'non-resident'
                  ? 'IBAN (до 34 символов)'
                  : 'Номер счёта / IBAN'

        const accountNumberPlaceholder =
            accountType === 'resident'
                ? '40702810000000001234'
                : 'DE89370400440532013000'

        return (
            <Stack gap="4">
                {/* Тип счёта — поле из extra (UI-состояние, не данные банка).
                    name="extra.accountType" — dot-notation в defaultValues */}
                <form.AppField name="extra.accountType">
                    {(field) => (
                        // field.SelectFormField — кастомный компонент из fieldComponents.
                        // field внутри SelectFormField читается через useFieldContext().
                        // Здесь мы передаём только UI-пропсы: label, options, error.
                        <field.SelectFormField
                            label="Тип счёта"
                            options={ACCOUNT_TYPES}
                            invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                            error={getFieldError(field.state.meta.errors[0])}
                            required
                        />
                    )}
                </form.AppField>

                <HStack gap="4" align="flex-start">
                    {/* Номер счёта — label и placeholder зависят от accountType.
                        key= заставляет React пересоздать Input при смене типа,
                        что сбрасывает внутреннее состояние (как в оригинале CreateForm) */}
                    <form.AppField
                        name="bank.accountNumber"
                        key={accountType || 'empty'}
                    >
                        {(field) => (
                            <field.TextFormField
                                label={accountNumberLabel}
                                placeholder={accountNumberPlaceholder}
                                invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                                error={getFieldError(field.state.meta.errors[0])}
                                maxLength={accountType === 'non-resident' ? 34 : undefined}
                                required
                            />
                        )}
                    </form.AppField>

                    <form.AppField name="bank.currency">
                        {(field) => (
                            <field.SelectFormField
                                label="Валюта"
                                options={CURRENCIES}
                                invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                                error={getFieldError(field.state.meta.errors[0])}
                                required
                            />
                        )}
                    </form.AppField>
                </HStack>

                {/* Правила валидации — подсказка пользователю */}
                {accountType && (
                    <Text fontSize="xs" color="gray.500" px="1">
                        {accountType === 'resident'
                            ? '💡 Резидент: номер счёта РФ содержит ровно 20 цифр'
                            : '💡 Нерезидент: IBAN до 34 символов (буквы и цифры)'}
                    </Text>
                )}

                <form.AppField name="bank.isMain">
                    {(field) => (
                        <field.CheckboxFormField
                            label="Основной счёт"
                            hint="Первый добавленный счёт автоматически становится основным"
                        />
                    )}
                </form.AppField>
            </Stack>
        )
    },
})
