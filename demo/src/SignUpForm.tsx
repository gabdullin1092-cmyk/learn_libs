import { useState } from 'react'
import {
  Card, Field, Input, Button, Text, VStack,
  PinInput, Show, Center, Badge, Box, Separator,
  HStack,
} from '@chakra-ui/react'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import * as v from 'valibot'

// ============================================================
// 1. МАШИНА СОСТОЯНИЙ ШАГОВ
//    Форма живёт в двух режимах: Info (заполнение) и Code (верификация).
//    Step хранится ВНУТРИ стора формы (не в useState), потому что
//    схема валидации должна его видеть через v.lazyAsync.
// ============================================================
enum Step { Info, Code }

// ============================================================
// 2. СТРУКТУРА ДАННЫХ ФОРМЫ
//    defaultValues — единственный источник правды о структуре.
//    TypeScript выведет тип FormValues автоматически.
// ============================================================
const defaultValues = {
  step: Step.Info as Step,
  values: {
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  },
}

type FormValues = typeof defaultValues

// ============================================================
// 3. СИМУЛИРОВАННЫЕ API-ФУНКЦИИ
//    В реальном проекте это были бы fetch/axios вызовы.
//    useMutation ожидает функции с такой же сигнатурой.
//
//    Для теста:
//    - email "taken@test.com" → будет отклонён сервером
//    - код "123456" → правильный (в реальности пришёл бы на почту)
// ============================================================
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const apiValidateEmail = async (email: string): Promise<void> => {
  await delay(700) // имитируем latency сети
  if (email === 'taken@test.com') {
    throw new Error('Этот email уже зарегистрирован')
  }
}

const apiSendCode = async (email: string): Promise<void> => {
  await delay(1000)
  // Вместо реального письма — логируем в консоль
  console.log(`[API] Код отправлен на ${email}. Тестовый код: 123456`)
}

const apiCreateUser = async (data: FormValues['values']): Promise<void> => {
  await delay(1200)
  // Имитируем ошибку сервера если код неправильный
  if (data.verificationCode !== '123456') {
    throw new Error('Неверный код подтверждения')
  }
  console.log('[API] Пользователь создан:', { name: data.firstName, email: data.email })
}

// ============================================================
// 4. КОМПОНЕНТ ФОРМЫ
// ============================================================
export const SignUpForm = () => {
  // PinInput управляется массивом ['1','2','3','4','5','6'],
  // а поле формы хранит строку '123456'.
  // Нужны оба: PinInput.Root принимает string[], форма — string.
  const [codeValue, setCodeValue] = useState(['', '', '', '', '', ''])

  // ============================================================
  // 4.1. СХЕМА ВАЛИДАЦИИ (valibot)
  //
  // v.lazyAsync(fn) — "ленивая" асинхронная схема.
  // fn вызывается при каждой валидации и получает текущее
  // значение формы. Возвращает конкретную схему для этих данных.
  //
  // Почему lazyAsync а не просто object?
  //   → Потому что схема меняется в зависимости от step:
  //     на Step.Code нужно проверять только verificationCode,
  //     на Step.Info — остальные поля с async-проверкой email.
  //
  // Схема создаётся ВНУТРИ компонента, потому что использует
  // apiValidateEmail через замыкание (в реальном коде здесь
  // были бы серверные функции из хука).
  // ============================================================
  const signUpSchema = v.lazyAsync((input) => {
    const { step } = input as FormValues

    // --- Шаг 2: только код ---
    if (step === Step.Code) {
      return v.objectAsync({
        step: v.number(),
        values: v.object({
          firstName: v.string(),
          email: v.string(),
          password: v.string(),
          confirmPassword: v.string(),
          verificationCode: v.pipe(
            v.string(),
            v.minLength(6, 'Введите 6-значный код'),
          ),
        }),
      })
    }

    // --- Шаг 1: полная валидация ---
    return v.objectAsync({
      step: v.number(),
      values: v.pipeAsync(
        v.objectAsync({
          firstName: v.pipe(
            v.string(),
            v.minLength(1, 'Имя обязательно'),
            v.minLength(2, 'Минимум 2 символа'),
          ),

          // v.pipeAsync — цепочка асинхронных проверок.
          // Если предыдущая упала — следующая не запускается.
          email: v.pipeAsync(
            v.string(),
            v.minLength(1, 'Email обязателен'),
            v.email('Некорректный email'),
            // v.rawCheckAsync — кастомная async-проверка внутри pipe.
            // dataset.value — текущее значение поля.
            // addIssue — добавляет ошибку именно к этому полю.
            v.rawCheckAsync<string>(async ({ dataset, addIssue }) => {
              if (!dataset.value) return
              try {
                await apiValidateEmail(dataset.value)
              } catch (err) {
                addIssue({
                  message: err instanceof Error ? err.message : 'Ошибка валидации',
                })
              }
            }),
          ),

          password: v.pipe(
            v.string(),
            v.minLength(1, 'Пароль обязателен'),
            v.minLength(8, 'Минимум 8 символов'),
          ),

          confirmPassword: v.pipe(
            v.string(),
            v.minLength(1, 'Повторите пароль'),
          ),

          verificationCode: v.string(),
        }),

        // v.forward — кросс-field валидация.
        // Первый аргумент: v.check — проверка всего объекта values.
        // Второй аргумент: путь поля куда "перебросить" ошибку.
        // Без forward ошибка "Пароли не совпадают" висела бы на
        // всём объекте values, а не на поле confirmPassword.
        v.forward(
          v.check(
            (data) => data.password === data.confirmPassword,
            'Пароли не совпадают',
          ),
          ['confirmPassword'],
        ),
      ),
    })
  })

  // ============================================================
  // 4.2. ИНИЦИАЛИЗАЦИЯ ФОРМЫ (@tanstack/react-form)
  //
  // useForm возвращает form — объект с методами и компонентами:
  //   form.Field — компонент для рендера одного поля
  //   form.Subscribe — подписка на срез стора через render-prop
  //   form.handleSubmit — запускает валидацию и onSubmit
  //   form.setFieldValue — imperatively меняет значение поля
  //   form.store — сам стор (@tanstack/store)
  //   form.getFieldValue — читает значение поля вне рендера
  //
  // validators.onBlurAsync — запускается при каждом blur.
  //   Принимает valibot-схему напрямую (Standard Schema V1).
  //   Форма сама вызывает schema['~standard'].validate(value)
  //   и распределяет ошибки по путям к нужным полям.
  //
  // validators.onSubmitAsync — то же самое, но при submit.
  // ============================================================
  const form = useForm({
    defaultValues,
    validators: {
      onBlurAsync: signUpSchema,
      onSubmitAsync: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.step === Step.Info) {
        // Шаг 1: отправить код и переключить шаг
        await sendCodeMutate(value.values.email)
        form.setFieldValue('step', Step.Code)
        return
      }
      // Шаг 2: создать пользователя
      await createUserMutate(value.values)
    },
  })

  // ============================================================
  // 4.3. МУТАЦИИ (@tanstack/react-query)
  //
  // useMutation — управляет состоянием одного async-вызова:
  //   mutateAsync — вызывает fn и возвращает Promise (можно await)
  //   mutate     — fire-and-forget вариант
  //   isPending  — true пока запрос выполняется
  //   isError    — true если был throw
  //   reset()    — сбрасывает состояние мутации
  //
  // Разница от useQuery: мутации запускаются вручную,
  // а не автоматически при монтировании компонента.
  // ============================================================
  const { mutateAsync: sendCodeMutate, isPending: isSendingCode } = useMutation({
    mutationKey: ['sendCode'],
    mutationFn: apiSendCode,
    onSuccess: () => console.log('[Mutation:sendCode] успех'),
    onError: (err) => console.error('[Mutation:sendCode] ошибка:', err),
  })

  const { mutateAsync: createUserMutate, isPending: isCreatingUser } = useMutation({
    mutationKey: ['createUser'],
    mutationFn: apiCreateUser,
    onSuccess: () => {
      alert('Регистрация успешна! Проверь консоль.')
      // Сбрасываем форму в начальное состояние
      form.reset()
      setCodeValue(['', '', '', '', '', ''])
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : 'Ошибка создания пользователя')
    },
  })

  // ============================================================
  // 4.4. РЕАКТИВНЫЕ ПОДПИСКИ НА СТОР ФОРМЫ
  //
  // useStore(store, selector) — подписка на конкретный срез стора.
  // Компонент ре-рендерится ТОЛЬКО если selector вернул новое значение.
  // Это оптимизация: изменение email не перерендеривает весь компонент,
  // только те части которые используют email через useStore/Subscribe.
  //
  // form.Subscribe — то же самое, но в JSX-форме через render-prop.
  // Обычно используют:
  //   useStore — для значений нужных в логике компонента (как здесь step)
  //   form.Subscribe — для значений нужных только в JSX (как isSubmitting)
  // ============================================================
  const currentStep = useStore(form.store, (s) => s.values.step)

  return (
    <Card.Root w={{ base: 'full', md: '500px' }} maxW="full" shadow="lg">
      <Card.Body p={{ base: '5', md: '8' }}>
        <VStack gap="5" align="stretch">

          {/* ЗАГОЛОВОК */}
          <Center>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              {currentStep === Step.Info ? 'Регистрация' : 'Подтверждение почты'}
            </Text>
          </Center>

          {/* ============================================================
              ШАГ 1: ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
              Show — условный рендер Chakra UI. Не unmount, а display:none.
              form.Field — render-prop компонент для конкретного поля.
                name — dot-notation путь в defaultValues
                children — функция, получает объект field:
                  field.state.value        — текущее значение
                  field.state.meta.errors  — массив ошибок (StandardSchemaV1Issue[])
                  field.state.meta.isTouched    — было ли поле тронуто
                  field.state.meta.isValidating — идёт ли async-валидация
                  field.handleChange(v)    — обновить значение
                  field.handleBlur()       — пометить как touched + запустить blur-валидацию
          ============================================================ */}
          <Show when={currentStep === Step.Info}>
            <form.Field name="values.firstName">
              {(field) => (
                <Field.Root
                  invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                  required
                >
                  <Field.Label>
                    Имя <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    placeholder="Введите имя"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <Field.ErrorText>
                    {/* errors[0] — StandardSchemaV1Issue = { message, path? }
                        Ошибки от form-level схемы распределяются по полям по путям */}
                    {field.state.meta.errors[0]?.message}
                  </Field.ErrorText>
                </Field.Root>
              )}
            </form.Field>

            <form.Field name="values.email">
              {(field) => (
                <Field.Root
                  invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                  required
                >
                  <Field.Label>
                    Email <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder="example@mail.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {/* isValidating — true пока rawCheckAsync запрос не вернулся */}
                  {field.state.meta.isValidating && (
                    <Text fontSize="xs" color="blue.500">
                      Проверяем доступность email...
                    </Text>
                  )}
                  <Field.ErrorText>
                    {field.state.meta.errors[0]?.message}
                  </Field.ErrorText>
                </Field.Root>
              )}
            </form.Field>

            <form.Field name="values.password">
              {(field) => (
                <Field.Root
                  invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                  required
                >
                  <Field.Label>
                    Пароль <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <Field.ErrorText>
                    {field.state.meta.errors[0]?.message}
                  </Field.ErrorText>
                </Field.Root>
              )}
            </form.Field>

            <form.Field name="values.confirmPassword">
              {(field) => (
                <Field.Root
                  invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                  required
                >
                  <Field.Label>
                    Повторите пароль <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="password"
                    placeholder="Повторите пароль"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {/* Эта ошибка появляется благодаря v.forward в схеме:
                      ошибка "Пароли не совпадают" перебрасывается
                      с объекта values на поле confirmPassword */}
                  <Field.ErrorText>
                    {field.state.meta.errors[0]?.message}
                  </Field.ErrorText>
                </Field.Root>
              )}
            </form.Field>
          </Show>

          {/* ============================================================
              ШАГ 2: КОД ПОДТВЕРЖДЕНИЯ
              PinInput — специализированный компонент для ввода кода.
              Внутри: HiddenInput (для autocomplete otp), Control + Input*N.
              value: string[] — каждая цифра в отдельном элементе массива.
              onValueChange: синхронизируем массив → строку для поля формы.
          ============================================================ */}
          <Show when={currentStep === Step.Code}>
            <Text fontSize="sm" color="gray.600">
              {/* form.getFieldValue — читает значение без подписки на стор.
                  Безопасно здесь потому что email на Step.Code не меняется.
                  В противном случае нужно form.Subscribe или useStore. */}
              Код отправлен на{' '}
              <Text as="span" fontWeight="semibold">
                {form.getFieldValue('values.email')}
              </Text>
              . Для теста введи <Badge colorPalette="green">123456</Badge>
            </Text>

            <form.Field name="values.verificationCode">
              {(field) => (
                <Field.Root
                  invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}
                >
                  <Field.Label>Код подтверждения</Field.Label>
                  <PinInput.Root
                    otp
                    value={codeValue}
                    onValueChange={({ value }) => {
                      setCodeValue(value)
                      field.handleChange(value.join(''))
                    }}
                    onValueComplete={() => {
                      // При завершении ввода — помечаем поле как touched
                      // чтобы валидация могла показать ошибку
                      field.handleBlur()
                    }}
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
                  <Field.ErrorText>
                    {field.state.meta.errors[0]?.message}
                  </Field.ErrorText>
                </Field.Root>
              )}
            </form.Field>

            <Button
              variant="ghost"
              size="sm"
              alignSelf="flex-start"
              loading={isSendingCode}
              onClick={() => {
                const email = form.getFieldValue('values.email')
                if (email) void sendCodeMutate(email)
              }}
            >
              Отправить код повторно
            </Button>
          </Show>

          {/* ============================================================
              КНОПКА SUBMIT
              form.Subscribe — render-prop подписка на срез стора.
              Аналог useStore но в JSX. Использую здесь чтобы показать оба варианта.
              Кнопка ре-рендерится только когда isSubmitting меняется,
              не при вводе в поля.
          ============================================================ */}
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button
                width="full"
                size="lg"
                loading={isSubmitting || isSendingCode || isCreatingUser}
                disabled={isSubmitting || isSendingCode || isCreatingUser}
                onClick={() => void form.handleSubmit()}
              >
                {currentStep === Step.Info ? 'Продолжить →' : 'Зарегистрироваться'}
              </Button>
            )}
          </form.Subscribe>

          {currentStep === Step.Code && (
            <Button
              variant="ghost"
              size="sm"
              alignSelf="center"
              onClick={() => {
                // Возврат на шаг 1: меняем step и сбрасываем код
                form.setFieldValue('step', Step.Info)
                form.setFieldValue('values.verificationCode', '')
                setCodeValue(['', '', '', '', '', ''])
              }}
            >
              ← Назад
            </Button>
          )}

          {/* ============================================================
              DEBUG-ПАНЕЛЬ: визуализация стора формы в реальном времени
              Помогает понять как меняется состояние при вводе и валидации.
              Убери этот блок в продакшене.
          ============================================================ */}
          <Separator />
          <form.Subscribe selector={(s) => s}>
            {(state) => (
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" mb="2">
                  🔍 Состояние формы (debug):
                </Text>
                <HStack gap="2" wrap="wrap" mb="2">
                  <Badge colorPalette={state.isSubmitting ? 'orange' : 'gray'}>
                    isSubmitting: {String(state.isSubmitting)}
                  </Badge>
                  <Badge colorPalette={state.isValid ? 'green' : 'red'}>
                    isValid: {String(state.isValid)}
                  </Badge>
                  <Badge colorPalette="blue">
                    submitCount: {state.submissionAttempts}
                  </Badge>
                  <Badge colorPalette="purple">
                    step: {state.values.step === Step.Info ? 'Info' : 'Code'}
                  </Badge>
                </HStack>
                <Box
                  as="pre"
                  fontSize="10px"
                  bg="gray.50"
                  p="3"
                  borderRadius="md"
                  overflow="auto"
                  maxH="160px"
                  color="gray.700"
                >
                  {JSON.stringify(state.values.values, null, 2)}
                </Box>
              </Box>
            )}
          </form.Subscribe>

        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
