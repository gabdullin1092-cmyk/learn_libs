import { useState } from 'react'
import {
    Box, Button, Field, For, HStack, Input, Text,
    VStack, Badge, Separator, Card,
} from '@chakra-ui/react'
import { useAuth } from './AuthContext'

// ============================================================
// AuthPanel — демонстрация useAuth() в действии
//
// Показывает:
//   1. Форма логина → вызывает login() из контекста
//   2. Профиль пользователя → читает user, company, roles из контекста
//   3. Кнопка выхода → вызывает logout() из контекста
//
// Любой компонент в дереве может вызвать useAuth() и получить
// тот же контекст — не нужно пробрасывать пропсы
// ============================================================

const DEMO_ACCOUNTS = [
    { email: 'alice@demo.com', name: 'Алиса (admin, manager)', password: 'demo1234' },
    { email: 'bob@demo.com',   name: 'Боб (manager, user)',    password: 'demo1234' },
    { email: 'carol@demo.com', name: 'Кэрол (user)',           password: 'demo1234' },
]

const ROLE_COLORS: Record<string, string> = {
    admin:   'red',
    manager: 'blue',
    user:    'gray',
}

export const AuthPanel = () => {
    // useAuth() — читает из AuthContext
    // В оригинале: Route.useRouteContext()
    const { user, company, roles, isAuthenticated, isLoading, error, login, logout } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLogin = async () => {
        setIsSubmitting(true)
        await login(email, password)
        setIsSubmitting(false)
    }

    if (isLoading) {
        return (
            <Box p="8" textAlign="center">
                <Text color="gray.400">Загрузка сессии...</Text>
            </Box>
        )
    }

    return (
        <Box maxW="500px" mx="auto">
            {/* ===== ПРОФИЛЬ — показывается если авторизован ===== */}
            {isAuthenticated && user ? (
                <Card.Root>
                    <Card.Body p="6">
                        <VStack align="stretch" gap="4">
                            <Text fontWeight="bold" fontSize="lg">Текущая сессия</Text>

                            <Box bg="green.50" borderRadius="8px" p="4">
                                <Text fontSize="12px" color="gray.500" mb="1">
                                    Данные из AuthContext (= RouterContext в оригинале)
                                </Text>
                                <Text fontWeight="600">{user.fullName}</Text>
                                <Text fontSize="13px" color="gray.600">{user.email}</Text>
                            </Box>

                            {company && (
                                <Box bg="blue.50" borderRadius="8px" p="4">
                                    <Text fontSize="12px" color="gray.500" mb="1">company</Text>
                                    <Text fontWeight="500">{company.name}</Text>
                                    <Text fontSize="12px" color="gray.500">ИНН: {company.idn}</Text>
                                </Box>
                            )}

                            <Box>
                                <Text fontSize="12px" color="gray.500" mb="2">roles</Text>
                                <HStack gap="2">
                                    <For each={roles}>
                                        {(role) => (
                                            <Badge key={role} colorPalette={ROLE_COLORS[role] ?? 'gray'}>
                                                {role}
                                            </Badge>
                                        )}
                                    </For>
                                </HStack>
                            </Box>

                            <Separator />

                            {/* Показываем что лежит в localStorage */}
                            <Box bg="gray.50" borderRadius="8px" p="3">
                                <Text fontSize="11px" color="gray.500" mb="1">
                                    localStorage (= HTTP-only cookie в оригинале)
                                </Text>
                                <Text fontFamily="mono" fontSize="11px">
                                    token: {JSON.parse(localStorage.getItem('demo_session') ?? '{}').token ?? '—'}
                                </Text>
                            </Box>

                            <Button
                                colorPalette="red"
                                variant="outline"
                                onClick={logout}
                                size="sm"
                                alignSelf="flex-start"
                            >
                                Выйти
                            </Button>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            ) : (
                /* ===== ФОРМА ЛОГИНА — показывается если не авторизован ===== */
                <Card.Root>
                    <Card.Body p="6">
                        <VStack align="stretch" gap="4">
                            <Text fontWeight="bold" fontSize="lg">Войти в систему</Text>

                            {/* Быстрый выбор демо-аккаунта */}
                            <Box>
                                <Text fontSize="12px" color="gray.500" mb="2">Демо аккаунты (пароль: demo1234)</Text>
                                <VStack align="stretch" gap="1">
                                    <For each={DEMO_ACCOUNTS}>
                                        {(acc) => (
                                            <Button
                                                key={acc.email}
                                                variant="outline"
                                                size="xs"
                                                justifyContent="flex-start"
                                                onClick={() => {
                                                    setEmail(acc.email)
                                                    setPassword(acc.password)
                                                }}
                                            >
                                                {acc.name}
                                            </Button>
                                        )}
                                    </For>
                                </VStack>
                            </Box>

                            <Separator />

                            <Field.Root>
                                <Field.Label>Email</Field.Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alice@demo.com"
                                />
                            </Field.Root>

                            <Field.Root>
                                <Field.Label>Пароль</Field.Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="demo1234"
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                />
                            </Field.Root>

                            {error && (
                                <Text color="red.500" fontSize="13px">{error}</Text>
                            )}

                            <Button
                                onClick={handleLogin}
                                loading={isSubmitting}
                                disabled={!email || !password}
                            >
                                Войти
                            </Button>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            )}
        </Box>
    )
}
