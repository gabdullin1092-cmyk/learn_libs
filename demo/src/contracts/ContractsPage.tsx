import { useState } from 'react'
import { Box, Button, For, HStack, Heading, NativeSelect, Show, Text, VStack } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { apiGetContracts, USERS } from './fakeData'
import { ContractListDesktop } from './ContractListDesktop'
import { ContractListMobile } from './ContractListMobile'
import { ContractDetail } from './ContractDetail'

// ============================================================
// ContractsPage — оркестратор всего раздела "Договоры"
//
// Отвечает за:
//   1. Загрузку списка договоров (useQuery)
//   2. Навигацию: список ↔ детальная страница (selectedId)
//   3. "Текущий пользователь" — переключатель ролей для демо
//      В реальном проекте этого нет — userId берётся из auth-контекста
//
// Паттерн list/detail без роутера:
//   selectedId === null → показываем список
//   selectedId !== null → показываем ContractDetail
// ============================================================
export const ContractsPage = () => {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string>('alice')

    // useQuery — загружаем список контрактов
    // queryKey: ['contracts'] — при invalidateQueries(['contracts']) обновится
    const { data: contracts = [], isLoading, isError } = useQuery({
        queryKey: ['contracts'],
        queryFn: apiGetContracts,
    })

    const currentUser = USERS[currentUserId as keyof typeof USERS]

    return (
        <Box w="full" maxW="1100px" mx="auto">
            {/* ПАНЕЛЬ УПРАВЛЕНИЯ: переключатель пользователя */}
            <Box bg="blue.50" borderRadius="12px" p="3" mb="4">
                <HStack gap="4" flexWrap="wrap" align="center">
                    <Text fontSize="13px" fontWeight="600" color="blue.700">
                        Демо: текущий пользователь
                    </Text>
                    <NativeSelect.Root size="sm" w="220px">
                        <NativeSelect.Field
                            value={currentUserId}
                            onChange={(e) => setCurrentUserId(e.target.value)}
                            bg="white"
                        >
                            <For each={Object.values(USERS)}>
                                {(user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName}
                                    </option>
                                )}
                            </For>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Text fontSize="12px" color="blue.600">
                        {currentUser.email} — смени пользователя чтобы увидеть разные доступные действия
                    </Text>
                </HStack>
            </Box>

            {/* СПИСОК */}
            <Show when={!selectedId}>
                <VStack align="stretch" gap="4">
                    <HStack justify="space-between">
                        <Heading size="lg">Договоры</Heading>
                        <Text fontSize="13px" color="gray.500">
                            {contracts.length} договоров
                        </Text>
                    </HStack>

                    {isError && (
                        <Text color="red.500">Ошибка загрузки договоров</Text>
                    )}

                    {/* Две версии списка — CSS переключает видимость */}
                    <ContractListDesktop
                        contracts={contracts}
                        isLoading={isLoading}
                        onRowClick={(id) => setSelectedId(id)}
                    />
                    <ContractListMobile
                        contracts={contracts}
                        isLoading={isLoading}
                        onRowClick={(id) => setSelectedId(id)}
                    />

                    {/* Подсказка о роли */}
                    <Box bg="gray.50" borderRadius="8px" p="3">
                        <Text fontSize="12px" color="gray.500">
                            💡 Нажми на договор чтобы открыть детали.
                            Договор №002 (На согласовании) — кнопки активны если текущий пользователь Кэрол.
                            Договор №003 (На подписании) — кнопки активны если текущий пользователь Алиса или Боб.
                        </Text>
                    </Box>
                </VStack>
            </Show>

            {/* ДЕТАЛЬНАЯ СТРАНИЦА */}
            <Show when={!!selectedId}>
                <ContractDetail
                    contractId={selectedId!}
                    currentUserId={currentUserId}
                    onBack={() => setSelectedId(null)}
                />
            </Show>
        </Box>
    )
}
