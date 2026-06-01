import {
    FC,
    useState,
    useEffect
} from 'react';
import {
    Card,
    Field,
    Input,
    Button,
    Text,
    VStack,
    HStack,
    Checkbox,
    IconButton,
    Image,
    Center,
    PinInput,
    Show,
    createListCollection,
    Portal,
    Combobox,
    For,
    usePrevious
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import {PasswordInput} from "@components/ui/password-input.tsx";
import logo from "@assets/icons/logo.svg"
import {PhoneInput} from "@components/ui/phone-input.tsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {useForm, useStore} from "@tanstack/react-form";
import * as v from 'valibot';
import {Link, useNavigate} from "@tanstack/react-router";
import {toaster} from "@components/ui/toaster.tsx";
import {Trans, useLingui} from "@lingui/react/macro";
import {useInterval, useCounter} from "usehooks-ts";
import {metaPixel} from "@analytics/metaPixel.ts";
import { sendEmailVerificationFn, getCountryListFn, validateIdnFn } from "@features/common/functions";
import { createUserFn, validateUserFn } from "@features/user/functions";
import { vName, vPassword, vPhone } from "@common/valibotSchemas";
import { withMask } from "use-mask-input";
import { numericToAlpha2 } from "@common/countryUtils";
import {components} from "@api/schema.ts";

type ECreateUserValidationFieldType = components["schemas"]["ECreateUserValidationFieldType"]

enum Step {
    Info,
    Code
}

const values = {
    verificationCode: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    middleName: null as string | null,
    idn: '',
    countryId: '',
    isAgreeWithPrivacyPolicy: false
}

type SignUpFormValues = { step: Step; values: typeof values }


const idnCountryConfig: Partial<Record<string, { mask: string; label: string }>> = {
    UZ: { mask: '9 999999 999 999 9', label: 'ПИНФЛ' },
    KZ: { mask: '999999999999', label: 'ИИН' },
}

export const SignUpForm: FC = () => {
    const { t } = useLingui()
    const navigate = useNavigate()
    const [codeValue, setCodeValue] = useState(['', '', '', '', '', ''])
    const [countryInputValue, setCountryInputValue] = useState('')

    const signUpSchema = v.lazyAsync((input) => {
        const { step } = input as SignUpFormValues

        if (step === Step.Code) {
            return v.objectAsync({
                step: v.number(),
                values: v.object({
                    verificationCode: v.pipe(v.string(), v.minLength(6, 'Код подтверждения обязателен')),
                    email: v.string(),
                    password: v.string(),
                    confirmPassword: v.string(),
                    phoneNumber: v.string(),
                    firstName: v.string(),
                    lastName: v.string(),
                    middleName: v.nullable(v.string()),
                    idn: v.string(),
                    countryId: v.string(),
                    isAgreeWithPrivacyPolicy: v.boolean(),
                })
            })
        }

        return v.objectAsync({
            step: v.number(),
            values: v.pipeAsync(
                v.objectAsync({
                    verificationCode: v.string(),
                    email: v.pipeAsync(
                        v.string(),
                        v.minLength(1, 'Email обязателен'),
                        v.email('Введите корректный email'),
                        v.rawCheckAsync<string>(async ({ dataset, addIssue }) => {
                            if (!dataset.value) return
                            try {
                                await validateFieldOnServer(10, dataset.value as string)
                            } catch (error) {
                                addIssue({ message: error instanceof Error ? error.message : t`Ошибка валидации` })
                            }
                        })
                    ),
                    password: vPassword(),
                    confirmPassword: v.pipe(
                        v.string(),
                        v.minLength(1, 'Подтверждение пароля обязательно'),
                        v.maxLength(300, 'Пароль не должен превышать 300 символов'),
                    ),
                    phoneNumber: v.pipeAsync(
                        vPhone('Невалидный номер телефона'),
                        v.rawCheckAsync<string>(async ({ dataset, addIssue }) => {
                            if (!dataset.value) return
                            try {
                                await validateFieldOnServer(20, dataset.value as string)
                            } catch (error) {
                                addIssue({ message: error instanceof Error ? error.message : t`Ошибка валидации` })
                            }
                        })
                    ),
                    firstName: v.pipe(
                        vName(),
                        v.minLength(1, 'Имя обязательно'),
                        v.minLength(2, 'Имя должно содержать минимум 2 символа'),
                    ),
                    lastName: v.pipe(
                        vName(),
                        v.minLength(1, 'Фамилия обязательна'),
                        v.minLength(2, 'Фамилия должна содержать минимум 2 символа'),
                    ),
                    middleName: v.nullable(vName()),
                    idn: v.pipeAsync(
                        v.string(),
                        v.rawCheckAsync<string>(async ({ dataset, addIssue }) => {
                            if (!dataset.value) return
                            if (!sourceCode) return
                            const result = await validateIdnMutate({ data: { idn: dataset.value as string, countryCode: sourceCode } })
                            if (!result.isValid) addIssue({ message: result.errorMessage ?? 'Идентификационный номер невалидный' })
                        })
                    ),
                    countryId: v.pipe(v.string(), v.minLength(1, 'Страна обязательна')),
                    isAgreeWithPrivacyPolicy: v.pipe(
                        v.boolean(),
                        v.check((val) => val === true, 'Необходимо согласие с политикой конфиденциальности')
                    ),
                }),
                v.forward(
                    v.check((data) => data.password === data.confirmPassword, 'Пароли не совпадают'),
                    ['confirmPassword']
                )
            )
        })
    })

    const form = useForm({
        defaultValues: { step: Step.Info, values },
        validators: {
            onSubmitAsync: signUpSchema,
            onBlurAsync: signUpSchema,
        },
        onSubmit: async ({ value }) => {
            if (value.step === Step.Info) {
                await sendVerificationMutate({ data: { email: value.values.email } })
                form.setFieldValue('step', Step.Code)
                return
            }
            await createUserMutate({ data: { body: value.values } })
        }
    })

    const getCountryList = useServerFn(getCountryListFn)

    const countryId = useStore(form.store, (state) => state.values.values.countryId)
    const currentStep = useStore(form.store, (state) => state.values.step)
    const prevCountryId = usePrevious(countryId)

    useEffect(() => {
        if (prevCountryId && prevCountryId !== countryId) {
            form.setFieldValue('values.idn', '')
            form.setFieldValue('values.phoneNumber', '')
        }
    }, [countryId, form, prevCountryId])

    const { data: country } = useQuery({
        queryKey: ['country', countryId],
        queryFn: () => getCountryList({ data: { id: countryId } }),
        enabled: !!countryId
    })

    const sourceCode = country?.items[0]?.sourceCode

    const idnConfig = idnCountryConfig[numericToAlpha2(sourceCode) ?? '']
    const idnMaskRef = idnConfig?.mask ? withMask(idnConfig.mask, { placeholder: '', autoUnmask: true }) : undefined
    const idnLabel = idnConfig?.label ?? t`Идентификационный номер`

    const { data: countryList } = useQuery({
        queryKey: ['countryList'],
        queryFn: () => getCountryList({ data: { name: countryInputValue } }),
    })

    const countries = createListCollection({
        items: countryList?.items ?? [],
        itemToValue: (item) => item.id,
        itemToString: (item) => item.name,
    })

    const validateUser = useServerFn(validateUserFn)
    const { mutateAsync: validateUserMutate } = useMutation({
        mutationKey: ['validateUser'],
        mutationFn: validateUser,
        meta: { silent: true }
    })

    const createUser = useServerFn(createUserFn)
    const { mutateAsync: createUserMutate, isPending: isCreatingUser } = useMutation({
        mutationKey: ['createUser'],
        mutationFn: createUser,
        onSuccess: () => {
            metaPixel('track', 'CompleteRegistration');
            toaster.success({
                title: t`Пользователь зарегистрирован`
            })
            void navigate({
                to: '/auth/sign-in'
            })
        }
    })

    const sendVerification = useServerFn(sendEmailVerificationFn)
    const { mutateAsync: sendVerificationMutate, isPending: isSendingVerification } = useMutation({
        mutationKey: ['sendVerification'],
        mutationFn: sendVerification
    })

    const validateIdn = useServerFn(validateIdnFn)
    const { mutateAsync: validateIdnMutate } = useMutation({
        mutationKey: ['validateIdn'],
        mutationFn: validateIdn
    })

    const { decrement, reset: resetCounter, count } = useCounter(60)
    useInterval(() => {
        if (count > 0) decrement()
    }, 1000)

    const validateFieldOnServer = async (fieldTypeId: ECreateUserValidationFieldType, value: string) => {
        await validateUserMutate({
            data: {
                body: {
                    fieldTypeId,
                    value
                }
            }
        })
    }

    const handlePrev = () => {
        form.setFieldValue('step', Step.Info)
    }

    return (
        <Card.Root
            w={{ base: "full", md: "552px" }}
            maxW="full"
            bg="white"
            borderRadius="xl"
            boxShadow="xl"
            flexShrink={0}
        >
            <Card.Body p={{ base: "4", md: "8" }}>
                <VStack gap={{ base: "4", md: "6" }} align="stretch">
                    <Show when={currentStep === Step.Info}>
                        <VStack gap="5" align="start">
                            <Center w="full">
                                <Image src={logo} alt="Bnect" h="10"/>
                            </Center>
                            <Text fontSize="xl" fontWeight="semibold" color="gray.800">
                                <Trans>
                                    Регистрация в bnect
                                </Trans>
                            </Text>
                        </VStack>
                    </Show>
                    <Show when={currentStep === Step.Code}>
                        <HStack gap={4} align="center">
                            <IconButton
                                variant="ghost"
                                size="sm"
                                aria-label="Go back"
                                onClick={handlePrev}
                                data-cy="sign-up-back-button"
                            >
                                <ArrowLeft size={20} />
                            </IconButton>
                            <Text fontSize="xl" fontWeight="semibold" color="gray.800">
                                <Trans>
                                    Подтверждение электронной почты
                                </Trans>
                            </Text>
                        </HStack>
                    </Show>

                    {/* Info Step */}
                    <Show when={currentStep === Step.Info}>
                        <form.Field name="values.countryId">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        <Trans>Страна</Trans>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <Combobox.Root
                                        collection={countries}
                                        inputValue={countryInputValue}
                                        onInputValueChange={({ inputValue }) => {
                                            setCountryInputValue(inputValue)
                                            if (!inputValue) {
                                                field.handleChange('')
                                            }
                                        }}
                                        openOnClick
                                        selectionBehavior="preserve"
                                        value={field.state.value ? [field.state.value] : undefined}
                                        onValueChange={({ value, items }) => {
                                            field.handleChange(value[0] ?? '')
                                            setCountryInputValue(items[0]?.name ?? '')
                                        }}
                                    >
                                        <Combobox.Control>
                                            <Combobox.Input placeholder={t`Введите значение и выберите из списка`} data-cy="sign-up-country-input" />
                                            <Combobox.IndicatorGroup>
                                                <Combobox.ClearTrigger />
                                                <Combobox.Trigger />
                                            </Combobox.IndicatorGroup>
                                        </Combobox.Control>
                                        <Portal>
                                            <Combobox.Positioner>
                                                <Combobox.Content>
                                                    <For each={countries.items}>
                                                        {(country) => (
                                                            <Combobox.Item item={country} key={country.id}>
                                                                {country.name}
                                                                <Combobox.ItemIndicator />
                                                            </Combobox.Item>
                                                        )}
                                                    </For>
                                                </Combobox.Content>
                                            </Combobox.Positioner>
                                        </Portal>
                                    </Combobox.Root>
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.idn">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        {idnLabel}
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <Input
                                        ref={idnMaskRef}
                                        placeholder=" "
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        data-cy="sign-up-idn-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.lastName">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        <Trans>Фамилия</Trans>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <Input
                                        placeholder=" "
                                        name="lastName"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        data-cy="sign-up-lastname-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.firstName">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        <Trans>Имя</Trans>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <Input
                                        placeholder=" "
                                        name="firstName"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        data-cy="sign-up-firstname-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.middleName">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched}>
                                    <Field.Label>
                                        <Trans>Отчество</Trans>
                                    </Field.Label>
                                    <Input
                                        placeholder=" "
                                        name="middleName"
                                        value={field.state.value ?? ''}
                                        onChange={(e) => field.handleChange(e.target.value || null)}
                                        onBlur={field.handleBlur}
                                        data-cy="sign-up-middlename-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.phoneNumber">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        <Trans>Номер телефона</Trans>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <PhoneInput
                                        defaultCountry="uz"
                                        country={numericToAlpha2(sourceCode)?.toLowerCase()}
                                        value={field.state.value}
                                        onChangePhoneNumber={(value) => field.handleChange(value.phone || '')}
                                        onBlur={field.handleBlur}
                                        data-cy="sign-up-phone-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.email">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        <Trans>Электронная почта</Trans>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <Input
                                        placeholder=" "
                                        name="email"
                                        type="email"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        data-cy="sign-up-email-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.password">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        <Trans>Пароль</Trans>
                                        <Field.RequiredIndicator/>
                                    </Field.Label>
                                    <PasswordInput
                                        placeholder=" "
                                        name="password"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        data-cy="sign-up-password-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.confirmPassword">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched} required>
                                    <Field.Label>
                                        <Trans>Повторите пароль</Trans>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <PasswordInput
                                        name="confirmPassword"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        placeholder=" "
                                        data-cy="sign-up-confirm-password-input"
                                    />
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <form.Field name="values.isAgreeWithPrivacyPolicy">
                            {(field) => (
                                <Field.Root invalid={field.state.meta.isTouched && !field.state.value}>
                                    <Checkbox.Root
                                        checked={field.state.value}
                                        onCheckedChange={(details) => {
                                            field.handleChange(!!details.checked);
                                            field.handleBlur();
                                        }}
                                        data-cy="sign-up-privacy-checkbox"
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label fontSize="sm" color="gray.600">
                                            <Trans>
                                                Согласен на {" "}
                                                <Link to="/privacy-policy" aria-label="Обработка персональных данных">
                                                    <Text as="span" color="blue.500">
                                                        Обработку персональных данных
                                                    </Text>
                                                </Link>
                                                в соответствии с условиями {" "}
                                                <Link to="/privacy-policy" aria-label="Политика конфиденциальности">
                                                    <Text as="span" color="blue.500">
                                                        Политики конфиденциальности
                                                    </Text>
                                                </Link>
                                            </Trans>
                                        </Checkbox.Label>
                                    </Checkbox.Root>
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>
                    </Show>

                    {/* Code Step */}
                    <Show when={currentStep === Step.Code}>
                        <Text fontSize="sm" color="gray.600" lineHeight="1.6">
                            <Trans>
                                На указанную Вами почту {form.getFieldValue('values.email')} отправлен код подтверждения
                            </Trans>
                        </Text>

                        <form.Field name="values.verificationCode">
                            {(field) => (
                                <Field.Root invalid={!!field.state.meta.errors.length && field.state.meta.isTouched}>
                                    <PinInput.Root
                                        otp
                                        placeholder=""
                                        value={codeValue}
                                        onValueChange={({ value }) => {
                                            setCodeValue(value)
                                            field.handleChange(value.join(''))
                                        }}
                                        data-cy="sign-up-code-input"
                                    >
                                        <PinInput.HiddenInput />
                                        <PinInput.Control>
                                            <PinInput.Input index={0} />
                                            <PinInput.Input index={1} />
                                            <PinInput.Input index={2} />
                                            <PinInput.Input index={3} />
                                            <PinInput.Input index={4} />
                                            <PinInput.Input index={5} />
                                        </PinInput.Control>
                                    </PinInput.Root>
                                    <Field.ErrorText>{field.state.meta.errors[0]?.message}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </form.Field>

                        <Button
                            variant="text"
                            alignSelf="flex-start"
                            disabled={isSendingVerification || !!count}
                            loading={isSendingVerification}
                            onClick={() => {
                                const email = form.getFieldValue('values.email')
                                if (email) {
                                    void sendVerificationMutate({ data: { email } });
                                    resetCounter()
                                }
                            }}
                            data-cy="sign-up-resend-button"
                        >
                            {count ? (
                                <Trans>
                                    Отправить код повторно через {count}
                                </Trans>
                            ) : (
                                <Trans>
                                    Отправить код повторно
                                </Trans>
                            )}
                        </Button>
                    </Show>

                    <Show when={currentStep === Step.Info}>
                        <form.Subscribe selector={(s) => s.isSubmitting}>
                            {(isSubmitting) => (
                                <>
                                    <Button
                                        onClick={() => void form.handleSubmit()}
                                        colorScheme="orange"
                                        size="lg"
                                        width="full"
                                        disabled={isSubmitting || isSendingVerification}
                                        loading={isSubmitting || isSendingVerification}
                                        data-cy="sign-up-submit-button"
                                    >
                                        <Trans>
                                            Зарегистрироваться
                                        </Trans>
                                    </Button>
                                    <HStack gap="1" w="full" justify="center">
                                        <Text fontSize="sm" color="gray.600" textAlign="center">
                                            <Trans>
                                                Уже есть аккаунт?
                                            </Trans>
                                        </Text>
                                        <Link to="/auth/sign-in" aria-label="Войти в систему">
                                            <Text color="blue.500" textDecoration="underline" cursor="pointer">
                                                <Trans>
                                                    Войти в систему
                                                </Trans>
                                            </Text>
                                        </Link>
                                    </HStack>
                                </>
                            )}
                        </form.Subscribe>
                    </Show>
                    <Show when={currentStep === Step.Code}>
                        <form.Subscribe selector={(s) => s.isSubmitting}>
                            {(isSubmitting) => (
                                <Button
                                    size="lg"
                                    width="full"
                                    mt={4}
                                    loading={isSubmitting || isCreatingUser}
                                    disabled={isSubmitting || isCreatingUser}
                                    onClick={() => void form.handleSubmit()}
                                    data-cy="sign-up-continue-button"
                                >
                                    <Trans>
                                        Продолжить
                                    </Trans>
                                </Button>
                            )}
                        </form.Subscribe>
                    </Show>
                </VStack>
            </Card.Body>
        </Card.Root>
    );
};
