import { useState } from 'react'
import {
    Badge, Box, Button, Circle, For, Heading, HStack,
    Icon, IconButton, Input, Show, Text, Textarea, VStack,
    Dialog, Portal,
} from '@chakra-ui/react'
import { ArrowLeft, Check, ChevronDown, CircleCheck, Clock, Mail } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiApproveContract, apiGetContract, apiRejectContract, apiSignContract, USERS } from './fakeData'
import { StatusBadge } from './StatusBadge'
import { SignCircle } from './SignCircle'
import { ContractLogs } from './ContractLogs'

type Props = {
    contractId: string
    currentUserId: string
    onBack: () => void
}

// ============================================================
// ContractDetail — детальная страница договора
//
// Ключевые паттерны из оригинала:
//
// 1. РОЛИ — вычисляются из данных, не передаются извне:
//    isApprover = текущий пользователь есть в contract.approvers
//    isSigner   = текущий пользователь есть в sender или receiver
//    isInitiator = текущий пользователь создал договор
//
// 2. ROLE-BASED UI — кнопки показываются только если:
//    statusId === 20 && isApprover → Согласовать / Отклонить
//    statusId === 30 && isSigner   → Подписать / Отклонить
//
// 3. useMutation + useQueryClient.invalidateQueries:
//    После мутации инвалидируем кеш → useQuery перезапрашивает данные
//    Компонент автоматически перерисовывается с новым статусом
//
// 4. Dialog для ввода комментария при отклонении
// ============================================================
export const ContractDetail = ({ contractId, currentUserId, onBack }: Props) => {
    const [approversExpanded, setApproversExpanded] = useState(false)
    const [rejectComment, setRejectComment] = useState('')
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

    const queryClient = useQueryClient()

    // useQuery — загружаем договор по id
    // queryKey включает contractId → при смене id запрос повторяется
    const { data: contract, isLoading } = useQuery({
        queryKey: ['contract', contractId],
        queryFn: () => apiGetContract(contractId),
    })

    // ============================================================
    // ВЫЧИСЛЕНИЕ РОЛЕЙ
    // В оригинале это тоже вычисляется на клиенте из данных договора
    // Нет отдельного "role" поля — роль определяется присутствием userId
    // ============================================================
    const isApprover  = contract?.approvers.some(a => a.user.id === currentUserId) ?? false
    const isSender    = contract?.sender.user.id === currentUserId
    const isReceiver  = contract?.receiver.user.id === currentUserId
    const isSigner    = isSender || isReceiver
    const isInitiator = contract?.initiatorId === currentUserId

    // ============================================================
    // МУТАЦИИ
    // Каждое действие = отдельная useMutation
    // onSuccess → invalidateQueries(['contract', id]) → useQuery обновляется
    // ============================================================
    const { mutate: approve, isPending: isApproving } = useMutation({
        mutationFn: (isApproved: boolean) => apiApproveContract(contractId, isApproved),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contract', contractId] }),
    })

    const { mutate: sign, isPending: isSigning } = useMutation({
        mutationFn: () => apiSignContract(contractId, currentUserId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
            queryClient.invalidateQueries({ queryKey: ['contracts'] })
        },
    })

    const { mutate: reject, isPending: isRejecting } = useMutation({
        mutationFn: () => apiRejectContract(contractId, rejectComment),
        onSuccess: () => {
            setRejectDialogOpen(false)
            setRejectComment('')
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
            queryClient.invalidateQueries({ queryKey: ['contracts'] })
        },
    })

    if (isLoading) return <Text p="8" color="gray.400">Загрузка...</Text>
    if (!contract) return <Text p="8" color="red.500">Договор не найден</Text>

    return (
        <VStack align="stretch" gap="4">
            {/* ЗАГОЛОВОК */}
            <HStack gap="3" flexWrap="wrap">
                <IconButton variant="ghost" size="sm" onClick={onBack} aria-label="Назад">
                    <ArrowLeft size={20} />
                </IconButton>
                <Heading size="md" flex="1">Договор № {contract.number}</Heading>
                <StatusBadge statusId={contract.statusId} statusDisplayName={contract.statusDisplayName} />

                {/* Бейдж роли — учебный элемент, в оригинале нет */}
                {isInitiator && <Badge colorPalette="purple" variant="outline">Инициатор</Badge>}
                {isApprover  && <Badge colorPalette="blue"   variant="outline">Согласующий</Badge>}
                {isSigner    && <Badge colorPalette="orange" variant="outline">Подписант</Badge>}
            </HStack>

            {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <Box bg="white" borderRadius="16px" p="6">
                <VStack align="stretch" gap="5">
                    <Heading size="sm">{contract.name}</Heading>
                    <Text fontSize="13px" color="gray.500">{contract.description}</Text>

                    <HStack gap="6" flexWrap="wrap">
                        <VStack align="flex-start" gap="0">
                            <Text fontSize="12px" color="gray.400">Период</Text>
                            <Text fontSize="14px">
                                {format(parseISO(contract.startDate), 'dd.MM.yyyy')} — {format(parseISO(contract.endDate), 'dd.MM.yyyy')}
                            </Text>
                        </VStack>
                        <VStack align="flex-start" gap="0">
                            <Text fontSize="12px" color="gray.400">Сумма</Text>
                            <Text fontSize="14px" fontWeight="600">
                                {contract.amount.toLocaleString('ru-RU')} {contract.currency.name}
                            </Text>
                        </VStack>
                    </HStack>

                    {/* ============================================================
                        КНОПКИ ДЕЙСТВИЙ — role-based UI
                        Показываются только при нужном сочетании статуса и роли
                    ============================================================ */}
                    <Show when={contract.statusId === 20 && isApprover}>
                        <HStack gap="3" pt="2" flexWrap="wrap">
                            <Button
                                colorPalette="green" size="sm"
                                loading={isApproving}
                                onClick={() => approve(true)}
                            >
                                <Check size={16} /> Согласовать
                            </Button>
                            <Button
                                variant="outline" size="sm" colorPalette="red"
                                loading={isApproving}
                                onClick={() => approve(false)}
                            >
                                Отклонить
                            </Button>
                        </HStack>
                    </Show>

                    <Show when={contract.statusId === 30 && isSigner}>
                        <HStack gap="3" pt="2" flexWrap="wrap">
                            <Button
                                colorPalette="blue" size="sm"
                                loading={isSigning}
                                onClick={() => sign()}
                            >
                                Подписать
                            </Button>
                            <Button
                                variant="outline" size="sm" colorPalette="red"
                                onClick={() => setRejectDialogOpen(true)}
                            >
                                Отклонить
                            </Button>
                        </HStack>
                    </Show>

                    {/* СОГЛАСУЮЩИЕ — раскрывающийся блок */}
                    <Show when={contract.approvers.length > 0}>
                        <Box
                            bg="gray.50" borderRadius="12px" cursor="pointer"
                            onClick={() => setApproversExpanded(v => !v)}
                        >
                            <HStack p="4" justify="space-between">
                                <Text fontWeight="500">
                                    Согласующие: {contract.approvers.length}
                                </Text>
                                <Icon
                                    color="blue.500"
                                    transform={approversExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}
                                    transition="transform 0.2s"
                                >
                                    <ChevronDown size={20} />
                                </Icon>
                            </HStack>

                            <Show when={approversExpanded}>
                                <VStack align="stretch" p="4" pt="0" gap="3">
                                    <For each={contract.approvers}>
                                        {(approver) => (
                                            <HStack key={approver.id} justify="space-between" flexWrap="wrap" gap="2">
                                                <Text fontSize="14px" fontWeight="500">{approver.user.fullName}</Text>
                                                <HStack gap="1" fontSize="13px" color="gray.500">
                                                    <Mail size={14} />
                                                    <Text>{approver.user.email}</Text>
                                                </HStack>
                                                <HStack gap="1">
                                                    {approver.isApproved === true  && <><Circle size="16px" bg="green.500"><Icon color="white" boxSize="8px"><Check /></Icon></Circle><Text color="green.600" fontSize="13px">Согласован</Text></>}
                                                    {approver.isApproved === false && <><Circle size="16px" bg="red.500"><Icon color="white" boxSize="8px"><ChevronDown /></Icon></Circle><Text color="red.600" fontSize="13px">Отклонил{approver.comment ? `: ${approver.comment}` : ''}</Text></>}
                                                    {approver.isApproved === null  && <><Clock size="14px" color="orange" /><Text color="orange.600" fontSize="13px">Ожидает</Text></>}
                                                </HStack>
                                            </HStack>
                                        )}
                                    </For>
                                </VStack>
                            </Show>
                        </Box>
                    </Show>

                    {/* ПОДПИСАНТЫ — отправитель и получатель */}
                    <HStack gap="4" align="stretch" flexWrap="wrap">
                        {[{ label: 'Отправитель', signer: contract.sender }, { label: 'Получатель', signer: contract.receiver }].map(({ label, signer }) => (
                            <Box key={label} bg="gray.50" borderRadius="12px" p="4" flex="1" minW="200px">
                                <HStack justify="space-between" mb="3">
                                    <Text fontSize="13px" color="gray.500" fontWeight="600">{label}</Text>
                                    <SignCircle signed={signer.signed} rejected={signer.rejected} />
                                </HStack>
                                <VStack align="flex-start" gap="1">
                                    <Text fontSize="13px" fontWeight="600">{signer.company.idn} — {signer.company.name}</Text>
                                    <Text fontSize="13px">{signer.user.fullName}</Text>
                                    <HStack gap="1" fontSize="12px" color="gray.500">
                                        <Mail size={12} />
                                        <Text>{signer.user.email}</Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        ))}
                    </HStack>
                </VStack>
            </Box>

            {/* ИСТОРИЯ */}
            <ContractLogs logs={contract.logs} />

            {/* ДИАЛОГ ОТКЛОНЕНИЯ — вводим причину */}
            <Dialog.Root open={rejectDialogOpen} onOpenChange={({ open }) => setRejectDialogOpen(open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Отклонить договор</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <VStack gap="3">
                                    <Text fontSize="14px" color="gray.600">
                                        Укажите причину отклонения
                                    </Text>
                                    <Textarea
                                        value={rejectComment}
                                        onChange={(e) => setRejectComment(e.target.value)}
                                        placeholder="Причина отклонения..."
                                        rows={3}
                                    />
                                </VStack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                                    Отмена
                                </Button>
                                <Button
                                    colorPalette="red"
                                    loading={isRejecting}
                                    disabled={!rejectComment.trim()}
                                    onClick={() => reject()}
                                >
                                    Отклонить
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </VStack>
    )
}
