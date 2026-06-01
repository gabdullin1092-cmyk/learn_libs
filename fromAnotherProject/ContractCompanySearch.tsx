import {
  Box,
  Combobox,
  Field,
  Input,
  Text,
  Image,
  Avatar,
  Show,
  VStack,
  Alert,
  For,
  Portal,
  Spinner,
  createListCollection,
} from '@chakra-ui/react';
import { Trans, useLingui } from "@lingui/react/macro";
import { Tooltip } from '@components/ui/tooltip.tsx';
import { FC, useState, useCallback, ChangeEvent } from 'react';
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import briefcaseIcon from '@assets/icons/briefcase.svg';
import { components } from '@api/schema';
import { getCompaniesListFn, getCompanyShortFn } from "@features/company/functions";

type ContractSignerInputDto = components['schemas']['ContractSignerInputDto'];
type CompanyShortResponse = components["schemas"]["CompanyShortResponse"];

type ContractCompanySearchProps = {
  signer?: ContractSignerInputDto | null;
  onSignerChange?: (signer: ContractSignerInputDto) => void;
  company?: CompanyShortResponse | null;
};

const emptySigner: ContractSignerInputDto = {
  companyId: null, userId: null, idn: null,
  companyName: null, email: null, userName: null,
};

export const ContractCompanySearch: FC<ContractCompanySearchProps> = ({ signer: initialSigner, onSignerChange, company: initialCompany }) => {
  const { t } = useLingui();

  const [inputValue, setInputValue] = useState(initialCompany?.idn ?? initialSigner?.idn ?? '');
  const [notFound, setNotFound] = useState(!!(initialSigner && !initialSigner.companyId && (initialSigner.companyName || initialSigner.idn)));
  const [companyName, setCompanyName] = useState(initialSigner?.companyName ?? '');

  const getCompaniesList = useServerFn(getCompaniesListFn);
  const getCompanyShort = useServerFn(getCompanyShortFn);

  const { data: companiesList, isFetching } = useQuery({
    queryKey: ['companiesList', 'idn', inputValue],
    queryFn: () => getCompaniesList({ data: { idn: inputValue } }),
    enabled: inputValue.length >= 3,
  });

  const { data: selectedCompany } = useQuery({
    queryKey: ['companyShort', initialSigner?.companyId],
    queryFn: () => getCompanyShort({ data: { id: initialSigner!.companyId! } }),
    enabled: !!initialSigner?.companyId,
  });

  const companies = createListCollection({
    items: companiesList?.items ?? [],
    itemToString: (item) => item.idn ?? '',
    itemToValue: (item) => item.id,
    isItemDisabled: (item) => !item.acceptsIncomingDocuments,
  });

  const handleCompanyNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setCompanyName(name);
    onSignerChange?.({
      ...emptySigner,
      ...(initialSigner ? { userId: initialSigner.userId, email: initialSigner.email, userName: initialSigner.userName } : {}),
      companyId: null,
      companyName: name,
      idn: inputValue || null,
    });
  }, [inputValue, initialSigner, onSignerChange]);

  const NotFoundAction: FC = () => (
    <Text
      fontSize="13"
      color="blue.500"
      cursor="pointer"
      _hover={{ textDecoration: 'underline' }}
      onClick={() => {
        setNotFound(true);
        onSignerChange?.({
          ...emptySigner,
          ...(initialSigner ? { userId: initialSigner.userId, email: initialSigner.email, userName: initialSigner.userName } : {}),
          companyId: null,
          companyName: companyName || null,
          idn: inputValue,
        });
      }}
    >
      <Trans>Не нашли компанию?</Trans>
    </Text>
  );

  return (
    <Box bg="white" height="auto" borderRadius="24px" p={{ base: "16px", md: "20px" }}>
      <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
        <Trans>Компания получатель</Trans>
      </Text>
      <VStack w="full" gap="3" align="start">
        <Field.Root w="full">
          <Field.Label>
            <Trans>ИНН/БИН компании</Trans>
          </Field.Label>
          <Combobox.Root
            collection={companies}
            inputValue={inputValue}
            onInputValueChange={({ inputValue }) => {
              setInputValue(inputValue);
              if (!inputValue) {
                setNotFound(false);
                setCompanyName('');
                onSignerChange?.({
                  ...emptySigner,
                  ...(initialSigner ? { userId: initialSigner.userId, email: initialSigner.email, userName: initialSigner.userName } : {}),
                });
              }
            }}
            onValueChange={({ items }) => {
              const company = items[0];
              if (company) {
                setNotFound(false);
                setCompanyName('');
                setInputValue(company.idn ?? '');
                onSignerChange?.({
                  ...emptySigner,
                  ...(initialSigner ? { userId: initialSigner.userId, email: initialSigner.email, userName: initialSigner.userName } : {}),
                  companyId: company.id,
                });
              }
            }}
            allowCustomValue
            openOnClick
            selectionBehavior="preserve"
            value={initialSigner?.companyId ? [initialSigner.companyId] : []}
            lazyMount
          >
            <Combobox.Control>
              <Combobox.Input placeholder={t`Введите ИНН/БИН компании`} />
              <Combobox.IndicatorGroup>
                {isFetching && <Spinner size="xs" />}
                <Combobox.ClearTrigger />
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Portal>
              <Combobox.Positioner>
                <Combobox.Content>
                  <For each={companies.items}>
                    {(company) => (
                      <Box key={company.id}>
                        <Combobox.Item
                          item={company}
                          _disabled={{ opacity: 1, color: 'inherit', cursor: 'default' }}
                        >
                          <Tooltip
                            content={t`Эта компания не принимает входящие договоры`}
                            disabled={!!company.acceptsIncomingDocuments}
                            positioning={{ placement: 'bottom-start', gutter: 4 }}
                            contentProps={{ zIndex: 'tooltip' }}
                          >
                            <VStack align="start" gap="0" flex="1" pointerEvents="all">
                              <Text fontWeight="600" fontSize="14" color={company.acceptsIncomingDocuments ? "gray.900" : "gray.400"}>{company.name}</Text>
                              <Text fontSize="13" color={company.acceptsIncomingDocuments ? "gray.600" : "gray.400"}>{company.idn}</Text>
                            </VStack>
                          </Tooltip>
                          <Combobox.ItemIndicator />
                        </Combobox.Item>
                      </Box>
                    )}
                  </For>
                  <Combobox.Empty>
                    <VStack align="start" gap="2" px="3" py="2">
                      <Text fontSize="13" color="gray.500">
                        <Trans>Компания не найдена.</Trans>
                      </Text>
                      <NotFoundAction />
                    </VStack>
                  </Combobox.Empty>
                </Combobox.Content>
              </Combobox.Positioner>
            </Portal>
          </Combobox.Root>
        </Field.Root>

        <Show when={!!initialSigner?.companyId}>
          <Box
            bg="bg.lightGray4"
            borderRadius="16px"
            p="12px"
            display="flex"
            alignItems="center"
            gap="16px"
            w="full"
          >
            <Avatar.Root
              size="lg"
              bg="linear-gradient(to bottom, #45d4f1, #7ae5c1)"
              border="4px solid rgba(255,255,255,0.54)"
            >
              <Avatar.Fallback>
                <Image
                  src={briefcaseIcon}
                  w="16px"
                  h="16px"
                  alt="Company"
                  filter="brightness(0) invert(1)"
                />
              </Avatar.Fallback>
            </Avatar.Root>

            <Box flex="1">
              <Text fontSize="14" fontWeight="700" color="gray.800" mb="2px">
                {selectedCompany?.name}
              </Text>
              <Text fontSize="13" color="gray.600">
                {selectedCompany?.idn}
              </Text>
            </Box>
          </Box>
        </Show>

        <Show when={notFound && !initialSigner?.companyId}>
          <Alert.Root status="warning" borderRadius="16px" bg="#FBEFDE" w="full" p="16px">
            <Alert.Indicator />
            <Alert.Description>
              <Trans>Компания не зарегистрирована в системе. Договор будет отправлен на электронную почту подписанта</Trans>
            </Alert.Description>
          </Alert.Root>
          <Field.Root>
            <Field.Label>
              <Trans>Наименование компании</Trans>
            </Field.Label>
            <Input
              placeholder=" "
              value={companyName}
              name="signer.companyName"
              onChange={handleCompanyNameChange}
            />
          </Field.Root>
        </Show>
      </VStack>
    </Box>
  );
};
