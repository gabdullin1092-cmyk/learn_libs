import { Field, Input } from '@chakra-ui/react'
import { useFieldContext } from '../form-context'

type Props = {
    label: string
    error?: string
    invalid?: boolean
    placeholder?: string
    required?: boolean
    maxLength?: number
}

// ============================================================
// КАСТОМНЫЙ FIELD-КОМПОНЕНТ
//
// Этот компонент НЕ принимает field как пропс.
// Вместо этого он вызывает useFieldContext<string>() и читает
// field из контекста, который выставляет form.AppField.
//
// Цепочка передачи:
//   form.AppField name="bank.accountNumber"  ← выставляет field в контекст
//     {(field) => <field.TextFormField ... />}
//                          ↑
//                 здесь field — это fieldContext.Provider value
//                 useFieldContext() внутри компонента его читает
//
// Зачем это нужно?
//   → Отделяет "какое поле формы" (name в AppField) от "как оно выглядит" (TextFormField)
//   → TextFormField можно использовать для любого string-поля формы
//   → Нет prop-drilling — field не прокидывается через промежуточные компоненты
// ============================================================
export const TextFormField = ({
    label,
    error,
    invalid,
    placeholder,
    required,
    maxLength,
}: Props) => {
    // useFieldContext<string>() — читает field из fieldContext.
    // Тип-параметр <string> — тип значения поля.
    // В compile-time это любой FieldApi, в runtime — конкретное поле по name.
    const field = useFieldContext<string>()

    return (
        <Field.Root invalid={invalid} required={required} flex="1">
            <Field.Label>
                {label}
                {required && <Field.RequiredIndicator />}
            </Field.Label>
            <Input
                placeholder={placeholder}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                maxLength={maxLength}
            />
            {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
    )
}
