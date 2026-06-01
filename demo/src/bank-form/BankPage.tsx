import { Card, Button, Text, VStack, HStack, Badge, Box, Separator } from '@chakra-ui/react'
import { useAppForm, bankFormOptions } from './form-context'
import { BankFormFields } from './BankFormFields'

// ============================================================
// BankPage — РОДИТЕЛЬ, который владеет формой
//
// Архитектура разделена на два уровня:
//
//   BankPage (родитель)
//     useAppForm({ ...bankFormOptions, onSubmit })  ← создаёт форму
//     <BankFormFields form={form} />                ← рендерит поля
//     form.Subscribe(...)                           ← кнопка submit
//
//   BankFormFields (withForm)
//     Получает form как пропс
//     form.AppField → field.TextFormField и т.д.
//     Знает о layout и связях между полями
//
// Зачем разделять?
//   → BankPage отвечает за бизнес-логику (onSubmit, navigating, toasts)
//   → BankFormFields отвечает только за UI полей
//   → BankFormFields можно переиспользовать в модалке и на странице
// ============================================================
export const BankPage = () => {
    // useAppForm — как useForm, но form.AppField знает о fieldComponents.
    // Передаём ...bankFormOptions (defaultValues + validators) и добавляем onSubmit.
    const form = useAppForm({
        ...bankFormOptions,
        onSubmit: async ({ value }) => {
            // В реальном проекте: await api.createBankAccount(value.bank)
            await new Promise((r) => setTimeout(r, 1000))
            console.log('[BankPage] Счёт добавлен:', value.bank)
            alert(`Счёт ${value.bank.accountNumber} (${value.bank.currency}) добавлен!`)
            form.reset()
        },
    })

    return (
        <Card.Root w={{ base: 'full', md: '600px' }} maxW="full" shadow="lg">
            <Card.Body p={{ base: '5', md: '8' }}>
                <VStack gap="6" align="stretch">
                    <Text fontSize="xl" fontWeight="bold">
                        Добавить банковский счёт
                    </Text>

                    {/* BankFormFields — получает form как пропс.
                        Внутри: form.AppField + field.TextFormField и т.д.
                        Родитель не знает о деталях layout-а полей. */}
                    <BankFormFields form={form} />

                    <Separator />

                    {/* form.Subscribe — кнопка живёт в родителе, не в BankFormFields.
                        Это позволяет менять текст кнопки / disabled-логику
                        не трогая BankFormFields. */}
                    <form.Subscribe selector={(s) => s.isSubmitting}>
                        {(isSubmitting) => (
                            <Button
                                width="full"
                                size="lg"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                onClick={() => void form.handleSubmit()}
                            >
                                Добавить счёт
                            </Button>
                        )}
                    </form.Subscribe>

                    {/* DEBUG-панель: состояние стора в реальном времени */}
                    <Separator />
                    <form.Subscribe selector={(s) => s}>
                        {(state) => (
                            <Box>
                                <Text fontSize="xs" fontWeight="bold" color="gray.500" mb="2">
                                    🔍 Состояние формы (debug):
                                </Text>
                                <HStack gap="2" wrap="wrap" mb="2">
                                    <Badge colorPalette={state.isValid ? 'green' : 'red'}>
                                        isValid: {String(state.isValid)}
                                    </Badge>
                                    <Badge colorPalette={state.isSubmitting ? 'orange' : 'gray'}>
                                        isSubmitting: {String(state.isSubmitting)}
                                    </Badge>
                                    <Badge colorPalette="blue">
                                        submitCount: {state.submissionAttempts}
                                    </Badge>
                                </HStack>
                                <Box
                                    as="pre"
                                    fontSize="10px"
                                    bg="gray.50"
                                    p="3"
                                    borderRadius="md"
                                    overflow="auto"
                                    maxH="180px"
                                    color="gray.700"
                                >
                                    {JSON.stringify(state.values, null, 2)}
                                </Box>
                            </Box>
                        )}
                    </form.Subscribe>
                </VStack>
            </Card.Body>
        </Card.Root>
    )
}
