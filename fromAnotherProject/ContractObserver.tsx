import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogCloseTrigger,
  Box,
  Portal,
  Button,
  IconButton,
  createOverlay,
  Field,
  VStack,
  Text,
  HStack,
  Select,
  createListCollection,
  For,
  Show,
} from '@chakra-ui/react'
import { Trans } from '@lingui/react/macro'
import { X, User, Trash2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { components } from '@api/schema'
import { getContractFn, updateContractObserversFn } from '@features/document/functions'
import { getCompanyUsersListFn } from '@features/company/functions'

type Observer = { userId: string }
type CompanyUserItem = components['schemas']['CompanyUserResponse']

interface ContractObserverDialogProps {
  contractId: string
  companyId: string | null
  onOk: () => void
  onError: (error: Error) => void
}

const contractObserverOverlay = createOverlay<ContractObserverDialogProps>(({ contractId, companyId, onOk, onError, ...props }) => {
  const [observers, setObservers] = useState<Observer[]>([])

  const getContract = useServerFn(getContractFn)
  const getCompanyUsers = useServerFn(getCompanyUsersListFn)
  const updateObservers = useServerFn(updateContractObserversFn)

  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => getContract({ data: { id: contractId } }),
    select: (data) => data.contract,
    enabled: !!contractId,
  })

  const { data: users } = useQuery({
    queryKey: ['companyUsers', companyId],
    queryFn: () => getCompanyUsers({ data: { id: companyId as string } }),
    enabled: !!companyId,
  })

  const { mutateAsync: updateContractObservers, isPending } = useMutation({
    mutationKey: ['updateContractObservers'],
    mutationFn: updateObservers,
    onSuccess: () => {
      props.onOpenChange?.({ open: false })
      setObservers([])
      onOk()
    },
    onError: (error) => {
      onError(error as Error)
    }
  })

  useEffect(() => {
    const initialObservers = contract?.observers?.filter((observer) => !!observer.userId)
      .map((observer) => ({ userId: observer.userId! })) ?? []
    setObservers(initialObservers)
  }, [contract?.observers])

  const handleClose = useCallback(() => {
    props.onOpenChange?.({ open: false })
    setObservers([])
  }, [props])

  const handleSubmit = async () => {
    await updateContractObservers({
      data: {
        id: contractId,
        body: {
          observers: observers,
        }
      },
    })
  }

  const handleAddObserver = useCallback((userId: string | undefined) => {
    if (!userId) return
    const isAlreadyAdded = observers.some((observer) => observer.userId === userId)
    if (!isAlreadyAdded) {
      setObservers((prev) => [...prev, { userId }])
    }
  }, [observers])

  const handleRemoveObserver = useCallback((userId: string) => {
    setObservers((prev) => prev.filter((observer) => observer.userId !== userId))
  }, [])

  const usersCollection = createListCollection<CompanyUserItem>({
    items: users?.items ?? [],
    itemToValue: (user) => user.userId ?? '',
    itemToString: (user) => {
      const fullName = user.user?.fullName ?? ''
      const email = user.user?.email ?? ''
      return email ? `${fullName} (${email})` : fullName
    },
  })

  const getLabel = (userId: string) => {
    const user = users?.items?.find((u) => u.userId === userId)
    const fullName = user?.user?.fullName ?? ''
    const email = user?.user?.email ?? ''
    return email ? `${fullName} (${email})` : fullName
  }

  return (
    <Dialog.Root {...props}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="24px" maxW="500px">
            <Dialog.Header>
              <Dialog.Title fontSize={24} fontWeight={600}>
                <Trans>Смотрители</Trans>
              </Dialog.Title>
              <DialogCloseTrigger mr={4} mt={4} cursor="pointer" asChild onClick={handleClose}>
                <IconButton variant="ghost" size="sm" aria-label="Close">
                  <X size={20} />
                </IconButton>
              </DialogCloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap="24px" align="stretch">
                <Field.Root>
                  <Field.Label>
                    <Trans>Смотрители</Trans>
                  </Field.Label>
                  <Select.Root
                    collection={usersCollection}
                    onValueChange={({ value }) => handleAddObserver(value[0])}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Смотрители" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        <For each={usersCollection.items}>
                          {(user) => (
                            <Select.Item key={user.userId} item={user}>
                              {getLabel(user.userId ?? '')}
                              <Select.ItemIndicator />
                            </Select.Item>
                          )}
                        </For>
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>

                <Show when={!!observers.length}>
                  <VStack gap="8px" alignItems="stretch">
                    <Text fontSize="16px" fontWeight={600} color="text.primary">
                      <Trans>Уже добавлены</Trans>
                    </Text>
                    <VStack gap="8px" alignItems="stretch">
                      <For each={observers}>
                        {(observer) => (
                          <HStack
                            key={observer.userId}
                            gap="16px"
                            alignItems="center"
                            px="16px"
                            py="8px"
                            bg="bg.lightGray4"
                            borderRadius="16px"
                          >
                            <Box position="relative" w="32px" h="32px" display="flex" alignItems="center" justifyContent="center">
                              <Box w="32px" h="32px" bg="white" borderRadius="50%" display="flex" alignItems="center" justifyContent="center">
                                <User size={18} />
                              </Box>
                            </Box>
                            <Text flex="1" fontSize="14px" fontWeight={400} color="text.primary">
                              {getLabel(observer.userId)}
                            </Text>
                            <IconButton aria-label="remove" size="xs" variant="ghost" colorPalette="red" onClick={() => handleRemoveObserver(observer.userId)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </HStack>
                        )}
                      </For>
                    </VStack>
                  </VStack>
                </Show>

                <Box display="flex" gap="16px" justifyContent="flex-end" mt="10px">
                  <Button
                    type="button"
                    onClick={() => void handleSubmit()}
                    loading={isPending}
                    flex="1"
                    variant="primary"
                  >
                    <Trans>Сохранить</Trans>
                  </Button>
                  <Button type="button" variant="subtle" onClick={handleClose} disabled={isPending} flex="1">
                    <Trans>Отменить</Trans>
                  </Button>
                </Box>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})

export const ContractObserverDialog = contractObserverOverlay.Viewport

// eslint-disable-next-line react-refresh/only-export-components
export const changeContractObservers = (contractId: string, companyId: string | null) => {
  return new Promise<void>((resolve, reject) => {
    void contractObserverOverlay.open('contract-observer-dialog', {
      contractId,
      companyId,
      onOk: () => resolve(),
      onError: (error) => reject(error),
    })
  })
}
