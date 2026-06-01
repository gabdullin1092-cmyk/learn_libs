import { Box, Card, EmptyState, For, HStack, Show, Text, VStack } from '@chakra-ui/react'
import { format, parseISO } from 'date-fns'
import type { ContractListItem } from './types'
import { StatusBadge } from './StatusBadge'
import { SignCircle } from './SignCircle'

// ============================================================
// Мобильная версия списка — карточки вместо таблицы
// display flex только на base (мобайл), скрывается от md
//
// Паттерн из оригинала:
//   - Две полные версии списка (Desktop + Mobile)
//   - CSS display переключает какая видна
//   - Нет JS-логики для responsive — чистый CSS
// ============================================================

type Props = {
    contracts: ContractListItem[]
    isLoading: boolean
    onRowClick: (id: string) => void
}

export const ContractListMobile = ({ contracts, isLoading, onRowClick }: Props) => {
    return (
        <Box display={{ base: 'flex', md: 'none' }} flexDir="column" gap="3">
            <Show when={isLoading}>
                <Text color="gray.400" textAlign="center" py="8">Загрузка...</Text>
            </Show>

            <Show when={!isLoading && contracts.length === 0}>
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Title>Договоры не найдены</EmptyState.Title>
                    </EmptyState.Content>
                </EmptyState.Root>
            </Show>

            <For each={contracts}>
                {(contract) => (
                    <Card.Root
                        key={contract.id}
                        onClick={() => onRowClick(contract.id)}
                        cursor="pointer"
                        _hover={{ bg: 'gray.50' }}
                        p="4"
                    >
                        <VStack align="stretch" gap="3">
                            {/* Шапка карточки: название + статус */}
                            <HStack justify="space-between" align="flex-start">
                                <VStack align="flex-start" gap="0" flex="1">
                                    <Text fontWeight="600" fontSize="14px">{contract.name}</Text>
                                    <Text fontSize="12px" color="gray.500">№ {contract.number}</Text>
                                </VStack>
                                <StatusBadge statusId={contract.statusId} statusDisplayName={contract.statusDisplayName} />
                            </HStack>

                            {/* Мета-данные */}
                            <HStack gap="4">
                                <VStack align="flex-start" gap="0" flex="1">
                                    <Text fontSize="11px" color="gray.500">Дата создания</Text>
                                    <Text fontSize="13px" fontWeight="500">
                                        {format(parseISO(contract.created), 'dd.MM.yyyy')}
                                    </Text>
                                </VStack>
                                <VStack align="flex-start" gap="0" flex="1">
                                    <Text fontSize="11px" color="gray.500">Сумма</Text>
                                    <Text fontSize="13px" fontWeight="500">
                                        {contract.amount.toLocaleString('ru-RU')} {contract.currency.name}
                                    </Text>
                                </VStack>
                            </HStack>

                            {/* Подписанты */}
                            <VStack align="stretch" gap="1">
                                <For each={contract.signers}>
                                    {(signer, i) => (
                                        <HStack key={signer.id} gap="2" fontSize="13px">
                                            <SignCircle signed={signer.signed} rejected={signer.rejected} />
                                            <Text color={i === 0 ? 'gray.700' : 'gray.400'}>
                                                {signer.company.name}
                                            </Text>
                                        </HStack>
                                    )}
                                </For>
                            </VStack>
                        </VStack>
                    </Card.Root>
                )}
            </For>
        </Box>
    )
}
