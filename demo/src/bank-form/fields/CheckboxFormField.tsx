import { Checkbox, Text } from '@chakra-ui/react'
import { useFieldContext } from '../form-context'

type Props = {
    label: string
    hint?: string
}

// CheckboxFormField — useFieldContext<boolean> для boolean-полей.
// handleBlur вызывается сразу при смене чекбокса (нет отдельного blur-события).
export const CheckboxFormField = ({ label, hint }: Props) => {
    const field = useFieldContext<boolean>()

    return (
        <Checkbox.Root
            checked={field.state.value}
            onCheckedChange={(details) => {
                field.handleChange(!!details.checked)
                field.handleBlur()
            }}
        >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>
                {label}
                {hint && (
                    <Text as="span" fontSize="xs" color="gray.500" ml="1">
                        {hint}
                    </Text>
                )}
            </Checkbox.Label>
        </Checkbox.Root>
    )
}
