import { useCallback, useState } from 'react'
import {
  Dialog,
  DialogCloseTrigger,
  Box,
  Portal,
  Button,
  Textarea,
  IconButton,
  createOverlay,
  Field,
  VStack,
  Text,
  Show,
} from '@chakra-ui/react'
import { Trans, useLingui } from '@lingui/react/macro'
import { X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from '@tanstack/react-form'
import { components } from '@api/schema'
import { FileUpload } from '@features/common/FileUpload'
import { updateContractApproverFn } from '@features/document/functions'
import * as v from 'valibot';

type FileResponse = components['schemas']['FileResponse']

interface ContractApproverDialogProps {
  contractId: string
  isApproved: boolean
  onOk: () => void
  onError: (error: Error) => void
}

const schema = v.object({
  comment: v.nullable(v.string()),
  fileId: v.nullable(v.string()),
})

const contractApproverOverlay = createOverlay<ContractApproverDialogProps>(({ contractId, isApproved, onOk, onError, ...props }) => {
  const updateApprover = useServerFn(updateContractApproverFn)
  const { t } = useLingui()
  const [file, setFile] = useState<FileResponse | null>(null)

  const { mutateAsync: updateContractApprover } = useMutation({
    mutationKey: ['updateContractApprover'],
    mutationFn: updateApprover,
    onSuccess: () => {
      props.onOpenChange?.({ open: false })
      form.reset()
      setFile(null)
      onOk()
    },
    onError: (error) => {
      onError(error as Error)
    }
  })

  const form = useForm({
    defaultValues: {
      fileId: null,
      comment: null,
    } as v.InferOutput<typeof schema>,
    validators: {
      onSubmit: schema
    },
    onSubmit: async ({ value }) => {
      await updateContractApprover({
        data: {
          id: contractId,
          body: {
            isApproved,
            ...value
          }
        },
      })
    }
  })

  const handleFilesChange = useCallback((files: FileResponse[]) => {
    const newFile = files.length > 0 ? files[0] : null
    setFile(newFile)
  }, [])

  const handleFileDelete = useCallback(() => {
    setFile(null)
  }, [])

  const handleClose = useCallback(() => {
    props.onOpenChange?.({ open: false })
    form.reset()
    setFile(null)
  }, [props, form])

  const handleSubmit = () => {
    void form.handleSubmit()
  }

  return (
    <Dialog.Root {...props}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="24px" maxW="500px">
            <Dialog.Header>
              <Dialog.Title fontSize={24} fontWeight={600}>
                {isApproved ? <Trans>Согласование</Trans> : <Trans>Укажите причину</Trans>}
              </Dialog.Title>
              <DialogCloseTrigger mr={4} mt={4} cursor="pointer" asChild onClick={handleClose}>
                <IconButton variant="ghost" size="sm" aria-label="Close">
                  <X size={20} />
                </IconButton>
              </DialogCloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSubmit()
                  }}
              >
                <VStack gap="24px" align="stretch">
                  <form.Field name="comment">
                    {(field) => (
                      <Field.Root invalid={!!field.state.meta.errors.length} required={!isApproved}>
                        <Field.Label>
                          <Trans>Комментарий</Trans>
                          <Show when={!isApproved}>
                            <Field.RequiredIndicator />
                          </Show>
                        </Field.Label>
                        <Textarea
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder={isApproved ? t`Комментарий (необязательно)` : t`Причина отклонения`}
                          h="128px"
                          bg="bg.lightGray5"
                          borderRadius="16px"
                        />
                        <Field.ErrorText>
                          {field.state.meta.errors[0]?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    )}
                  </form.Field>

                  <FileUpload.Root
                    files={file ? [file] : []}
                    onFilesChange={handleFilesChange}
                    accept={['.doc', '.docx', '.pdf']}
                    maxFiles={1}
                    maxFileSize={30 * 1024 * 1024}
                  >
                    <VStack gap="12px" alignItems="stretch">
                      <Text fontSize="14px" fontWeight="400" lineHeight="18px" color="text.primary" px="16px">
                        <Trans>При необходимости прикрепите файл в формате doc, docx, pdf размером не более 30 Мб</Trans>
                      </Text>
                      <Show when={!!file}>
                        <FileUpload.FileList>
                          <FileUpload.FileItem key={file?.id}>
                            <FileUpload.FileName>{file?.name}</FileUpload.FileName>
                            <FileUpload.DeleteButton onClick={handleFileDelete} />
                          </FileUpload.FileItem>
                        </FileUpload.FileList>
                      </Show>
                      <FileUpload.AttachButton>Прикрепить</FileUpload.AttachButton>
                    </VStack>
                  </FileUpload.Root>

                  <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                      <Box display="flex" gap="16px" justifyContent="flex-end" mt="10px">
                        <Button
                          type="submit"
                          loading={isSubmitting}
                          loadingText={isApproved ? <Trans>Согласование...</Trans> : <Trans>Отклонение...</Trans>}
                          flex="1"
                          variant={isApproved ? 'positive' : 'primary'}
                        >
                          {isApproved ? <Trans>Согласовать</Trans> : <Trans>Отклонить</Trans>}
                        </Button>
                        <Button type="button" variant="subtle" onClick={handleClose} disabled={isSubmitting} flex="1">
                          <Trans>Отменить</Trans>
                        </Button>
                      </Box>
                    )}
                  </form.Subscribe>
                </VStack>
              </form>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})

export const ContractApproverDialog = contractApproverOverlay.Viewport

// eslint-disable-next-line react-refresh/only-export-components
export const approveContract = (contractId: string, isApproved: boolean) => {
  return new Promise<void>((resolve, reject) => {
    void contractApproverOverlay.open('contract-approver-dialog', {
      contractId,
      isApproved,
      onOk: () => resolve(),
      onError: (error) => reject(error),
    })
  })
}
