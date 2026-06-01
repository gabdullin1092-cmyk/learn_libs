import { Badge } from '@chakra-ui/react'
import { memo } from 'react'
import type { ContractStatus } from './types'

// ============================================================
// Числовой statusId → цвет и название
// В оригинале используются кастомные CSS-токены темы (bg.created и т.д.)
// Здесь заменяем стандартными палитрами Chakra
// ============================================================
const STATUS_COLOR: Record<ContractStatus, string> = {
    10: 'gray',    // Создан
    20: 'blue',    // На согласовании
    30: 'orange',  // На подписании
    40: 'green',   // Подписан
    50: 'red',     // Отклонён
}

type Props = {
    statusId?: ContractStatus | null
    statusDisplayName?: string | null
}

export const StatusBadge = memo<Props>(({ statusId, statusDisplayName }) => {
    const palette = STATUS_COLOR[statusId ?? 10] ?? 'gray'
    return (
        <Badge colorPalette={palette} variant="subtle" whiteSpace="nowrap">
            {statusDisplayName ?? '—'}
        </Badge>
    )
})
