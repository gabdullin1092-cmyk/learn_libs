import { useState } from 'react'
import {
    Button,
    Checkbox,
    CloseButton,
    createOverlay,
    Dialog,
    Portal,
    Show,
    Text,
    VStack,
} from '@chakra-ui/react'
import { Trans } from '@lingui/react/macro'

interface SubcontractNoticeDialogProps {
    onConfirm: () => void
}

const subcontractNoticeOverlay = createOverlay<SubcontractNoticeDialogProps>(({ onConfirm, ...props }) => {
    const [isChecked, setIsChecked] = useState(false)
    const [showError, setShowError] = useState(false)

    const handleConfirm = () => {
        if (!isChecked) {
            setShowError(true)
            return
        }
        setShowError(false)
        props.onOpenChange?.({ open: false })
        onConfirm()
    }

    const handleAttemptClose = () => {
        setShowError(true)
    }

    return (
        <Dialog.Root
            {...props}
            placement="center"
            closeOnInteractOutside={false}
            closeOnEscape={false}
        >
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(16px)" bg="blackAlpha.400" />
                <Dialog.Positioner>
                    <Dialog.Content maxW="454px" borderRadius="24px" pb="24px">
                        <Dialog.Header>
                            <Dialog.Title>
                                <Trans>Ознакомление</Trans>
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body pt={0} pb={0}>
                            <VStack align="stretch" gap={0}>
                                <Text fontSize="16px" fontWeight={400} color="text.primary">
                                    <Trans>
                                        Внимание! Сообщаем, что при подписании через ЭЦП подписывается одновременно 2 (два) документа:
                                    </Trans>
                                </Text>
                                <VStack align="start" gap={0} mt="24px">
                                    <Text fontSize="14px" lineHeight="18px" fontWeight={600} color="text.primary">
                                        <Trans>1. Договор подряда;</Trans>
                                    </Text>
                                    <Text fontSize="14px" lineHeight="18px" fontWeight={600} color="text.primary">
                                        <Trans>2. Соглашение о возмещении генподрядных затрат.</Trans>
                                    </Text>
                                </VStack>
                                <Checkbox.Root
                                    mt="24px"
                                    checked={isChecked}
                                    onCheckedChange={(details) => {
                                        setIsChecked(!!details.checked)
                                        if (details.checked) setShowError(false)
                                    }}
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label fontSize="14px" color="text.primary">
                                        <Trans>Я ознакомлен</Trans>
                                    </Checkbox.Label>
                                </Checkbox.Root>
                                <Show when={showError}>
                                    <Text fontSize="13px" color="text.negative" mt="4px">
                                        <Trans>Для доступа к договору необходимо подтвердить ознакомление</Trans>
                                    </Text>
                                </Show>
                                <Button mt="24px" w="full" onClick={handleConfirm} disabled={!isChecked}>
                                    <Trans>Подтвердить</Trans>
                                </Button>
                            </VStack>
                        </Dialog.Body>
                        <CloseButton
                            position="absolute"
                            top="16px"
                            right="16px"
                            size="lg"
                            color="bg.secondary"
                            onClick={handleAttemptClose}
                        />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
})

export const SubcontractNoticeDialogViewport = subcontractNoticeOverlay.Viewport

// eslint-disable-next-line react-refresh/only-export-components
export const showSubcontractNotice = () => {
    return new Promise<void>((resolve) => {
        void subcontractNoticeOverlay.open('subcontract-notice-dialog', {
            onConfirm: () => resolve(),
        })
    })
}