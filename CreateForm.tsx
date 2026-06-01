import {createFormOptions, withForm} from "@features/bank/form-context.ts";
import {Stack} from "@chakra-ui/react";
import {useStore} from "@tanstack/react-form";
import {Trans, useLingui} from "@lingui/react/macro";
import {getFieldError, normalizeAccountNumber} from "@features/bank/form-context.ts";

const CreateForm = withForm({
    ...createFormOptions,
    props: {},
    render: function Render({ form }) {
        const { t } = useLingui()
        const extra = useStore(form.store, (state) => state.values.extra)

        return (
            <>
                <Stack w="full" direction={{ base: 'column', xl: 'row' }} gap={{ base: 2, xl: 4 }} alignItems="flex-start">
                    <form.AppField name="bank.bankId">
                        {(field) => (
                            <field.BankCodeField
                                invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                                error={field.state.meta.errors[0]?.message}
                                label={t`Введите МФО/BIC/SWIFT для поиска банка`}
                                required
                                inputValue={extra.bankCodeInput}
                                setInputValue={(value) => form.setFieldValue('extra.bankCodeInput', value)}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name="bank.bankId">
                        {(field) => (
                            <field.BankNameField
                                invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                                error={field.state.meta.errors[0]?.message}
                                label={t`Наименование банка`}
                                required
                                inputValue={extra.bankNameInput}
                                setInputValue={(value) => form.setFieldValue('extra.bankNameInput', value)}
                            />
                        )}
                    </form.AppField>
                </Stack>
                <Stack w="full" direction={{ base: 'column', xl: 'row' }} gap={{ base: 2, xl: 4 }} alignItems="flex-start">
                    <form.AppField name="bank.number" key={extra.bankIsResident === true ? 'resident' : 'non-resident'}>
                        {(field) => (
                            <field.TextField
                                invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                                error={getFieldError(field.state.meta.errors[0])}
                                label={t`Номер счета/IBAN`}
                                mask={extra.bankIsResident === true ? '99999 999 9 99999999 999' : undefined}
                                maxLength={extra.bankIsResident !== true ? 34 : undefined}
                                normalize={extra.bankIsResident !== true ? normalizeAccountNumber : undefined}
                                required
                            />
                        )}
                    </form.AppField>
                    <form.AppField name="bank.currencyId">
                        {(field) => (
                            <field.BankCurrencyField
                                invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                                error={field.state.meta.errors[0]?.message}
                                label={t`Валюта`}
                                required
                            />
                        )}
                    </form.AppField>
                </Stack>
                <form.AppField name="bank.isMain">
                    {(field) => (
                        <field.CheckboxField
                            label={<Trans>Основной счёт</Trans>}
                            hint={t`Первый добавленный счет автоматически становится основным.`}
                        />
                    )}
                </form.AppField>
            </>
        )
    }
})

export default CreateForm