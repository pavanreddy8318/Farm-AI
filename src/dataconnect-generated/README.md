# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `default`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetUserCrops*](#getusercrops)
  - [*GetRecentDiagnoses*](#getrecentdiagnoses)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*AddChatMessage*](#addchatmessage)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `default`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetUserCrops
You can execute the `GetUserCrops` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserCrops(vars: GetUserCropsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserCropsData, GetUserCropsVariables>;

interface GetUserCropsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserCropsVariables): QueryRef<GetUserCropsData, GetUserCropsVariables>;
}
export const getUserCropsRef: GetUserCropsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserCrops(dc: DataConnect, vars: GetUserCropsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserCropsData, GetUserCropsVariables>;

interface GetUserCropsRef {
  ...
  (dc: DataConnect, vars: GetUserCropsVariables): QueryRef<GetUserCropsData, GetUserCropsVariables>;
}
export const getUserCropsRef: GetUserCropsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserCropsRef:
```typescript
const name = getUserCropsRef.operationName;
console.log(name);
```

### Variables
The `GetUserCrops` query requires an argument of type `GetUserCropsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserCropsVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `GetUserCrops` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserCropsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserCropsData {
  crops: ({
    name: string;
    variety: string;
  })[];
}
```
### Using `GetUserCrops`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserCrops, GetUserCropsVariables } from '@dataconnect/generated';

// The `GetUserCrops` query requires an argument of type `GetUserCropsVariables`:
const getUserCropsVars: GetUserCropsVariables = {
  userId: ..., 
};

// Call the `getUserCrops()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserCrops(getUserCropsVars);
// Variables can be defined inline as well.
const { data } = await getUserCrops({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserCrops(dataConnect, getUserCropsVars);

console.log(data.crops);

// Or, you can use the `Promise` API.
getUserCrops(getUserCropsVars).then((response) => {
  const data = response.data;
  console.log(data.crops);
});
```

### Using `GetUserCrops`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserCropsRef, GetUserCropsVariables } from '@dataconnect/generated';

// The `GetUserCrops` query requires an argument of type `GetUserCropsVariables`:
const getUserCropsVars: GetUserCropsVariables = {
  userId: ..., 
};

// Call the `getUserCropsRef()` function to get a reference to the query.
const ref = getUserCropsRef(getUserCropsVars);
// Variables can be defined inline as well.
const ref = getUserCropsRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserCropsRef(dataConnect, getUserCropsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.crops);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.crops);
});
```

## GetRecentDiagnoses
You can execute the `GetRecentDiagnoses` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRecentDiagnoses(vars: GetRecentDiagnosesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;

interface GetRecentDiagnosesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRecentDiagnosesVariables): QueryRef<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;
}
export const getRecentDiagnosesRef: GetRecentDiagnosesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRecentDiagnoses(dc: DataConnect, vars: GetRecentDiagnosesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;

interface GetRecentDiagnosesRef {
  ...
  (dc: DataConnect, vars: GetRecentDiagnosesVariables): QueryRef<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;
}
export const getRecentDiagnosesRef: GetRecentDiagnosesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRecentDiagnosesRef:
```typescript
const name = getRecentDiagnosesRef.operationName;
console.log(name);
```

### Variables
The `GetRecentDiagnoses` query requires an argument of type `GetRecentDiagnosesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetRecentDiagnosesVariables {
  limit: number;
}
```
### Return Type
Recall that executing the `GetRecentDiagnoses` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRecentDiagnosesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRecentDiagnosesData {
  diagnoses: ({
    diseaseName: string;
    confidenceScore: number;
    treatmentRecommendations?: string | null;
    crop: {
      name: string;
    };
  })[];
}
```
### Using `GetRecentDiagnoses`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRecentDiagnoses, GetRecentDiagnosesVariables } from '@dataconnect/generated';

// The `GetRecentDiagnoses` query requires an argument of type `GetRecentDiagnosesVariables`:
const getRecentDiagnosesVars: GetRecentDiagnosesVariables = {
  limit: ..., 
};

// Call the `getRecentDiagnoses()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRecentDiagnoses(getRecentDiagnosesVars);
// Variables can be defined inline as well.
const { data } = await getRecentDiagnoses({ limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRecentDiagnoses(dataConnect, getRecentDiagnosesVars);

console.log(data.diagnoses);

// Or, you can use the `Promise` API.
getRecentDiagnoses(getRecentDiagnosesVars).then((response) => {
  const data = response.data;
  console.log(data.diagnoses);
});
```

### Using `GetRecentDiagnoses`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRecentDiagnosesRef, GetRecentDiagnosesVariables } from '@dataconnect/generated';

// The `GetRecentDiagnoses` query requires an argument of type `GetRecentDiagnosesVariables`:
const getRecentDiagnosesVars: GetRecentDiagnosesVariables = {
  limit: ..., 
};

// Call the `getRecentDiagnosesRef()` function to get a reference to the query.
const ref = getRecentDiagnosesRef(getRecentDiagnosesVars);
// Variables can be defined inline as well.
const ref = getRecentDiagnosesRef({ limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRecentDiagnosesRef(dataConnect, getRecentDiagnosesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.diagnoses);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.diagnoses);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation requires an argument of type `CreateUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserVariables {
  email: string;
  name: string;
}
```
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser, CreateUserVariables } from '@dataconnect/generated';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  email: ..., 
  name: ..., 
};

// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser(createUserVars);
// Variables can be defined inline as well.
const { data } = await createUser({ email: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect, createUserVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser(createUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef, CreateUserVariables } from '@dataconnect/generated';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  email: ..., 
  name: ..., 
};

// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef(createUserVars);
// Variables can be defined inline as well.
const ref = createUserRef({ email: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect, createUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## AddChatMessage
You can execute the `AddChatMessage` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addChatMessage(vars: AddChatMessageVariables): MutationPromise<AddChatMessageData, AddChatMessageVariables>;

interface AddChatMessageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddChatMessageVariables): MutationRef<AddChatMessageData, AddChatMessageVariables>;
}
export const addChatMessageRef: AddChatMessageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addChatMessage(dc: DataConnect, vars: AddChatMessageVariables): MutationPromise<AddChatMessageData, AddChatMessageVariables>;

interface AddChatMessageRef {
  ...
  (dc: DataConnect, vars: AddChatMessageVariables): MutationRef<AddChatMessageData, AddChatMessageVariables>;
}
export const addChatMessageRef: AddChatMessageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addChatMessageRef:
```typescript
const name = addChatMessageRef.operationName;
console.log(name);
```

### Variables
The `AddChatMessage` mutation requires an argument of type `AddChatMessageVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddChatMessageVariables {
  sessionId: UUIDString;
  content: string;
}
```
### Return Type
Recall that executing the `AddChatMessage` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddChatMessageData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddChatMessageData {
  chatMessage_insert: ChatMessage_Key;
}
```
### Using `AddChatMessage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addChatMessage, AddChatMessageVariables } from '@dataconnect/generated';

// The `AddChatMessage` mutation requires an argument of type `AddChatMessageVariables`:
const addChatMessageVars: AddChatMessageVariables = {
  sessionId: ..., 
  content: ..., 
};

// Call the `addChatMessage()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addChatMessage(addChatMessageVars);
// Variables can be defined inline as well.
const { data } = await addChatMessage({ sessionId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addChatMessage(dataConnect, addChatMessageVars);

console.log(data.chatMessage_insert);

// Or, you can use the `Promise` API.
addChatMessage(addChatMessageVars).then((response) => {
  const data = response.data;
  console.log(data.chatMessage_insert);
});
```

### Using `AddChatMessage`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addChatMessageRef, AddChatMessageVariables } from '@dataconnect/generated';

// The `AddChatMessage` mutation requires an argument of type `AddChatMessageVariables`:
const addChatMessageVars: AddChatMessageVariables = {
  sessionId: ..., 
  content: ..., 
};

// Call the `addChatMessageRef()` function to get a reference to the mutation.
const ref = addChatMessageRef(addChatMessageVars);
// Variables can be defined inline as well.
const ref = addChatMessageRef({ sessionId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addChatMessageRef(dataConnect, addChatMessageVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.chatMessage_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.chatMessage_insert);
});
```

