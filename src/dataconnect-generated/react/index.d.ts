import { CreateUserData, CreateUserVariables, GetUserCropsData, GetUserCropsVariables, AddChatMessageData, AddChatMessageVariables, GetRecentDiagnosesData, GetRecentDiagnosesVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useGetUserCrops(vars: GetUserCropsVariables, options?: useDataConnectQueryOptions<GetUserCropsData>): UseDataConnectQueryResult<GetUserCropsData, GetUserCropsVariables>;
export function useGetUserCrops(dc: DataConnect, vars: GetUserCropsVariables, options?: useDataConnectQueryOptions<GetUserCropsData>): UseDataConnectQueryResult<GetUserCropsData, GetUserCropsVariables>;

export function useAddChatMessage(options?: useDataConnectMutationOptions<AddChatMessageData, FirebaseError, AddChatMessageVariables>): UseDataConnectMutationResult<AddChatMessageData, AddChatMessageVariables>;
export function useAddChatMessage(dc: DataConnect, options?: useDataConnectMutationOptions<AddChatMessageData, FirebaseError, AddChatMessageVariables>): UseDataConnectMutationResult<AddChatMessageData, AddChatMessageVariables>;

export function useGetRecentDiagnoses(vars: GetRecentDiagnosesVariables, options?: useDataConnectQueryOptions<GetRecentDiagnosesData>): UseDataConnectQueryResult<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;
export function useGetRecentDiagnoses(dc: DataConnect, vars: GetRecentDiagnosesVariables, options?: useDataConnectQueryOptions<GetRecentDiagnosesData>): UseDataConnectQueryResult<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;
