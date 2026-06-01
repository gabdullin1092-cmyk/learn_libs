import { Contract, ContractListItem, ContractStatus, STATUS_LABELS } from './types'

// ============================================================
// ПОЛЬЗОВАТЕЛИ — три роли для демо
// В ContractsPage есть переключатель "Текущий пользователь"
// который меняет что видно и какие кнопки активны
// ============================================================
export const USERS = {
    alice: { id: 'alice', fullName: 'Алиса Иванова', email: 'alice@bnect.com' },
    bob:   { id: 'bob',   fullName: 'Боб Петров',    email: 'bob@bnect.com' },
    carol: { id: 'carol', fullName: 'Кэрол Сидорова', email: 'carol@bnect.com' },
}

const COMPANIES = {
    alpha: { id: 'alpha', name: 'Альфа Груп', idn: '7701234567' },
    beta:  { id: 'beta',  name: 'Бета Трейд', idn: '7709876543' },
}

const makeLog = (id: string, statusId: ContractStatus, authorId: keyof typeof USERS, comment?: string) => ({
    id,
    statusDisplayName: STATUS_LABELS[statusId],
    fullName: USERS[authorId].fullName,
    created: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    comment,
})

// ============================================================
// ДОГОВОРЫ — по одному на каждый статус для наглядности
// ============================================================
const contracts: Contract[] = [
    {
        id: 'c1', number: '001', name: 'Договор поставки оборудования',
        description: 'Поставка серверного оборудования',
        statusId: 10, statusDisplayName: STATUS_LABELS[10],
        created: '2024-01-15T10:00:00Z',
        startDate: '2024-02-01T00:00:00Z', endDate: '2024-12-31T00:00:00Z',
        amount: 1500000, currency: { name: 'RUB' },
        initiatorId: 'alice',
        sender:   { id: 's1', company: COMPANIES.alpha, user: USERS.alice, signed: false, rejected: false, index: 0 },
        receiver: { id: 's2', company: COMPANIES.beta,  user: USERS.bob,   signed: false, rejected: false, index: 1 },
        approvers: [{ id: 'a1', user: USERS.carol, isApproved: null }],
        logs: [makeLog('l1', 10, 'alice')],
    },
    {
        id: 'c2', number: '002', name: 'Договор оказания услуг по разработке',
        description: 'Разработка CRM системы',
        statusId: 20, statusDisplayName: STATUS_LABELS[20],
        created: '2024-01-20T10:00:00Z',
        startDate: '2024-02-15T00:00:00Z', endDate: '2024-06-30T00:00:00Z',
        amount: 850000, currency: { name: 'RUB' },
        initiatorId: 'alice',
        sender:   { id: 's3', company: COMPANIES.alpha, user: USERS.alice, signed: false, rejected: false, index: 0 },
        receiver: { id: 's4', company: COMPANIES.beta,  user: USERS.bob,   signed: false, rejected: false, index: 1 },
        approvers: [{ id: 'a2', user: USERS.carol, isApproved: null }],
        logs: [makeLog('l2', 10, 'alice'), makeLog('l3', 20, 'alice')],
    },
    {
        id: 'c3', number: '003', name: 'Договор аренды офисного помещения',
        description: 'Аренда офиса на 2024 год',
        statusId: 30, statusDisplayName: STATUS_LABELS[30],
        created: '2024-01-25T10:00:00Z',
        startDate: '2024-03-01T00:00:00Z', endDate: '2025-02-28T00:00:00Z',
        amount: 2400000, currency: { name: 'RUB' },
        initiatorId: 'alice',
        sender:   { id: 's5', company: COMPANIES.alpha, user: USERS.alice, signed: false, rejected: false, index: 0 },
        receiver: { id: 's6', company: COMPANIES.beta,  user: USERS.bob,   signed: false, rejected: false, index: 1 },
        approvers: [{ id: 'a3', user: USERS.carol, isApproved: true }],
        logs: [makeLog('l4', 10, 'alice'), makeLog('l5', 20, 'alice'), makeLog('l6', 30, 'carol')],
    },
    {
        id: 'c4', number: '004', name: 'Договор на техническое обслуживание',
        description: 'Поддержка и обслуживание оборудования',
        statusId: 40, statusDisplayName: STATUS_LABELS[40],
        created: '2024-01-10T10:00:00Z',
        startDate: '2024-01-15T00:00:00Z', endDate: '2024-12-31T00:00:00Z',
        amount: 600000, currency: { name: 'USD' },
        initiatorId: 'alice',
        sender:   { id: 's7', company: COMPANIES.alpha, user: USERS.alice, signed: true,  rejected: false, index: 0 },
        receiver: { id: 's8', company: COMPANIES.beta,  user: USERS.bob,   signed: true,  rejected: false, index: 1 },
        approvers: [{ id: 'a4', user: USERS.carol, isApproved: true }],
        logs: [
            makeLog('l7', 10, 'alice'), makeLog('l8', 20, 'alice'),
            makeLog('l9', 30, 'carol'), makeLog('l10', 40, 'bob'),
        ],
    },
    {
        id: 'c5', number: '005', name: 'Договор транспортной логистики',
        description: 'Услуги грузоперевозок',
        statusId: 50, statusDisplayName: STATUS_LABELS[50],
        created: '2024-01-05T10:00:00Z',
        startDate: '2024-01-10T00:00:00Z', endDate: '2024-06-30T00:00:00Z',
        amount: 300000, currency: { name: 'EUR' },
        initiatorId: 'alice',
        sender:   { id: 's9',  company: COMPANIES.alpha, user: USERS.alice, signed: false, rejected: false, index: 0 },
        receiver: { id: 's10', company: COMPANIES.beta,  user: USERS.bob,   signed: false, rejected: true,  index: 1 },
        approvers: [{ id: 'a5', user: USERS.carol, isApproved: false, comment: 'Условия не устраивают' }],
        logs: [
            makeLog('l11', 10, 'alice'), makeLog('l12', 20, 'alice'),
            makeLog('l13', 50, 'carol', 'Условия не устраивают'),
        ],
    },
]

// Актуальное состояние — мутируется при approve/sign/reject
let contractsState: Contract[] = contracts.map(c => ({ ...c }))

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ============================================================
// СИМУЛИРОВАННЫЕ API — имитируют реальные server functions
// В настоящем проекте это createServerFn + client.GET/POST
// ============================================================

export const apiGetContracts = async (): Promise<ContractListItem[]> => {
    await delay(400)
    return contractsState.map(c => ({
        id: c.id, number: c.number, name: c.name,
        statusId: c.statusId, statusDisplayName: c.statusDisplayName,
        created: c.created, amount: c.amount, currency: c.currency,
        signers: [
            { id: c.sender.id, company: c.sender.company, signed: c.sender.signed, rejected: c.sender.rejected },
            { id: c.receiver.id, company: c.receiver.company, signed: c.receiver.signed, rejected: c.receiver.rejected },
        ],
    }))
}

export const apiGetContract = async (id: string): Promise<Contract> => {
    await delay(300)
    const contract = contractsState.find(c => c.id === id)
    if (!contract) throw new Error('Договор не найден')
    return { ...contract }
}

// Согласование — approver одобряет или отклоняет
export const apiApproveContract = async (id: string, isApproved: boolean, comment?: string): Promise<void> => {
    await delay(600)
    const contract = contractsState.find(c => c.id === id)
    if (!contract) throw new Error('Договор не найден')

    // Обновляем isApproved у текущего согласующего
    contract.approvers = contract.approvers.map(a => ({ ...a, isApproved, comment }))

    if (isApproved) {
        // Если все согласовали → переходим на подписание
        const allApproved = contract.approvers.every(a => a.isApproved === true)
        if (allApproved) {
            contract.statusId = 30
            contract.statusDisplayName = STATUS_LABELS[30]
            contract.logs.push({ id: `l${Date.now()}`, statusDisplayName: STATUS_LABELS[30], fullName: 'Система', created: new Date().toISOString() })
        }
    } else {
        contract.statusId = 50
        contract.statusDisplayName = STATUS_LABELS[50]
        contract.logs.push({ id: `l${Date.now()}`, statusDisplayName: STATUS_LABELS[50], fullName: 'Система', created: new Date().toISOString(), comment })
    }
}

// Подписание — signer подписывает договор
export const apiSignContract = async (id: string, userId: string): Promise<void> => {
    await delay(800)
    const contract = contractsState.find(c => c.id === id)
    if (!contract) throw new Error('Договор не найден')

    // Помечаем подписанта как signed
    if (contract.sender.user.id === userId) contract.sender.signed = true
    if (contract.receiver.user.id === userId) contract.receiver.signed = true

    contract.logs.push({ id: `l${Date.now()}`, statusDisplayName: 'Подписан участником', fullName: userId, created: new Date().toISOString() })

    // Если оба подписали → статус 40
    if (contract.sender.signed && contract.receiver.signed) {
        contract.statusId = 40
        contract.statusDisplayName = STATUS_LABELS[40]
        contract.logs.push({ id: `l${Date.now()}`, statusDisplayName: STATUS_LABELS[40], fullName: 'Система', created: new Date().toISOString() })
    }
}

// Отклонение — signer отклоняет
export const apiRejectContract = async (id: string, comment: string): Promise<void> => {
    await delay(600)
    const contract = contractsState.find(c => c.id === id)
    if (!contract) throw new Error('Договор не найден')
    contract.statusId = 50
    contract.statusDisplayName = STATUS_LABELS[50]
    contract.logs.push({ id: `l${Date.now()}`, statusDisplayName: STATUS_LABELS[50], fullName: 'Участник', created: new Date().toISOString(), comment })
}
