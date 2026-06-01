import {FC, useMemo} from "react"
import { Box, FormatNumber, HStack, Text, VStack, For } from "@chakra-ui/react"
import { Trans } from "@lingui/react/macro"
import { format, parseISO } from "date-fns"
import { createColumnHelper } from "@tanstack/react-table"
import { DataTable } from "@components/ui/data-table"
import { ContractStatusBadge } from "@features/document/contract/StatusBadge"
import { SignCircle } from "@features/document/SignCircle"
import { components } from "@api/schema"

type Contract = components["schemas"]["ContractForListResponse"]

const columnHelper = createColumnHelper<Contract>()

type ContractListDesktopProps = {
    contracts?: Contract[]
    isError: boolean
    onRowClick: (id: string) => void
    page?: number
    pageSize?: number
    totalCount?: number
    onPageChange?: (page: number) => void
}

export const ContractListDesktop: FC<ContractListDesktopProps> = ({
    contracts,
    isError,
    onRowClick,
    page,
    pageSize,
    totalCount,
    onPageChange,
}) => {
    const columns = useMemo(() => [
        columnHelper.accessor('number', {
            header: () => '№',
            minSize: 100,
        }),
        columnHelper.accessor('name', {
            header: () => <Trans>Информация о договоре</Trans>,
            minSize: 350,
        }),
        columnHelper.accessor('created', {
            header: () => <Trans>Дата создания</Trans>,
            cell: (info) => info.getValue() ? format(parseISO(info.getValue()!), 'dd.MM.yyyy') : '',
            minSize: 200,
        }),
        columnHelper.accessor('amount', {
            header: () => <Trans>Сумма договора</Trans>,
            cell: (info) => (
                <>
                    <FormatNumber value={info.getValue() ?? 0} /> {info.row.original.currency?.name}
                </>
            ),
            minSize: 200,
        }),
        columnHelper.accessor('statusId', {
            header: () => <Trans>Статус</Trans>,
            cell: (info) => (
                <ContractStatusBadge
                    statusId={info.getValue()}
                    statusDisplayName={info.row.original.statusDisplayName}
                />
            ),
            minSize: 200,
        }),
        columnHelper.accessor('signers', {
            header: () => <Trans>Подписанты</Trans>,
            cell: (info) => (
                <VStack alignItems="start" justify="start">
                    <For each={info.getValue() || []}>
                        {(signer, index) => (
                            <HStack
                                key={signer.id}
                                color={index === 0 ? 'gray.600' : 'gray.400'}
                                justify="flex-start"
                                maxW="150px"
                            >
                                <SignCircle signed={!!signer.signed} rejected={!!signer.rejected} />
                                <Text truncate flex="1">
                                    {signer?.company?.name}
                                </Text>
                            </HStack>
                        )}
                    </For>
                </VStack>
            ),
            minSize: 200,
        }),
    ], [])

    return (
        <Box minHeight={300} display={{ base: "none", md: "flex" }} flexDirection="column" gap={2}>
            <Box w="full">
                <DataTable
                    data={contracts ?? []}
                    columns={columns}
                    isError={isError}
                    emptyMessage={<Trans>Здесь будут отображаться документы разных типов</Trans>}
                    onRowClick={(row) => onRowClick(row.id!)}
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    onPageChange={onPageChange}
                />
            </Box>
        </Box>
    )
}