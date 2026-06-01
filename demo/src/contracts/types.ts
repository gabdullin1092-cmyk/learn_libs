// ============================================================
// СТАТУСЫ — числовой enum как в реальном проекте
// 10→20→30→40 — happy path
// Любой шаг может уйти в 50 (отклонён)
// ============================================================
export type ContractStatus = 10 | 20 | 30 | 40 | 50

export const STATUS_LABELS: Record<ContractStatus, string> = {
    10: 'Создан',
    20: 'На согласовании',
    30: 'На подписании',
    40: 'Подписан',
    50: 'Отклонён',
}

// ============================================================
// ДОМЕННЫЕ ТИПЫ
// ============================================================
export type Company = { id: string; name: string; idn: string }
export type User    = { id: string; fullName: string; email: string }

export type Signer = {
    id: string
    company: Company
    user: User
    signed: boolean
    rejected: boolean
    index: number   // 0 = отправитель, 1 = получатель
}

export type Approver = {
    id: string
    user: User
    isApproved: boolean | null   // null = ещё не ответил
    comment?: string
}

export type ContractLog = {
    id: string
    statusDisplayName?: string
    text?: string
    fullName?: string
    created: string
    comment?: string
}

// Полный договор (для страницы детали)
export type Contract = {
    id: string
    number: string
    name: string
    description: string
    statusId: ContractStatus
    statusDisplayName: string
    created: string
    startDate: string
    endDate: string
    amount: number
    currency: { name: string }
    sender: Signer
    receiver: Signer
    approvers: Approver[]
    logs: ContractLog[]
    initiatorId: string   // кто создал
}

// Краткая версия для списка
export type ContractListItem = {
    id: string
    number: string
    name: string
    statusId: ContractStatus
    statusDisplayName: string
    created: string
    amount: number
    currency: { name: string }
    signers: Array<{ id: string; company: Company; signed: boolean; rejected: boolean }>
}
