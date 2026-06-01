import { useState } from 'react'
import { Box, Center, Tabs } from '@chakra-ui/react'
import { SignUpForm } from './SignUpForm'
import { BankPage } from './bank-form/BankPage'
import { ContractsPage } from './contracts/ContractsPage'
import { AuthPanel } from './store/AuthPanel'

export const App = () => {
    const [tab, setTab] = useState('auth')

    return (
        <Box minH="100vh" bg="gray.100" py="6" px="4">
            <Center flexDir="column" gap="5">
                <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)} variant="line">
                    <Tabs.List mb="4">
                        <Tabs.Trigger value="auth">Store / Auth</Tabs.Trigger>
                        <Tabs.Trigger value="contracts">Договоры</Tabs.Trigger>
                        <Tabs.Trigger value="bank">BankForm</Tabs.Trigger>
                        <Tabs.Trigger value="signup">SignUpForm</Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>

                <Box w="full" maxW="1100px">
                    {tab === 'auth'      && <AuthPanel />}
                    {tab === 'contracts' && <ContractsPage />}
                    {tab === 'bank'      && <BankPage />}
                    {tab === 'signup'    && <Center><SignUpForm /></Center>}
                </Box>
            </Center>
        </Box>
    )
}
