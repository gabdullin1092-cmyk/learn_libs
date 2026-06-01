import {
    Outlet,
    createRootRouteWithContext,
    HeadContent,
    Scripts,
    useLocation,
} from '@tanstack/react-router'
import * as Sentry from "@sentry/tanstackstart-react"
import { Header } from "../layout/Header"
import { useEffect } from "react"
import { CompanyListDrawer, CompanyDrawerInit } from "@features/company/CompanyListDrawer"
import { JoinCompanyDialog } from "@features/company/JoinCompanyDialog"
import * as v from 'valibot'
import { MigrationModal } from "@features/common/MigrationModal"
import { EimzoSignModal } from '@features/sign/eimzo/EimzoSign'
import { metaPixel } from "@analytics/metaPixel"
import {Box, Show} from "@chakra-ui/react"
import { RequestDemoDialog } from "@features/home/RequestDemoDialog"
import { getRouterContextFn } from "@features/auth/functions"
import {defaultRouterContext, RouterContext} from "../router"
import {Toaster} from "@components/ui/toaster.tsx";
import { GlobalErrorHandler } from "@features/common/GlobalErrorHandler"
import {i18n} from "@lingui/core";
import {ErrorComponent} from "@layout/ErrorComponent.tsx";

const schema = v.object({
    showMigrationModal: v.optional(v.boolean()),
    requestDemo: v.optional(v.boolean())
})

export const Route = createRootRouteWithContext<RouterContext>()({
    head: ({ match }) => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Bnect — Электронные закупки и документооборот' },
            { name: 'description', content: 'Платформа для электронных закупок и документооборота в Узбекистане. Тендеры, конкурентные закупки, электронное подписание документов.' },
            // Open Graph (Facebook, Telegram, WhatsApp)
            { property: 'og:type', content: 'website' },
            { property: 'og:site_name', content: 'Bnect' },
            { property: 'og:title', content: 'Bnect — Электронные закупки и документооборот' },
            { property: 'og:description', content: 'Платформа для электронных закупок и документооборота в Узбекистане' },
            { property: 'og:url', content: 'https://uz.bnect.pro' },
            { property: 'og:locale', content: 'ru_RU' },
            { property: 'og:image', content: 'https://uz.bnect.pro/og-image.webp' },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
            { property: 'og:image:alt', content: 'Bnect — Электронные закупки и документооборот' },
            // Twitter Card
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: 'Bnect — Электронные закупки и документооборот' },
            { name: 'twitter:description', content: 'Платформа для электронных закупок и документооборота в Узбекистане' },
            { name: 'twitter:image', content: 'https://uz.bnect.pro/og-image.webp' },
        ],
        links: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
            { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
            { rel: 'manifest', href: '/site.webmanifest' },
            { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
            { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
            { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap' },
            { rel: 'alternate', hrefLang: 'ru', href: `https://uz.bnect.pro${match.pathname}?lang=ru` },
            { rel: 'alternate', hrefLang: 'en', href: `https://uz.bnect.pro${match.pathname}?lang=en` },
            { rel: 'alternate', hrefLang: 'uz', href: `https://uz.bnect.pro${match.pathname}?lang=uz` },
            { rel: 'alternate', hrefLang: 'x-default', href: `https://uz.bnect.pro${match.pathname}` },
        ],
        scripts: [
            {
                type: 'application/ld+json',
                children: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'Organization',
                            '@id': 'https://uz.bnect.pro/#organization',
                            name: 'Bnect',
                            url: 'https://uz.bnect.pro',
                            logo: 'https://uz.bnect.pro/logo.webp',
                        },
                        {
                            '@type': 'WebSite',
                            '@id': 'https://uz.bnect.pro/#website',
                            url: 'https://uz.bnect.pro',
                            name: 'Bnect',
                            publisher: { '@id': 'https://uz.bnect.pro/#organization' },
                        },
                    ],
                }),
            },
        ],
    }),
    component: RootComponent,
    validateSearch: schema,
    staleTime: 30_000,
    beforeLoad: async () => {
        try {
            const context =  await getRouterContextFn()
            Sentry.setUser(context.user as Sentry.User)
            Sentry.setContext('company', context.company)
            Sentry.setContext('roles', {
                roles: context.roles,
                currentUserCompanyRoles: context.currentUserCompanyRoles.map(item => item.name)
            })
            return context
        } catch (error) {
            Sentry.captureException(error)
            return defaultRouterContext
        }
    },
})

function RootComponent() {
    const context = Route.useRouteContext()
    const isAuthenticated = !!context.user
    const location = useLocation()

    useEffect(() => {
        metaPixel('track', 'PageView')
    }, [location.pathname, location.search])

    // Set Sentry user context
    useEffect(() => {
        Sentry.setUser(context.user as Sentry.User)
        Sentry.setContext('company', context.company)
        Sentry.setContext('roles', {
            roles: context.roles,
            currentUserCompanyRoles: context.currentUserCompanyRoles.map(item => item.name)
        })
    }, [context])

    return (
        <html lang={i18n.locale}>
            <head>
                <HeadContent />
            </head>
            <body>
                <Sentry.ErrorBoundary
                    fallback={(props) => <ErrorComponent {...props} />}
                >
                    <Header />
                    <Box as="main" height="full">
                        <Outlet />
                    </Box>
                    <Show when={isAuthenticated}>
                        <CompanyListDrawer />
                        <CompanyDrawerInit />
                    </Show>
                    <JoinCompanyDialog />
                    <MigrationModal />
                    <EimzoSignModal />
                    <RequestDemoDialog />
                    <Toaster />
                    <GlobalErrorHandler />
                </Sentry.ErrorBoundary>
                <Scripts />
            </body>
        </html>
    )
}
