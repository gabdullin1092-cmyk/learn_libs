import { useMemo } from 'react'
import { Box, For, HStack, Table, Text, VStack } from '@chakra-ui/react'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import type { ContractListItem } from './types'
import { StatusBadge } from './StatusBadge'
import { SignCircle } from './SignCircle'

// ============================================================
// @tanstack/react-table — headless таблица (без UI)
// Библиотека даёт логику: колонки, строки, сортировка, пагинация
// UI рисуем сами через Chakra Table компоненты
//
// Паттерн:
//   1. createColumnHelper<T>() — типизированный хелпер для колонок
//   2. columnHelper.accessor('field', { header, cell }) — описание колонки
//   3. useReactTable({ data, columns, getCoreRowModel }) — создаёт table instance
//   4. table.getHeaderGroups() → рендерим thead
//   5. table.getRowModel().rows → рендерим tbody
//   6. flexRender(def, context) — рендерит header/cell (string или JSX)
// ============================================================

type Props = {
    contracts: ContractListItem[]
    isLoading: boolean
    onRowClick: (id: string) => void
}

const columnHelper = createColumnHelper<ContractListItem>()

export const ContractListDesktop = ({ contracts, isLoading, onRowClick }: Props) => {
    // useMemo — колонки не пересоздаются при каждом рендере
    const columns = useMemo(() => [
        columnHelper.accessor('number', {
            header: '№',
            cell: (info) => info.getValue(),
            size: 80,
        }),
        columnHelper.accessor('name', {
            header: 'Название договора',
            cell: (info) => (
                <Text fontWeight="500" fontSize="14px">{info.getValue()}</Text>
            ),
        }),
        columnHelper.accessor('created', {
            header: 'Дата создания',
            // info.getValue() → значение ячейки ('2024-01-15T...')
            // info.row.original → вся строка ContractListItem
            cell: (info) => format(parseISO(info.getValue()), 'dd.MM.yyyy'),
            size: 140,
        }),
        columnHelper.accessor('amount', {
            header: 'Сумма',
            cell: (info) => (
                <Text whiteSpace="nowrap">
                    {info.getValue().toLocaleString('ru-RU')} {info.row.original.currency.name}
                </Text>
            ),
            size: 160,
        }),
        columnHelper.accessor('statusId', {
            header: 'Статус',
            cell: (info) => (
                <StatusBadge
                    statusId={info.getValue()}
                    statusDisplayName={info.row.original.statusDisplayName}
                />
            ),
            size: 160,
        }),
        columnHelper.accessor('signers', {
            header: 'Подписанты',
            cell: (info) => (
                <VStack align="flex-start" gap="1">
                    <For each={info.getValue()}>
                        {(signer, i) => (
                            <HStack key={signer.id} gap="2" color={i === 0 ? 'gray.700' : 'gray.400'}>
                                <SignCircle signed={signer.signed} rejected={signer.rejected} />
                                <Text fontSize="13px" truncate maxW="140px">
                                    {signer.company.name}
                                </Text>
                            </HStack>
                        )}
                    </For>
                </VStack>
            ),
        }),
    ], [])

    // useReactTable — создаёт table instance с логикой
    // getCoreRowModel() — базовая модель строк (без сортировки/фильтрации)
    const table = useReactTable({
        data: contracts,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        // display none на мобайле — десктопная версия видна только от md
        <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
            <Table.Root variant="line" size="sm" interactive>
                <Table.Header>
                    {/* getHeaderGroups() → массив групп заголовков (обычно одна) */}
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Table.Row key={headerGroup.id} bg="gray.50">
                            {headerGroup.headers.map((header) => (
                                <Table.ColumnHeader
                                    key={header.id}
                                    w={header.getSize()}
                                    fontSize="12px"
                                    color="gray.500"
                                    fontWeight="600"
                                    textTransform="uppercase"
                                    py="3"
                                >
                                    {/* flexRender — умеет рендерить и строку и JSX */}
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </Table.ColumnHeader>
                            ))}
                        </Table.Row>
                    ))}
                </Table.Header>

                <Table.Body>
                    {isLoading ? (
                        <Table.Row>
                            <Table.Cell colSpan={columns.length} textAlign="center" py="8" color="gray.400">
                                Загрузка...
                            </Table.Cell>
                        </Table.Row>
                    ) : table.getRowModel().rows.length === 0 ? (
                        <Table.Row>
                            <Table.Cell colSpan={columns.length} textAlign="center" py="8" color="gray.400">
                                Договоры не найдены
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        /* getRowModel().rows — массив строк с доступом к данным */
                        table.getRowModel().rows.map((row) => (
                            <Table.Row
                                key={row.id}
                                onClick={() => onRowClick(row.original.id)}
                                cursor="pointer"
                                _hover={{ bg: 'blue.50' }}
                                transition="background 0.15s"
                            >
                                {/* getVisibleCells() — ячейки видимых колонок */}
                                {row.getVisibleCells().map((cell) => (
                                    <Table.Cell key={cell.id} py="3" verticalAlign="top">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))
                    )}
                </Table.Body>
            </Table.Root>
        </Box>
    )
}
