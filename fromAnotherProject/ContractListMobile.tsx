import { Box, Button, Card, EmptyState, For, FormatNumber, HStack, IconButton, Image, Pagination, Show, Text, VStack } from "@chakra-ui/react"
import { Trans } from "@lingui/react/macro"
import { format, parseISO } from "date-fns"
import { ContractStatusBadge } from "@features/document/contract/StatusBadge"
import { SignCircle } from "@features/document/SignCircle"
import empty from "@assets/icons/empty.svg"
import { components } from "@api/schema"

type Contract = components["schemas"]["ContractForListResponse"]

type ContractListMobileProps = {
    contracts?: Contract[]
    isError: boolean
    onRowClick: (id: string) => void
    page?: number
    pageSize?: number
    totalCount?: number
    onPageChange?: (page: number) => void
}

export const ContractListMobile = ({
    contracts,
    isError,
    onRowClick,
    page,
    pageSize,
    totalCount,
    onPageChange,
}: ContractListMobileProps) => {
    const hasPagination = page !== undefined && pageSize !== undefined && totalCount !== undefined && onPageChange !== undefined

    return (
        <Box minHeight={300} display={{ base: "flex", md: "none" }} flexDirection="column" gap="3">
            <Show when={isError}>
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Title>
                            <Trans>Ошибка загрузки</Trans>
                        </EmptyState.Title>
                        <EmptyState.Description>
                            <Trans>Не удалось загрузить список договоров. Попробуйте позже.</Trans>
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            </Show>
            <Show when={!isError && !contracts?.length}>
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <Image src={empty} alt="" />
                        </EmptyState.Indicator>
                        <VStack textAlign="center">
                            <EmptyState.Description>
                                <Trans>Здесь будут отображаться документы разных типов</Trans>
                            </EmptyState.Description>
                        </VStack>
                    </EmptyState.Content>
                </EmptyState.Root>
            </Show>
            <Show when={!isError && !!contracts?.length}>
                <For each={contracts ?? []}>
                    {(contract) => (
                        <Card.Root
                            key={contract.id}
                            onClick={() => onRowClick(contract.id!)}
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            borderRadius="12px"
                            p="16px"
                            bg="white"
                        >
                            <VStack align="stretch" gap="3">
                                <HStack justify="space-between" align="flex-start">
                                    <VStack align="flex-start" gap="1" flex="1">
                                        <Text fontSize="14px" fontWeight="600" color="gray.800">
                                            {contract.name}
                                        </Text>
                                        <Text fontSize="12px" color="gray.500">
                                            № {contract.number}
                                        </Text>
                                    </VStack>
                                    <ContractStatusBadge statusId={contract.statusId} statusDisplayName={contract.statusDisplayName} />
                                </HStack>

                                <HStack gap="4">
                                    <VStack align="flex-start" gap="0" flex="1">
                                        <Text fontSize="11px" color="gray.500">
                                            <Trans>Дата создания</Trans>
                                        </Text>
                                        <Text fontSize="13px" fontWeight="500">
                                            {contract.created ? format(parseISO(contract.created), 'dd.MM.yyyy') : ''}
                                        </Text>
                                    </VStack>
                                    <VStack align="flex-start" gap="0" flex="1">
                                        <Text fontSize="11px" color="gray.500">
                                            <Trans>Сумма договора</Trans>
                                        </Text>
                                        <Text fontSize="13px" fontWeight="500">
                                            <FormatNumber value={contract.amount ?? 0} /> {contract.currency?.name}
                                        </Text>
                                    </VStack>
                                </HStack>

                                <VStack align="stretch" gap="2">
                                    <For each={contract?.signers || []}>
                                        {(signer, index) => (
                                            <HStack key={index} gap="2" fontSize="13px">
                                                <SignCircle signed={!!signer.signed} rejected={!!signer.rejected} />
                                                <Text color={index === 0 ? 'gray.700' : 'gray.500'}>
                                                    {signer?.company?.name}
                                                </Text>
                                            </HStack>
                                        )}
                                    </For>
                                </VStack>
                            </VStack>
                        </Card.Root>
                    )}
                </For>
                <Show when={hasPagination && totalCount! > 0}>
                    <HStack w="full" justify="center" pt="4">
                        <Pagination.Root
                            count={totalCount!}
                            pageSize={pageSize!}
                            page={page!}
                            onPageChange={({ page }) => onPageChange!(page)}
                        >
                            <Pagination.PrevTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Trans>Назад</Trans>
                                </Button>
                            </Pagination.PrevTrigger>
                            <Pagination.Items
                                render={(page) => (
                                    <IconButton variant={{ base: "ghost", _selected: "outline" }} size="sm">
                                        {page.value}
                                    </IconButton>
                                )}
                            />
                            <Pagination.NextTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Trans>Вперед</Trans>
                                </Button>
                            </Pagination.NextTrigger>
                        </Pagination.Root>
                    </HStack>
                </Show>
            </Show>
        </Box>
    )
}
