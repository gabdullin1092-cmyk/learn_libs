import { Box, HStack, Show, Text, VStack } from "@chakra-ui/react"
import { Trans } from "@lingui/react/macro"
import { Phone, Send } from "lucide-react"
import { components } from "@api/schema"
import { formatPhoneNumber } from "@common/phoneUtils"

type Contract = components["schemas"]["ContractResponse"]

type ContractInitiatorProps = {
    contract?: Contract
}

export const ContractInitiator = ({ contract }: ContractInitiatorProps) => (
    <VStack
        maxW={{ base: "full", xl: "360px" }}
        w="100%"
        borderRadius={{ base: "16px", md: "24px" }}
        bg="white"
        p={{ base: "16px", md: "24px" }}
        gap="3"
    >
        <Box w="full" borderRadius={{ base: "12px", md: "16px" }} bg="bg.lightGray" p={{ base: "12px", md: "16px" }}>
            <Text fontSize="14px" fontWeight="600" color="text.secondary" mb="10px">
                <Trans>Инициатор</Trans>
            </Text>
            <Show
                when={!!contract?.initiator}
                fallback={
                    <VStack align="flex-start" gap="2">
                        <Text fontSize="14px" fontWeight="600">
                            {contract?.user?.fullName}
                        </Text>
                        <Show when={contract?.user?.email}>
                            <HStack alignItems="center" fontSize="14px" fontWeight="400" gap="2">
                                <Send color="#3474F6" size={15} />
                                <Text>{contract?.user?.email}</Text>
                            </HStack>
                        </Show>
                    </VStack>
                }
            >
                <VStack align="flex-start" gap="2">
                    <Text fontSize="14px" fontWeight="600">
                        {contract?.initiator}
                    </Text>
                    <Show when={contract?.initiatorPhoneNumber}>
                        <HStack alignItems="center" fontSize="14px" fontWeight="400" gap="2">
                            <Phone color="#3474F6" size={15} />
                            <Text>{formatPhoneNumber(contract?.initiatorPhoneNumber)}</Text>
                        </HStack>
                    </Show>
                    <Show when={contract?.initiatorEmail}>
                        <HStack alignItems="center" fontSize="14px" fontWeight="400" gap="2">
                            <Send color="#3474F6" size={15} />
                            <Text>{contract?.initiatorEmail}</Text>
                        </HStack>
                    </Show>
                </VStack>
            </Show>
        </Box>
        <Show when={!!contract?.author}>
            <Box w="full" borderRadius={{ base: "12px", md: "16px" }} bg="bg.lightGray" p={{ base: "12px", md: "16px" }}>
                <Text fontSize="14px" fontWeight="600" color="text.secondary" mb="10px">
                    <Trans>Юрист</Trans>
                </Text>
                <VStack align="flex-start" gap="2">
                    <Text fontSize="14px" fontWeight="600">
                        {contract?.author}
                    </Text>
                    <Show when={contract?.authorPhoneNumber}>
                        <HStack alignItems="center" fontSize="14px" fontWeight="400" gap="2">
                            <Phone color="#3474F6" size={15} />
                            <Text>{formatPhoneNumber(contract?.authorPhoneNumber)}</Text>
                        </HStack>
                    </Show>
                    <Show when={contract?.authorEmail}>
                        <HStack alignItems="center" fontSize="14px" fontWeight="400" gap="2">
                            <Send color="#3474F6" size={15} />
                            <Text>{contract?.authorEmail}</Text>
                        </HStack>
                    </Show>
                </VStack>
            </Box>
        </Show>
    </VStack>
)
