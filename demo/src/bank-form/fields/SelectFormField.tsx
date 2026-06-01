import { Field, NativeSelect } from '@chakra-ui/react'
import { useFieldContext } from '../form-context'

type Option = { value: string; label: string }

type Props = {
    label: string
    options: Option[]
    error?: string
    invalid?: boolean
    required?: boolean
}

// SelectFormField — тот же паттерн useFieldContext, но для select.
// Получает значение и обработчики из контекста, опции — через props.
export const SelectFormField = ({ label, options, error, invalid, required }: Props) => {
    const field = useFieldContext<string>()

    return (
        <Field.Root invalid={invalid} required={required} flex="1">
            <Field.Label>
                {label}
                {required && <Field.RequiredIndicator />}
            </Field.Label>
            <NativeSelect.Root>
                <NativeSelect.Field
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                >
                    <option value="">Выберите...</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
            </NativeSelect.Root>
            {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
    )
}
