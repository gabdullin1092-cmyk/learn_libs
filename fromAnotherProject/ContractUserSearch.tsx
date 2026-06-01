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
import { FC, useState, useCallback, ChangeEvent } from 'react';
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import briefcaseIcon from '@assets/icons/briefcase.svg';
import { components } from '@api/schema';
import { getCompanyUsersListFn } from "@features/company/functions";
import { getUsersListFn } from "@features/user/functions";

type ContractSignerInputDto = components['schemas']['ContractSignerInputDto'];
type UserShortResponse = components["schemas"]["UserShortResponse"];

type UserItem = { id: string; fullName: string; email: string };

type ContractUserSearchProps = {
  signer?: ContractSignerInputDto | null;
  onSignerChange?: (signer: ContractSignerInputDto) => void;
  user?: UserShortResponse | null;
};

export const ContractUserSearch: FC<ContractUserSearchProps> = ({ signer: initialSigner, onSignerChange, user: initialUser }) => {
  const { t } = useLingui();

  const [inputValue, setInputValue] = useState(initialUser?.email ?? initialSigner?.email ?? '');
  const [notFound, setNotFound] = useState(!!(initialSigner && !initialSigner.userId && (initialSigner.email || initialSigner.userName)));
  const [userName, setUserName] = useState(initialSigner?.userName ?? '');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const getCompanyUsersList = useServerFn(getCompanyUsersListFn);
  const getUsersList = useServerFn(getUsersListFn);

  const companyId = initialSigner?.companyId;

  const { data: companyUsersList, isFetching: isFetchingCompanyUsers } = useQuery({
    queryKey: ['companyUsersList', companyId],
    queryFn: () => getCompanyUsersList({ data: { id: companyId!, isSigner: true } }),
    enabled: !!companyId,
  });

  const { data: globalUsersList, isFetching: isFetchingGlobalUsers } = useQuery({
    queryKey: ['usersList', 'email', inputValue],
    queryFn: () => getUsersList({ data: { email: inputValue } }),
    enabled: !companyId && inputValue.length >= 3,
  });

  const userItems: UserItem[] = companyId
    ? (companyUsersList?.items ?? []).map((item) => ({
        id: item.userId ?? '',
        fullName: item.user?.fullName ?? '',
        email: item.user?.email ?? '',
      }))
    : (globalUsersList?.items ?? []).map((item) => ({
        id: item.id,
        fullName: item.fullName ?? '',
        email: item.email ?? '',
      }));

  const isFetching = isFetchingCompanyUsers || isFetchingGlobalUsers;

  const users = createListCollection({
    items: userItems,
    itemToString: (item) => item.email,
    itemToValue: (item) => item.id,
  });

  const handleUserNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setUserName(name);
    onSignerChange?.({
      companyId: initialSigner?.companyId ?? null,
      idn: initialSigner?.idn ?? null,
      companyName: initialSigner?.companyName ?? null,
      userId: null,
      email: inputValue || null,
      userName: name,
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
          companyId: initialSigner?.companyId ?? null,
          idn: initialSigner?.idn ?? null,
          companyName: initialSigner?.companyName ?? null,
          userId: null,
          email: inputValue,
          userName: userName || null,
        });
      }}
    >
      <Trans>Не нашли подписанта?</Trans>
    </Text>
  );

  return (
    <VStack w="full" align="start">
      <Text fontSize="16" fontWeight="600" color="gray.800" mb="12px">
        <Trans>Подписант</Trans>
      </Text>
      <Field.Root w="full">
        <Field.Label>
          <Trans>Подписант</Trans>
        </Field.Label>
        <Combobox.Root
          collection={users}
          inputValue={inputValue}
          onInputValueChange={({ inputValue }) => {
            setInputValue(inputValue);
            if (!inputValue) {
              setNotFound(false);
              setUserName('');
              setSelectedUser(null);
              onSignerChange?.({
                companyId: initialSigner?.companyId ?? null,
                idn: initialSigner?.idn ?? null,
                companyName: initialSigner?.companyName ?? null,
                userId: null,
                email: null,
                userName: null,
              });
            }
          }}
          onValueChange={({ items }) => {
            const user = items[0];
            if (user) {
              setNotFound(false);
              setUserName('');
              setInputValue(user.email);
              setSelectedUser(user);
              onSignerChange?.({
                companyId: initialSigner?.companyId ?? null,
                idn: initialSigner?.idn ?? null,
                companyName: initialSigner?.companyName ?? null,
                userId: user.id,
                email: null,
                userName: null,
              });
            }
          }}
          allowCustomValue
          openOnClick
          selectionBehavior="preserve"
          value={initialSigner?.userId ? [initialSigner.userId] : []}
          placeholder={t`Введите email для поиска`}
          lazyMount
        >
          <Combobox.Control>
            <Combobox.Input />
            <Combobox.IndicatorGroup>
              {isFetching && <Spinner size="xs" />}
              <Combobox.ClearTrigger />
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                <Show when={!!users.items.length}>
                  <Box px="3" py="1" borderBottomWidth="1px" borderColor="gray.100">
                    <NotFoundAction />
                  </Box>
                </Show>
                <For each={users.items}>
                  {(user) => (
                    <Combobox.Item key={user.id} item={user}>
                      <VStack align="start" gap="0">
                        <Text fontWeight="600" fontSize="14">{user.fullName}</Text>
                        <Text fontSize="13" color="gray.600">{user.email}</Text>
                      </VStack>
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  )}
                </For>
                <Combobox.Empty>
                  <Text fontSize="13" color="gray.500"><Trans>Введите email для поиска</Trans></Text>
                  <NotFoundAction />
                </Combobox.Empty>
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      </Field.Root>

      <Show when={!!initialSigner?.userId}>
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
                alt="User"
                filter="brightness(0) invert(1)"
              />
            </Avatar.Fallback>
          </Avatar.Root>

          <Box flex="1">
            <Text fontSize="14" fontWeight="700" color="gray.800" mb="2px">
              {initialUser?.fullName ?? selectedUser?.fullName ?? initialSigner?.userName}
            </Text>
            <Text fontSize="13" color="gray.600">
              {initialUser?.email ?? selectedUser?.email ?? inputValue}
            </Text>
          </Box>
        </Box>
      </Show>

      <Show when={notFound && !initialSigner?.userId}>
        <Alert.Root status="warning" borderRadius="16px" bg="#FBEFDE" w="full" p="16px">
          <Alert.Indicator />
          <Alert.Description>
            <Trans>Пользователь не зарегистрирован в системе. Договор будет отправлен на электронную почту подписанта</Trans>
          </Alert.Description>
        </Alert.Root>
        <Field.Root>
          <Field.Label>
            <Trans>ФИО подписанта</Trans>
          </Field.Label>
          <Input
            placeholder=" "
            value={userName}
            name="signer.userName"
            onChange={handleUserNameChange}
          />
        </Field.Root>
      </Show>
    </VStack>
  );
};
