import { Box, Button, For, FormatNumber, Heading, HStack, Icon, Show, Text, VStack } from "@chakra-ui/react"
import { Trans } from "@lingui/react/macro"
import { format, parseISO } from "date-fns"
import { ChevronDown, CircleCheckBig, Clock, Send } from "lucide-react"
import { ContractApproverDialog } from "@features/document/contract/ContractApprover.tsx"
import { ContractRejectDialog } from "@features/document/contract/ContractReject.tsx"
import { SignCircle } from "@features/document/SignCircle.tsx"
import { DocumentPreview } from "@features/common/DocumentPreview.tsx"
import { components } from "@api/schema.ts"

type Contract = components["schemas"]["ContractResponse"]
type Approver = components["schemas"]["ContractApproverResponse"]
type Signer = components["schemas"]["ContractSignerResponse"]

type ContractInfoProps = {
    contract?: Contract
    isApprover: boolean
    isSigner: boolean
    isSigning: boolean
    sender?: Signer
    receiver?: Signer
    isApproversExpanded: boolean
    onToggleApproversExpanded: () => void
    onSign: () => void
    onReject: () => void
    onApprove: (isApproved: boolean) => void
}

export const ContractInfo = ({
    contract,
    isApprover,
    isSigner,
    isSigning,
    sender,
    receiver,
    isApproversExpanded,
    onToggleApproversExpanded,
    onSign,
    onReject,
    onApprove
}: ContractInfoProps) => {
    return (
        <VStack w="full" gap={{ base: "4", md: "5" }} align="flex-start">
            <VStack w="100%" align="stretch" borderRadius={{ base: "16px", md: "24px" }} p={{ base: "16px", md: "24px", lg: "32px" }} bg="white" gap={{ base: "4", md: "6" }}>
                <Heading size={{ base: "sm", md: "md" }}>{contract?.name}</Heading>
                {/*<Show when={!!contract?.description}>*/}
                {/*    <Box py={{ base: "2", md: "0" }}>*/}
                {/*        <Text fontSize="13px" fontWeight="400" color="text.secondary">*/}
                {/*            <Trans>Описание</Trans>*/}
                {/*        </Text>*/}
                {/*        <Text>{contract?.description}</Text>*/}
                {/*    </Box>*/}
                {/*</Show>*/}
                <HStack gap={{ base: "2", md: "4" }} flexWrap="wrap" w="full">
                    <Show when={contract?.statusId === 20 && isApprover}>
                        <Button onClick={() => onApprove(true)} variant="positive" w={{ base: "full", sm: "auto" }}>
                            <Trans>Согласовать</Trans>
                        </Button>
                        <Button variant="subtle" onClick={() => onApprove(false)} w={{ base: "full", sm: "auto" }}>
                            <Trans>Отклонить</Trans>
                        </Button>
                        <ContractApproverDialog />
                    </Show>
                    <Show when={contract?.statusId === 30 && isSigner}>
                        <Button
                            onClick={onSign}
                            loading={isSigning}
                            loadingText={<Trans>Подписание...</Trans>}
                            disabled={isSigning}
                            w={{ base: "full", sm: "auto" }}
                        >
                            <Trans>Подписать</Trans>
                        </Button>
                        <Button variant="negative" onClick={onReject} disabled={isSigning} w={{ base: "full", sm: "auto" }}>
                            <Trans>Отклонить</Trans>
                        </Button>
                        <ContractRejectDialog />
                    </Show>
                </HStack>
                
                <HStack gap="0" alignItems="flex-start" flexWrap={{ base: "wrap", lg: "nowrap" }}>
                    <VStack align="flex-start" gap="5" flex="1">
                        <Box>
                            <Text fontSize="13px" fontWeight="400" color="text.secondary"><Trans>Дата договора</Trans></Text>
                            <Text>
                                <Trans>
                                    c {contract?.startDate ? format(parseISO(contract.startDate), 'dd.MM.yyyy') : ''} по {contract?.endDate ? format(parseISO(contract.endDate), 'dd.MM.yyyy') : ''}
                                </Trans>
                            </Text>
                        </Box>
                        <Show when={contract?.isgenpodriyd === true}>
                            <Box>
                                <Text fontSize="13px" fontWeight="400" color="text.secondary" whiteSpace="nowrap">
                                    <Trans>Регистрационный номер соглашения о возмещении</Trans>
                                </Text>
                                <Text>{contract?.registrationNumberVozm ?? '—'}</Text>
                            </Box>
                        </Show>
                    </VStack>
                    <Box flex="0.5">
                        <Text fontSize="13px" fontWeight="400" color="text.secondary"><Trans>Валюта</Trans></Text>
                        <Text>{contract?.currency?.name}</Text>
                    </Box>
                    <VStack align="flex-start" gap="5" flex="1">
                        <Box>
                            <Text fontSize="13px" fontWeight="400" color="text.secondary"><Trans>Сумма договора</Trans></Text>
                            <Text><FormatNumber value={contract?.amount ?? 0} /> {contract?.currency?.name}</Text>
                        </Box>
                        <Show when={contract?.isgenpodriyd === true}>
                            <Box>
                                <Text fontSize="13px" fontWeight="400" color="text.secondary">
                                    <Trans>Процент генподрядного удержания</Trans>
                                </Text>
                                <Text>
                                    <FormatNumber value={contract?.genpodriyd ?? 0} maximumFractionDigits={2} />%
                                </Text>
                            </Box>
                        </Show>
                    </VStack>
                </HStack>

                {/* Approvers */}
                <Show when={!!(contract?.approvers?.length)}>
                    <Box bg="bg.lightGray" borderRadius="16px" cursor="pointer" onClick={onToggleApproversExpanded} transition="all 0.3s">
                        <HStack h="56px" p="18px 12px" justifyContent="space-between" alignItems="center">
                            <Text p="12px"><Trans>Согласующие:</Trans> {contract?.approvers?.length ?? 0}</Text>
                            <Box transform={isApproversExpanded ? "rotate(180deg)" : "rotate(0deg)"} transition="transform 0.3s">
                                <Icon color="bg.accent" size="lg"><ChevronDown /></Icon>
                            </Box>
                        </HStack>
                        <Show when={isApproversExpanded}>
                            <VStack w="full" align="stretch" bg="bg.lightGray" p="16px" borderRadius="16px">
                                <For each={contract?.approvers ?? []}>
                                    {(approver: Approver) => (
                                        <HStack key={approver.id} justifyContent="space-between" alignItems="center" p="8px" borderBottom="1px solid gray.200">
                                            <Text fontSize="14px">{approver.user?.fullName}</Text>
                                            <HStack>
                                                <Text display="flex" alignItems="center" fontSize="14px" color="gray.500" gap="10px">
                                                    <Send color="blue" size={15} />
                                                    {approver.user?.email}
                                                </Text>
                                            </HStack>
                                            <Box display="flex" alignItems="center" gap="4px">
                                                <Show when={!!approver.isApproved} fallback={
                                                    <>
                                                        <Clock size="16px" color="orange" />
                                                        <Text color="orange"><Trans>Ждет согласования</Trans></Text>
                                                    </>
                                                }>
                                                    <>
                                                        <CircleCheckBig size="16px" color="green" />
                                                        <Text color="green">
                                                            <Trans>Согласован</Trans>
                                                        </Text>
                                                    </>
                                                </Show>
                                            </Box>
                                        </HStack>
                                    )}
                                </For>
                            </VStack>
                        </Show>
                    </Box>
                </Show>

                {/* Signers */}
                <VStack w="full" gap="4" align="stretch">
                    <Show when={!!sender}>
                        <Box bg="bg.lightGray" w="100%" p={{ base: "12px", md: "16px" }} borderRadius="12px">
                            <HStack justifyContent="space-between" w="100%" alignItems="flex-start" mb="3">
                                <Text fontSize="14px" fontWeight="600" color="text.secondary">
                                    <Trans>Отправитель</Trans>
                                </Text>
                                <SignCircle signed={!!sender?.signed} rejected={!!sender?.rejected} />
                            </HStack>
                            <VStack align="start" gap="2">
                                <Text fontSize="13px" fontWeight="600">
                                    {sender?.company?.idn} - {sender?.company?.name}
                                </Text>
                                <Text fontSize="14px" fontWeight="400">
                                    {sender?.user?.fullName}
                                </Text>
                                <HStack alignItems="center" fontSize="14px" fontWeight="400" gap="2">
                                    <Send color='blue' size={15} />
                                    <Text>{sender?.user?.email}</Text>
                                </HStack>
                            </VStack>
                        </Box>
                    </Show>
                    <Show when={!!receiver}>
                        <Box bg="bg.lightGray" w="100%" p={{ base: "12px", md: "16px" }} borderRadius="12px">
                            <HStack justifyContent="space-between" w="100%" alignItems="flex-start" mb="3">
                                <Text fontSize="14px" fontWeight="600" color="text.secondary">
                                    <Trans>Получатель</Trans>
                                </Text>
                                <SignCircle signed={!!receiver?.signed} rejected={!!receiver?.rejected} />
                            </HStack>
                            <VStack align="start" gap="2">
                                <Text fontSize="13px" fontWeight="600">
                                    {receiver?.company?.idn} - {receiver?.company?.name}
                                </Text>
                                <Text fontSize="14px" fontWeight="400">
                                    {receiver?.user?.fullName}
                                </Text>
                                <HStack alignItems="center" fontSize="14px" fontWeight="400" gap="2">
                                    <Send color='blue' size={15} />
                                    <Text>{receiver?.user?.email}</Text>
                                </HStack>
                            </VStack>
                        </Box>
                    </Show>
                </VStack>
            </VStack>
            <Box w="100%" h="800px">
                <DocumentPreview.Root
                    files={contract?.files?.map(file => file.signedFile ? file.signedFile : file.file!) ?? []}
                    autoSelectFirst
                >
                    <DocumentPreview.PdfPreview />
                    <DocumentPreview.DocxPreview />
                    <DocumentPreview.ImagePreview />
                </DocumentPreview.Root>
            </Box>
        </VStack>
    )
}
