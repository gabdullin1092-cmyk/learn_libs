import { components } from "@api/schema";
import { Badge } from "@chakra-ui/react";
import { memo } from "react";

type ColorConf = { bg: string; text: string }

const getStatusColor = (status?: number | null): ColorConf => {
  const statusMap: Record<number, ColorConf> = {
    10: { bg: "bg.created",    text: "text.created" },    // Created
    20: { bg: "bg.onApproval", text: "text.onApproval" }, // OnApproval
    30: { bg: "bg.onSigning",  text: "text.onSigning" },  // OnSigning
    40: { bg: "bg.signed",     text: "text.signed" },     // Signed
    50: { bg: "bg.rejected",   text: "text.rejected" },   // Rejected
    60: { bg: "bg.deleted",    text: "text.deleted" },    // Deleted
    70: { bg: "bg.blocked",    text: "text.blocked" },    // Blocked
    80: { bg: "bg.revoked",    text: "text.revoked" },    // Revoked
  }
  return statusMap[status ?? 10] ?? { bg: "bg.deleted", text: "text.deleted" }
}

type EContractStatus = components["schemas"]["EContractStatus"]

type ContractStatusBadgeProps = {
    statusId?: EContractStatus | null
    statusDisplayName?: string | null
}

export const ContractStatusBadge = memo<ContractStatusBadgeProps>(({ statusId, statusDisplayName }) => {
  const statusColor = getStatusColor(statusId ?? 10)
  return (
    <Badge bg={statusColor.bg} color={statusColor.text}>
      {statusDisplayName}
    </Badge>
  )
})
