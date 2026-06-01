import { FC } from "react"
import {Box, Circle, For, HStack, Show, Text, VStack} from "@chakra-ui/react"
import { Check } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { components } from "@api/schema"

type ContractLog = components["schemas"]["ContractLogResponse"]

interface LogsProps {
    logs?: ContractLog[]
}

const formatCreatedDate = (value: string) => {
    const date = parseISO(value)
    return isValid(date) ? format(date, 'dd.MM.yyyy, HH:mm') : value
}

const resolveAuthorName = (log: ContractLog) => log.fullName ?? log.user?.fullName

const ContractLogs: FC<LogsProps> = ({ logs }) => {
    if (!logs?.length) return null

    return (
        <Box
            w="full"
            bg="bg.card"
            borderRadius={{ base: "16px", md: "24px" }}
            px={{ base: "16px", md: "24px" }}
            py={{ base: "20px", md: "32px" }}
        >
            <VStack w="full" align="flex-start" gap={{ base: "12px", md: "16px" }}>
                <Text fontSize={{ base: "16px", md: "18px" }} fontWeight="700" color="text.primary">
                    История
                </Text>

                <VStack w="full" align="flex-start" gap="12px">
                    <For each={logs}>
                        {(log) => (
                            <HStack key={log.id} alignItems="flex-start" gap="12px" w="full">
                                <Circle size="16px" bg="bg.info" color="text.accent" mt="2px">
                                    <Check size={10} />
                                </Circle>

                                <VStack align="flex-start" gap="6px" w="full">
                                    <Text fontSize="14px" fontWeight="600" lineHeight="18px" color="text.primary">
                                        {log.statusDisplayName ?? log.text}
                                    </Text>

                                    <Show when={!!resolveAuthorName(log)}>
                                        <Text fontSize="14px" fontWeight="400" lineHeight="18px" color="text.secondary">
                                            {resolveAuthorName(log)}
                                        </Text>
                                    </Show>

                                    <Text fontSize="14px" fontWeight="400" lineHeight="18px" color="text.secondary">
                                        {formatCreatedDate(log.created)}
                                    </Text>

                                    <Show when={!!log.comment}>
                                        <Text fontSize="14px" fontWeight="600" lineHeight="18px" color="text.negative">
                                            Комментарий: {log.comment}
                                        </Text>
                                    </Show>
                                </VStack>
                            </HStack>
                        )}
                    </For>
                </VStack>
            </VStack>
        </Box>
    )
}

export default ContractLogs
