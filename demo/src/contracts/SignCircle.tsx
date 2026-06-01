import { Circle, Icon } from '@chakra-ui/react'
import { Check, X, Clock } from 'lucide-react'

// ============================================================
// Индикатор статуса подписанта:
//   ✓ зелёный — подписал
//   ✗ красный  — отклонил
//   ⏱ серый    — ожидает
// В оригинале это @features/document/SignCircle
// ============================================================
type Props = { signed: boolean; rejected: boolean }

export const SignCircle = ({ signed, rejected }: Props) => {
    if (signed)   return <Circle size="20px" bg="green.500">  <Icon color="white" size="xs"><Check /></Icon>  </Circle>
    if (rejected) return <Circle size="20px" bg="red.500">    <Icon color="white" size="xs"><X /></Icon>      </Circle>
    return             <Circle size="20px" bg="gray.300">   <Icon color="white" size="xs"><Clock /></Icon>  </Circle>
}
