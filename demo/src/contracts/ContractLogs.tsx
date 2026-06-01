import { Box, Circle, For, HStack, Icon, Show, Text, VStack } from '@chakra-ui/react'
import { Check } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { ContractLog } from './types'

// ============================================================
// Временная шкала событий договора
// Каждый log = один шаг жизненного цикла:
//   - смена статуса (statusDisplayName)
//   - автор (fullName)
//   - дата (created)
//   - комментарий при отклонении (comment)
// ============================================================

const formatDate = (value: string) => {
    const date = parseISO(value)
    return isValid(date) ? format(date, 'dd.MM.yyyy, HH:mm') : value
}

type Props = { logs?: ContractLog[] }

export const ContractLogs = ({ logs }: Props) => {
    if (!logs?.length) return null

    return (
        <Box bg="white" borderRadius="16px" p="24px">
            <Text fontSize="18px" fontWeight="700" mb="4">История</Text>

            <VStack align="flex-start" gap="12px">
                <For each={logs}>
                    {(log) => (
                        <HStack key={log.id} alignItems="flex-start" gap="12px" w="full">
                            {/* Иконка-круг — маркер временной шкалы */}
                            <Circle size="20px" bg="blue.100" mt="2px" flexShrink={0}>
                                <Icon color="blue.600" boxSize="10px"><Check /></Icon>
                            </Circle>

                            <VStack align="flex-start" gap="2px">
                                {/* Название статуса или произвольный текст */}
                                <Text fontSize="14px" fontWeight="600">
                                    {log.statusDisplayName ?? log.text}
                                </Text>

                                <Show when={!!log.fullName}>
                                    <Text fontSize="13px" color="gray.500">{log.fullName}</Text>
                                </Show>

                                <Text fontSize="12px" color="gray.400">
                                    {formatDate(log.created)}
                                </Text>

                                {/* Комментарий — появляется при отклонении */}
                                <Show when={!!log.comment}>
                                    <Text fontSize="13px" color="red.500" fontWeight="500">
                                        Причина: {log.comment}
                                    </Text>
                                </Show>
                            </VStack>
                        </HStack>
                    )}
                </For>
            </VStack>
        </Box>
    )
}
