import { useState } from 'react'
import { Box, Center, Tabs } from '@chakra-ui/react'
import { SignUpForm } from './SignUpForm'
import { BankPage } from './bank-form/BankPage'

export const App = () => {
    const [tab, setTab] = useState('signup')

    return (
        <Box minH="100vh" bg="gray.100" py="8" px="4">
            <Center flexDir="column" gap="6">
                <Tabs.Root
                    value={tab}
                    onValueChange={(e) => setTab(e.value)}
                    variant="line"
                >
                    <Tabs.List mb="6">
                        <Tabs.Trigger value="signup">
                            SignUpForm (useForm + v.lazyAsync)
                        </Tabs.Trigger>
                        <Tabs.Trigger value="bank">
                            BankForm (createFormHook + withForm)
                        </Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>

                {tab === 'signup' && <SignUpForm />}
                {tab === 'bank' && <BankPage />}
            </Center>
        </Box>
    )
}
