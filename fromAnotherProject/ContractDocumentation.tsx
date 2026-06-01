import {FC, useMemo} from "react"
import { Box, For, HStack, Image, Show, Text, VStack } from "@chakra-ui/react"
import { Trans } from "@lingui/react/macro"
import fileImage from "@assets/images/file.webp"
import { components } from "@api/schema"
import FileSaver from "file-saver"
import {useMutation} from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { getFilesZipFn, streamToBlob } from "@features/common/functions"
import { Download } from "lucide-react"
import {Link} from "@tanstack/react-router";

type ContractFile = components["schemas"]["ContractFileResponse"]

type ContractDocumentationProps = {
    files?: ContractFile[]
}

export const ContractDocumentation: FC<ContractDocumentationProps> = ({ files }) => {
    const { signedFiles, filesForSign, otherFiles } = useMemo(() => {
        const signedFiles = files
            ?.filter((file) => !!file.signedFile)
            .map(file => file.signedFile!) ?? []
        const filesForSign = files
            ?.filter((file) => file.forSign) ?? []
        const otherFiles = files
            ?.filter((file) => !file.forSign) ?? []
        return { signedFiles, filesForSign, otherFiles }
    }, [files])

    const getFilesZip = useServerFn(getFilesZipFn)
    const { mutateAsync: fetchArchive } = useMutation({
        mutationKey: ['filesZip'],
        mutationFn: getFilesZip,
    })

    const handleDownloadArchive = async () => {
        const data = await fetchArchive({
            data: {
                ids: [
                    ...signedFiles.map(file => file.id),
                    ...filesForSign.map(file => file.fileId!),
                    ...otherFiles.map(file => file.fileId!)
                ]
            }
        })
        const blob = await streamToBlob(data, 'application/zip')
        FileSaver.saveAs(blob, "contract-files.zip")
    }

    return (
        <VStack
            maxW={{ base: "full", xl: "360px" }}
            w="100%"
            borderRadius={{ base: "16px", md: "24px" }}
            bg="white"
            p={{ base: "16px", md: "24px" }}
            gap="3"
            align="flex-start"
        >
            <HStack justifyContent="space-between" alignItems="center" w="full">
                <Text fontSize={{ base: "16px", md: "18px" }} fontWeight="700">
                    <Trans>Документация</Trans>
                </Text>
                <Box fontSize="14px" fontWeight="600" color="blue" cursor="pointer" onClick={handleDownloadArchive}>
                    <Trans>Скачать архивом</Trans>
                </Box>
            </HStack>

            <Box w="full">
                <Text fontSize="14px" fontWeight="400" color="text.secondary" mb="10px">
                    <Trans>Подписанные файлы</Trans>
                </Text>
                <VStack align="stretch" gap="2">
                    <Show when={!!signedFiles.length} fallback={<Text fontSize="14px"><Trans>Нет подписанных файлов</Trans></Text>}>
                        <For each={signedFiles}>
                            {(file) => (
                                <Box key={file.id}>
                                    <HStack justifyContent="flex-start" alignItems="center" gap="2">
                                        <HStack flexShrink="0" justifyContent="center" alignItems="center" bg="#d8ebff" w="32px" h="32px" borderRadius="8px">
                                            <Image src={fileImage} boxSize="20px" objectFit="contain" alt="Document" />
                                        </HStack>
                                        <Text fontSize="14px" flex="1" minW="0" overflowWrap="anywhere">{file.name}</Text>
                                        <Link to="/uploads/$id" params={{ id: file.id }} download={file.name ?? true} target="_blank">
                                            <Box flexShrink="0" cursor="pointer" color="blue">
                                                <Download size={18} />
                                            </Box>
                                        </Link>
                                    </HStack>
                                </Box>
                            )}
                        </For>
                    </Show>
                </VStack>
            </Box>

            <Box w="full">
                <Text fontSize="14px" fontWeight="400" color="text.secondary" mb="10px">
                    <Trans>Файлы для подписания</Trans>
                </Text>
                <VStack align="stretch" gap="2">
                    <Show when={!!filesForSign.length} fallback={<Text fontSize="14px"><Trans>Нет файлов для подписания</Trans></Text>}>
                        <For each={filesForSign}>
                            {(file) => (
                                <Box key={file.fileId}>
                                    <HStack justifyContent="flex-start" alignItems="center" gap="2">
                                        <HStack flexShrink="0" justifyContent="center" alignItems="center" bg="#d8ebff" w="32px" h="32px" borderRadius="8px">
                                            <Image src={fileImage} boxSize="20px" objectFit="contain" alt="Document" />
                                        </HStack>
                                        <Text fontSize="14px" flex="1" minW="0" overflowWrap="anywhere">{file?.file?.name}</Text>
                                        <Link to="/uploads/$id" params={{ id: file.fileId! }} download={file.file?.name ?? true} target="_blank">
                                            <Box flexShrink="0" cursor="pointer" color="blue">
                                                <Download size={18} />
                                            </Box>
                                        </Link>
                                    </HStack>
                                </Box>
                            )}
                        </For>
                    </Show>
                </VStack>
            </Box>

            <Box w="full">
                <Text fontSize="14px" fontWeight="400" color="text.secondary" mb="10px">
                    <Trans>Другие файлы</Trans>
                </Text>
                <VStack align="stretch" gap="8px">
                    <Show when={!!otherFiles.length} fallback={<Text fontSize="14px"><Trans>Нет файлов для подписания</Trans></Text>}>
                        <For each={otherFiles}>
                            {(file) => (
                                <HStack key={file.fileId} gap="8px" align="center">
                                    <Box
                                        flexShrink="0"
                                        bg="#d8ebff"
                                        w="32px"
                                        h="32px"
                                        borderRadius="8px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Image src={fileImage} boxSize="20px" objectFit="contain" alt="Document" />
                                    </Box>
                                    <Text fontSize="14px" flex="1" minW="0" overflowWrap="anywhere">{file?.file?.name}</Text>
                                    <Link to="/uploads/$id" params={{ id: file.fileId! }} download={file.file?.name ?? true} target="_blank">
                                        <Box flexShrink="0" cursor="pointer" color="blue">
                                            <Download size={18} />
                                        </Box>
                                    </Link>
                                </HStack>
                            )}
                        </For>
                    </Show>
                </VStack>
            </Box>
        </VStack>
    )
}
