import { Heading, HStack, IconButton, Show, VStack } from "@chakra-ui/react"
import { Trans } from "@lingui/react/macro"
import { Link } from "@tanstack/react-router"
import LeftArrowIcon from "@assets/icons/left-arrow.svg?react"
import { Pen, Trash2 } from "lucide-react"
import { ContractStatusBadge } from "@features/document/contract/StatusBadge.tsx"
import { components } from "@api/schema.ts"

type Contract = components["schemas"]["ContractResponse"]

type ContractHeaderProps = {
    contract?: Contract
    isInitiator: boolean
}

export const ContractHeader = ({ contract, isInitiator }: ContractHeaderProps) => {
    const canEdit = isInitiator && contract?.statusId !== 40
    return (
        <>
            {/* Mobile Header */}
            <VStack w="full" gap="3" align="flex-start" display={{ base: "flex", md: "none" }}>
                <HStack w="full" justifyContent="space-between">
                    <HStack>
                        <Link to="/document" aria-label="Назад к документам">
                            <IconButton
                                size="sm"
                                color="text.accent"
                                variant="ghost"
                                css={{
                                    _icon: {
                                        width: "8",
                                        height: "6",
                                    },
                                }}
                            >
                                <LeftArrowIcon />
                            </IconButton>
                        </Link>
                        <Heading size="lg">
                            <Trans>Договор № {contract?.number}</Trans>
                        </Heading>
                    </HStack>
                    <Show when={canEdit}>
                        <HStack gap="2">
                            <IconButton size="sm" variant="ghost" aria-label="Delete">
                                <Trash2 size={20} />
                            </IconButton>
                            <Link to="/document/contract/$id/edit" params={{ id: contract?.id ?? '' }} aria-label="Редактировать договор">
                                <IconButton size="sm" variant="ghost" aria-label="Edit">
                                    <Pen size={20} />
                                </IconButton>
                            </Link>
                        </HStack>
                    </Show>
                </HStack>
                <ContractStatusBadge statusId={contract?.statusId} statusDisplayName={contract?.statusDisplayName} />
            </VStack>

            {/* Desktop Header */}
            <HStack w="full" display={{ base: "none", md: "flex" }} alignItems="center" gap="4">
                <Link to="/document" aria-label="Назад к документам">
                    <IconButton
                        size="sm"
                        color="text.accent"
                        variant="ghost"
                        css={{
                            _icon: {
                                width: "8",
                                height: "6",
                            },
                        }}
                    >
                        <LeftArrowIcon />
                    </IconButton>
                </Link>
                <HStack flex="1" justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" gap="15px">
                        <Heading size="2xl">
                            <Trans>Договор № {contract?.number}</Trans>
                        </Heading>
                        <ContractStatusBadge statusId={contract?.statusId} statusDisplayName={contract?.statusDisplayName} />
                    </HStack>
                </HStack>
            </HStack>
        </>
    )
}