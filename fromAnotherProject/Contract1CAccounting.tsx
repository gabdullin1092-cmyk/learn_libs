import {Box, For, Text, VStack} from "@chakra-ui/react"
import { Trans } from "@lingui/react/macro"
import { format, parseISO } from "date-fns"
import { components } from "@api/schema"

type AccountingResponse = components["schemas"]["ContractAccountingResponse"]

type ContractAccountingProps = {
    responses?: AccountingResponse[] | null
}

export const Contract1CAccounting = ({ responses }: ContractAccountingProps) => {
    if (!responses || responses.length === 0) return null

    return (
        <Box
            w="full"
            bg="bg.card"
            borderRadius={{ base: "16px", md: "24px" }}
            p={{ base: "16px", md: "24px" }}
        >
            <VStack align="flex-start" w="full" gap="12px">
                <Text fontSize={{ base: "16px", md: "18px" }} fontWeight="700" color="text.primary">
                    <Trans>Отправлен в 1С</Trans>
                </Text>

                <VStack align="flex-start" w="full" gap="12px">
                    <For each={responses}>
                        {(item) => (
                            <Box key={item.id} w="full" bg="bg.lightGray" borderRadius="12px" p="12px">
                                <VStack align="flex-start" gap="6px">
                                    <Text fontSize="14px" fontWeight="600" color="text.primary">
                                        <Trans>Компания</Trans>: {item.companyIdn || "—"}
                                    </Text>
                                    <Text fontSize="14px" fontWeight="600" color="text.primary">
                                        <Trans>Получатель</Trans>: {item.recipientIdn || "-"}
                                    </Text>
                                    <Text fontSize="14px" fontWeight="400" color="text.secondary">
                                        <Trans>Код договора</Trans>: {item.sourceCode || "—"}
                                    </Text>
                                    <Text fontSize="14px" fontWeight="400" color="text.secondary">
                                        <Trans>Создано</Trans>: {item.created ? format(parseISO(item.created), 'dd.MM.yyyy, HH:mm') : ''}
                                    </Text>
                                </VStack>
                            </Box>
                        )}
                    </For>
                </VStack>
            </VStack>
        </Box>
    )
}
