import {
    Box,
    Button,
    Field,
    HStack,
    Input,
    IconButton,
    Portal,
    Select,
    Stack,
    Text,
    Textarea,
    createListCollection,
    Checkbox,
    Show, For,
} from '@chakra-ui/react';
import { Trans, useLingui } from "@lingui/react/macro";
import { useState, useCallback } from 'react';
import { DatepickerInput } from '@components/ui/datepicker-input';
import { PhoneInput } from '@components/ui/phone-input';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from "@tanstack/react-start";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { FileUpload } from '@features/common/FileUpload.tsx';
import { parseISO } from 'date-fns';
import { components } from '@api/schema';
import { X } from 'lucide-react';
import { ContractCompanySearch } from "@features/document/contract/ContractCompanySearch.tsx";
import { ContractUserSearch } from "@features/document/contract/ContractUserSearch.tsx";
import { getCurrencyListFn, getVatTypeListFn } from "@features/common/functions";
import { getCompanyUsersListFn } from "@features/company/functions";
import { useStore } from '@tanstack/react-form';
import { withForm, createFormOptions, initialSignerValues } from './form-context';

type FileResponse = components['schemas']['FileResponse']
type EVatType = components['schemas']['EVatType']

export const CreateContractForm = withForm({
    ...createFormOptions,
    render: function Render({ form }) {
        const { t } = useLingui();
        const router = useRouter();
        const company = useRouteContext({ select: ctx => ctx.company, from: '__root__' })
        const companyId = company?.id
        const [isShowAmountField, setIsShowAmountField] = useState(true);
        const [isIndefiniteTerm, setIsIndefiniteTerm] = useState(false);

        const values = useStore(form.store, (state) => state.values)

        const getCurrencyList = useServerFn(getCurrencyListFn);
        const getVatTypeList = useServerFn(getVatTypeListFn);
        const getCompanyUsersList = useServerFn(getCompanyUsersListFn);

        const { data: currencyList } = useQuery({
            queryKey: ['currencyList'],
            queryFn: () => getCurrencyList({ data: { rows: 1000 } })
        });

        const { data: vatTypeList } = useQuery({
            queryKey: ['vatTypeList'],
            queryFn: () => getVatTypeList()
        });

        const { data: companyUsers } = useQuery({
            queryKey: ['companyUsers', companyId],
            queryFn: () => getCompanyUsersList({ data: { id: companyId!, rows: 1000 } }),
            enabled: !!companyId
        });

        const vatTypeCollection = createListCollection({
            items: vatTypeList ?? [],
            itemToValue: (item) => item.id.toString(),
            itemToString: (item) => item.displayName!,
        });

        const currencyCollection = createListCollection({
            items: currencyList?.items ?? [],
            itemToValue: (item) => item.id,
            itemToString: (item) => item.name!,
        });

        const companyUsersCollection = createListCollection({
            items: companyUsers?.items ?? [],
            itemToValue: (item) => item.userId!,
            itemToString: (item) => item.user?.fullName ?? "",
        });

        const receiver = values.contract.signers.find((signer) => signer.companyId !== companyId);

        const handleUploadedFilesChange = useCallback((files: FileResponse[]) => {
            form.setFieldValue('files', files)
            form.setFieldValue('contract.files', files.map((file) => ({ fileId: file.id, isVisible: true, forSign: true })))
        }, [form])

        const handleRemoveFileById = useCallback((fileIdToRemove: string) => {
            form.setFieldValue('files', values.files.filter((item: FileResponse) => item.id !== fileIdToRemove))
            form.setFieldValue('contract.files', values.contract.files.filter((item) => item.fileId !== fileIdToRemove))
        }, [form, values.files, values.contract.files])

        const handleToggleForSignByIndex = useCallback((index: number, checked: boolean) => {
            const files = [...values.contract.files]
            if (files[index]) {
                files[index] = { ...files[index], forSign: checked }
                form.setFieldValue('contract.files', files)
            }
        }, [form, values.contract.files])

        const handleToggleIsVisibleByIndex = useCallback((index: number, checked: boolean) => {
            const files = [...values.contract.files]
            if (files[index]) {
                files[index] = { ...files[index], isVisible: checked }
                form.setFieldValue('contract.files', files)
            }
        }, [form, values.contract.files])

        const parseAdditionalData = useCallback((): Array<{ name: string; value: string }> => {
            const raw = values.contract.additionalData
            if (!raw) return []
            try {
                const parsed = JSON.parse(raw as unknown as string)
                if (Array.isArray(parsed)) {
                    return parsed.map((item) => ({ name: String(item?.name ?? ''), value: String(item?.value ?? '') }))
                }
                return []
            } catch {
                return []
            }
        }, [values.contract.additionalData])

        const handleAddAdditional = useCallback(() => {
            const arr = parseAdditionalData()
            arr.push({ name: '', value: '' })
            form.setFieldValue('contract.additionalData', JSON.stringify(arr))
        }, [parseAdditionalData, form])

        const handleChangeAdditional = useCallback((index: number, field: 'name' | 'value', val: string) => {
            const arr = parseAdditionalData()
            const existing = arr[index] ?? { name: '', value: '' }
            arr[index] = { ...existing, [field]: val } as { name: string; value: string }
            form.setFieldValue('contract.additionalData', arr.length ? JSON.stringify(arr) : null)
        }, [parseAdditionalData, form])

        const handleRemoveAdditional = useCallback((index: number) => {
            const arr = parseAdditionalData()
            if (index < 0 || index >= arr.length) return
            arr.splice(index, 1)
            form.setFieldValue('contract.additionalData', arr.length ? JSON.stringify(arr) : null)
        }, [parseAdditionalData, form])

        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    void form.handleSubmit()
                }}
            >
                <Stack gap={6} bg="transparent" borderRadius="24px" w="100%" maxW={900}>
                    <ContractCompanySearch
                        signer={receiver}
                        onSignerChange={(signer) => {
                            form.setFieldValue('contract.signers', values.contract.signers
                                .filter((item) => item.companyId === companyId)
                                .concat([signer])
                            )
                        }}
                    />
                    <Show when={receiver?.companyId || (receiver?.companyName && receiver?.idn)}>
                        <Box bg="white" height="auto" borderRadius="24px" p={{ base: "16px", md: "20px" }}>
                            <ContractUserSearch
                                signer={receiver}
                                onSignerChange={(signer) => {
                                    form.setFieldValue('contract.signers', values.contract.signers
                                        .filter((item) => item.companyId === companyId)
                                        .concat([signer])
                                    )
                                }}
                            />
                        </Box>
                    </Show>

                    <Box bg="white" height="auto" borderRadius="24px" p={{ base: "16px", md: "24px" }}>
                        <Box mb={6}>
                            <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
                                <Trans>Содержание договора</Trans>
                            </Text>

                            <HStack mb="12px">
                                <form.Field name="contract.name">
                                    {(field) => (
                                        <Field.Root required invalid={!!field.state.meta.errors.length}>
                                            <Field.Label>
                                                <Trans>Предмет договора</Trans>
                                                <Field.RequiredIndicator />
                                            </Field.Label>
                                            <Input
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                placeholder={t`Введите наименование`}
                                            />
                                            <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                        </Field.Root>
                                    )}
                                </form.Field>

                                <form.Field name="contract.registrationNumber">
                                    {(field) => (
                                        <Field.Root required invalid={!!field.state.meta.errors.length}>
                                            <Field.Label>
                                                <Trans>Регистрационный номер</Trans>
                                                <Field.RequiredIndicator />
                                            </Field.Label>
                                            <Input
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                placeholder={t`Введите номер регистрации`}
                                            />
                                            <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                        </Field.Root>
                                    )}
                                </form.Field>
                            </HStack>

                            <form.Field name="contract.description">
                                {(field) => (
                                    <Field.Root mb="12px" invalid={!!field.state.meta.errors.length}>
                                        <Field.Label>
                                            <Trans>Краткое содержание</Trans>
                                        </Field.Label>
                                        <Textarea
                                            value={field.state.value ?? ''}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            onBlur={field.handleBlur}
                                            placeholder={t`Введите краткое содержание договора`}
                                            minH={128}
                                        />
                                        <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                    </Field.Root>
                                )}
                            </form.Field>
                        </Box>

                        <Box mb={6}>
                            <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
                                <Trans>Сумма договора</Trans>
                            </Text>

                            <Box display="flex" gap="16px" mb="24px" fontSize="12px" fontWeight="400">
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    width="124px"
                                    height="36px"
                                    borderRadius="30px"
                                    bg={isShowAmountField ? "bg.contrast" : "bg.lightGray4"}
                                    color={isShowAmountField ? "white" : "text.dark"}
                                    cursor="pointer"
                                    onClick={setIsShowAmountField.bind(null, true)}
                                >
                                    <Trans>Указать сумму</Trans>
                                </Box>
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    width="160px"
                                    height="36px"
                                    borderRadius="30px"
                                    bg={isShowAmountField ? "bg.lightGray4" : "bg.contrast"}
                                    color={isShowAmountField ? "text.dark" : "white"}
                                    cursor="pointer"
                                    onClick={setIsShowAmountField.bind(null, false)}
                                >
                                    <Trans>Не указывать сумму</Trans>
                                </Box>
                            </Box>

                            <Show when={isShowAmountField}>
                                <HStack mb="12px">
                                    <form.Field name="contract.amount">
                                        {(field) => (
                                            <Field.Root invalid={!!field.state.meta.errors.length}>
                                                <Field.Label>
                                                    <Trans>Сумма</Trans>
                                                </Field.Label>
                                                <Input
                                                    value={field.state.value != null ? String(field.state.value) : ''}
                                                    onChange={(e) => field.handleChange(e.target.value === '' ? null : Number(e.target.value))}
                                                    onBlur={field.handleBlur}
                                                    placeholder={t`Введите сумму`}
                                                />
                                                <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                            </Field.Root>
                                        )}
                                    </form.Field>

                                    <form.Field name="contract.currencyId">
                                        {(field) => (
                                            <Field.Root invalid={!!field.state.meta.errors.length}>
                                                <Field.Label>
                                                    <Trans>Валюта</Trans>
                                                </Field.Label>
                                                <Select.Root
                                                    collection={currencyCollection}
                                                    value={field.state.value ? [field.state.value] : undefined}
                                                    onValueChange={({ value }) => field.handleChange(value[0] ?? null)}
                                                >
                                                    <Select.HiddenSelect />
                                                    <Select.Control>
                                                        <Select.Trigger>
                                                            <Select.ValueText placeholder={t`Выберите валюту`} />
                                                        </Select.Trigger>
                                                        <Select.IndicatorGroup>
                                                            <Select.Indicator />
                                                        </Select.IndicatorGroup>
                                                    </Select.Control>
                                                    <Portal>
                                                        <Select.Positioner>
                                                            <Select.Content>
                                                                <For each={currencyCollection.items}>
                                                                    {(currency) => (
                                                                        <Select.Item key={currency.id} item={currency}>
                                                                            {currency.name}
                                                                            <Select.ItemIndicator />
                                                                        </Select.Item>
                                                                    )}
                                                                </For>
                                                            </Select.Content>
                                                        </Select.Positioner>
                                                    </Portal>
                                                </Select.Root>
                                                <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                            </Field.Root>
                                        )}
                                    </form.Field>
                                </HStack>

                                <HStack>
                                    <Field.Root>
                                        <Field.Label>
                                            <Trans>% аванса (если есть)</Trans>
                                        </Field.Label>
                                        <Input placeholder={t`Введите процент аванса`} />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>
                                            <Trans>Сумма аванса</Trans>
                                        </Field.Label>
                                        <Input placeholder={t`Сумма аванса (укажите % аванса)`} />
                                    </Field.Root>
                                </HStack>
                            </Show>
                        </Box>

                        <Box mb={6}>
                            <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
                                <Trans>Вид НДС</Trans>
                            </Text>

                            <Box display="flex" flexWrap="wrap" gap="8px" mb="24px" maxW="100%">
                                <For each={vatTypeCollection.items}>
                                    {(item) => (
                                        <Box
                                            key={item.id}
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                            height="36px"
                                            px="12px"
                                            borderRadius="30px"
                                            bg={(values.contract.vatTypeId?.toString?.() ?? '') === item.id.toString() ? "bg.contrast" : "bg.lightGray4"}
                                            color={(values.contract.vatTypeId?.toString?.() ?? '') === item.id.toString() ? "white" : "text.dark"}
                                            cursor="pointer"
                                            whiteSpace="nowrap"
                                            flexShrink={0}
                                            minW="fit-content"
                                            onClick={() => form.setFieldValue('contract.vatTypeId', +item.id as EVatType)}
                                            transition="all 0.2s"
                                            _hover={{
                                                bg: (values.contract.vatTypeId?.toString?.() ?? '') === item.id.toString() ? "bg.contrast" : "bg.lightGray3"
                                            }}
                                        >
                                            <Text fontSize="14px" fontWeight="400">
                                                {item.displayName}
                                            </Text>
                                        </Box>
                                    )}
                                </For>
                            </Box>

                            <HStack>
                                <Field.Root>
                                    <Field.Label>
                                        <Trans>Порядок оплаты</Trans>
                                    </Field.Label>
                                    <Input placeholder={t`Выберите порядок оплаты`} />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>
                                        <Trans>Вид поставки</Trans>
                                    </Field.Label>
                                    <Input placeholder={t`Выберите вид поставки`} />
                                </Field.Root>
                            </HStack>
                        </Box>

                        <Box>
                            <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
                                <Trans>Срок действия договора</Trans>
                            </Text>

                            <HStack mb="12px">
                                <form.Field name="contract.startDate">
                                    {(field) => (
                                        <Field.Root invalid={!!field.state.meta.errors.length}>
                                            <Field.Label>
                                                <Trans>Начало с</Trans>
                                            </Field.Label>
                                            <DatepickerInput
                                                dateFormat="dd.MM.yyyy"
                                                selected={field.state.value ? parseISO(field.state.value) ?? null : null}
                                                onChange={(date) => field.handleChange(date ? date.toISOString() : null)}
                                                inputProps={{ placeholder: t`Выберите дату начала` }}
                                            />
                                            <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                        </Field.Root>
                                    )}
                                </form.Field>

                                <form.Field name="contract.endDate">
                                    {(field) => (
                                        <Field.Root invalid={!!field.state.meta.errors.length} disabled={isIndefiniteTerm}>
                                            <Field.Label>
                                                <Trans>Завершение</Trans>
                                            </Field.Label>
                                            <DatepickerInput
                                                dateFormat="dd.MM.yyyy"
                                                disabled={isIndefiniteTerm}
                                                selected={field.state.value ? parseISO(field.state.value) ?? null : null}
                                                onChange={(date) => field.handleChange(date ? date.toISOString() : null)}
                                                inputProps={{ placeholder: t`Выберите дату завершения`, disabled: isIndefiniteTerm }}
                                            />
                                            <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                        </Field.Root>
                                    )}
                                </form.Field>
                            </HStack>

                            <HStack>
                                <Checkbox.Root
                                    checked={isIndefiniteTerm}
                                    onCheckedChange={({ checked }) => {
                                        const next = !!checked
                                        setIsIndefiniteTerm(next)
                                        if (next) {
                                            form.setFieldValue('contract.endDate', null)
                                        }
                                    }}
                                >
                                    <Checkbox.HiddenInput />
                                    <HStack gap={2} cursor="pointer">
                                        <Checkbox.Control />
                                        <Checkbox.Label>
                                            <Text fontSize="sm" color="gray.600">
                                                <Trans>Бессрочный</Trans>
                                            </Text>
                                        </Checkbox.Label>
                                    </HStack>
                                </Checkbox.Root>
                            </HStack>
                        </Box>
                    </Box>

                    <Box bg="white" height="auto" borderRadius="24px" p={{ base: "16px", md: "24px" }}>
                        <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
                            <Trans>Дополнительные данные</Trans>
                        </Text>
                        <Text fontSize="14" color="gray.600" mb="12px">
                            <Trans>Если нужно, внесите сюда дополнительные сведения</Trans>
                        </Text>

                        <For each={parseAdditionalData()}>
                            {(pair, idx) => (
                                <HStack key={idx} mb="8px" alignItems="flex-end">
                                    <Field.Root>
                                        <Field.Label>
                                            <Trans>Наименование</Trans>
                                        </Field.Label>
                                        <Input
                                            placeholder=" "
                                            value={pair.name}
                                            onChange={(e) => handleChangeAdditional(idx, 'name', e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>
                                            <Trans>Значение</Trans>
                                        </Field.Label>
                                        <Input
                                            placeholder=" "
                                            value={pair.value}
                                            onChange={(e) => handleChangeAdditional(idx, 'value', e.target.value)}
                                        />
                                    </Field.Root>

                                    <IconButton
                                        aria-label={t`Удалить`}
                                        variant="ghost"
                                        colorScheme="red"
                                        onClick={() => handleRemoveAdditional(idx)}
                                        mt="28px"
                                    >
                                        <X size={16} />
                                    </IconButton>
                                </HStack>
                            )}
                        </For>

                        <Button variant="outline" colorScheme="blue" mb={6} onClick={handleAddAdditional}>
                            <Trans>Добавить</Trans>
                        </Button>

                        <Text fontSize="14px" fontWeight="600" color="gray.800" mb="12px">
                            <Trans>Файлы</Trans>
                        </Text>
                        <Box fontSize="12px" fontWeight="400">
                            <Text><Trans>Загрузите файл для подписания в формате pdf размером не более 30 мб</Trans></Text>
                            <Text><Trans>Файлы для ознакомления могут быть в форматах jpg, jpeg, png, doc, docx, xlsx, pdf</Trans></Text>
                        </Box>

                        <form.Field name="contract.files">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length}>
                                    <FileUpload.Root
                                        accept={[".webp", ".webp", ".webp", ".doc", ".docx", ".xlsx", ".pdf"]}
                                        maxFileSize={30_000_000}
                                        files={values.files}
                                        onFilesChange={handleUploadedFilesChange}
                                    >
                                        <FileUpload.FileList>
                                            <For each={values.files}>
                                                {(file: FileResponse, index: number) => (
                                                    <FileUpload.FileItem key={file.id}>
                                                        <FileUpload.FileName>{file.name}</FileUpload.FileName>
                                                        <FileUpload.ActionBlock>
                                                            <FileUpload.Checkbox
                                                                label={t`Требует подписания`}
                                                                checked={!!values.contract.files?.[index]?.forSign}
                                                                onChange={(checked) => handleToggleForSignByIndex(index, checked)}
                                                            />
                                                            <FileUpload.Checkbox
                                                                label={t`Виден получателю`}
                                                                checked={!!values.contract.files?.[index]?.isVisible}
                                                                onChange={(checked) => handleToggleIsVisibleByIndex(index, checked)}
                                                            />
                                                        </FileUpload.ActionBlock>
                                                        <FileUpload.DeleteButton onClick={() => handleRemoveFileById(file.id)} />
                                                    </FileUpload.FileItem>
                                                )}
                                            </For>
                                        </FileUpload.FileList>
                                        <FileUpload.AttachButton>
                                            <Trans>Прикрепить</Trans>
                                        </FileUpload.AttachButton>
                                    </FileUpload.Root>
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>
                    </Box>

                    <Box bg="white" height="auto" borderRadius="24px" p={{ base: "16px", md: "24px" }}>
                        <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
                            <Trans>Подписанты</Trans>
                        </Text>

                        <HStack mb="12px">
                            <form.Field name="contract.signers">
                                {(field) => (
                                    <Field.Root required invalid={!!field.state.meta.errors.length}>
                                        <Field.Label>
                                            <Trans>От отправителя</Trans>
                                            <Field.RequiredIndicator />
                                        </Field.Label>
                                        <Select.Root
                                            collection={companyUsersCollection}
                                            multiple
                                            value={values.contract.signers
                                                .filter((signer) => signer.companyId === companyId)
                                                .map((signer) => signer.userId!)
                                            }
                                            onValueChange={(value) => {
                                                field.handleChange([
                                                    ...values.contract.signers.filter((signer) => signer.companyId !== companyId),
                                                    ...value.items.map((user) => ({
                                                        ...initialSignerValues,
                                                        userId: user.userId,
                                                        companyId: companyId ?? null,
                                                    })),
                                                ]);
                                            }}
                                        >
                                            <Select.HiddenSelect />
                                            <Select.Control>
                                                <Select.Trigger>
                                                    <Select.ValueText placeholder={t`Выберите подписанта от отправителя`} />
                                                </Select.Trigger>
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>
                                            </Select.Control>
                                            <Portal>
                                                <Select.Positioner>
                                                    <Select.Content>
                                                        <For each={companyUsersCollection.items}>
                                                            {(user) => (
                                                                <Select.Item key={user.id} item={user}>
                                                                    {user.user?.fullName ?? ""}
                                                                    <Select.ItemIndicator />
                                                                </Select.Item>
                                                            )}
                                                        </For>
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Portal>
                                        </Select.Root>
                                        <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                    </Field.Root>
                                )}
                            </form.Field>

                            <form.Field name="contract.approvers">
                                {(field) => (
                                    <Field.Root invalid={!!field.state.meta.errors.length}>
                                        <Field.Label>
                                            <Trans>Согласующие</Trans>
                                        </Field.Label>
                                        <Select.Root
                                            multiple
                                            collection={companyUsersCollection}
                                            value={(field.state.value?.map(approver => approver.userId) || [])}
                                            onValueChange={({ value }) => {
                                                field.handleChange(value.map((userId) => ({ userId })))
                                            }}
                                        >
                                            <Select.HiddenSelect />
                                            <Select.Control>
                                                <Select.Trigger>
                                                    <Select.ValueText placeholder={t`Выберите согласующих`} />
                                                </Select.Trigger>
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>
                                            </Select.Control>
                                            <Portal>
                                                <Select.Positioner>
                                                    <Select.Content>
                                                        <For each={companyUsersCollection.items}>
                                                            {(user) => (
                                                                <Select.Item key={user.id} item={user}>
                                                                    {user.user?.fullName ?? ""}
                                                                    <Select.ItemIndicator />
                                                                </Select.Item>
                                                            )}
                                                        </For>
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Portal>
                                        </Select.Root>
                                        <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                    </Field.Root>
                                )}
                            </form.Field>
                        </HStack>

                        <form.Field name="contract.observers">
                            {(field) => (
                                <Field.Root display="flex" flexDirection="row" gap="16px" invalid={!!field.state.meta.errors.length}>
                                    <Box width="50%">
                                        <Field.Label>
                                            <Trans>Смотрители</Trans>
                                        </Field.Label>
                                        <Select.Root
                                            collection={companyUsersCollection}
                                            multiple
                                            value={field.state.value?.map((observer) => observer.userId) || []}
                                            onValueChange={({ value }) => {
                                                field.handleChange(value.map((userId) => ({ userId })))
                                            }}
                                        >
                                            <Select.HiddenSelect />
                                            <Select.Control>
                                                <Select.Trigger>
                                                    <Select.ValueText placeholder={t`Выберите смотрителей`} />
                                                </Select.Trigger>
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>
                                            </Select.Control>
                                            <Portal>
                                                <Select.Positioner>
                                                    <Select.Content>
                                                        <For each={companyUsersCollection.items}>
                                                            {(user) => (
                                                                <Select.Item key={user.id} item={user}>
                                                                    {user.user?.fullName ?? ""}
                                                                    <Select.ItemIndicator />
                                                                </Select.Item>
                                                            )}
                                                        </For>
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Portal>
                                        </Select.Root>
                                        <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                    </Box>
                                </Field.Root>
                            )}
                        </form.Field>
                    </Box>

                    <Box bg="white" height="auto" borderRadius="24px" p={{ base: "16px", md: "24px" }}>
                        <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
                            <Trans>Контактные данные автора</Trans>
                        </Text>

                        <Field.Root mb="12px">
                            <Field.Label>
                                <Trans>ФИО</Trans>
                            </Field.Label>
                            <Input placeholder={t`Введите ФИО`} />
                        </Field.Root>

                        <HStack mb="12px">
                            <Field.Root>
                                <Field.Label>
                                    <Trans>Телефон</Trans>
                                </Field.Label>
                                <PhoneInput defaultCountry="uz" />
                            </Field.Root>

                            <Field.Root>
                                <Field.Label>
                                    <Trans>Электронная почта</Trans>
                                </Field.Label>
                                <Input placeholder={t`mail@mail.ru`} />
                            </Field.Root>
                        </HStack>

                        <form.Subscribe selector={(state) => [state.isSubmitting]}>
                            {([isSubmitting]) => (
                                <Box display="flex" justifyContent="flex-end" gap="10px" pt="32px">
                                    <Button type="button" variant="secondary" colorScheme="blue" onClick={() => router.history.back()} disabled={isSubmitting}>
                                        <Trans>Отменить</Trans>
                                    </Button>
                                    <Button type="submit" colorScheme="blue" loading={isSubmitting} disabled={isSubmitting}>
                                        <Trans>Сохранить</Trans>
                                    </Button>
                                </Box>
                            )}
                        </form.Subscribe>
                    </Box>
                </Stack>
            </form>
        );
    }
})