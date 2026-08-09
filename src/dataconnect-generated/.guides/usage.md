# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateUser, useGetUserCrops, useAddChatMessage, useGetRecentDiagnoses } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateUser(createUserVars);

const { data, isPending, isSuccess, isError, error } = useGetUserCrops(getUserCropsVars);

const { data, isPending, isSuccess, isError, error } = useAddChatMessage(addChatMessageVars);

const { data, isPending, isSuccess, isError, error } = useGetRecentDiagnoses(getRecentDiagnosesVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, getUserCrops, addChatMessage, getRecentDiagnoses } from '@dataconnect/generated';


// Operation CreateUser:  For variables, look at type CreateUserVars in ../index.d.ts
const { data } = await CreateUser(dataConnect, createUserVars);

// Operation GetUserCrops:  For variables, look at type GetUserCropsVars in ../index.d.ts
const { data } = await GetUserCrops(dataConnect, getUserCropsVars);

// Operation AddChatMessage:  For variables, look at type AddChatMessageVars in ../index.d.ts
const { data } = await AddChatMessage(dataConnect, addChatMessageVars);

// Operation GetRecentDiagnoses:  For variables, look at type GetRecentDiagnosesVars in ../index.d.ts
const { data } = await GetRecentDiagnoses(dataConnect, getRecentDiagnosesVars);


```