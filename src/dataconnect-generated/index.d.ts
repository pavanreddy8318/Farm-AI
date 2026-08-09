import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddChatMessageData {
  chatMessage_insert: ChatMessage_Key;
}

export interface AddChatMessageVariables {
  sessionId: UUIDString;
  content: string;
}

export interface ChatMessage_Key {
  id: UUIDString;
  __typename?: 'ChatMessage_Key';
}

export interface ChatSession_Key {
  id: UUIDString;
  __typename?: 'ChatSession_Key';
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  email: string;
  name: string;
}

export interface Crop_Key {
  id: UUIDString;
  __typename?: 'Crop_Key';
}

export interface Diagnosis_Key {
  id: UUIDString;
  __typename?: 'Diagnosis_Key';
}

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

export interface GetRecentDiagnosesVariables {
  limit: number;
}

export interface GetUserCropsData {
  crops: ({
    name: string;
    variety: string;
  })[];
}

export interface GetUserCropsVariables {
  userId: UUIDString;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface GetUserCropsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserCropsVariables): QueryRef<GetUserCropsData, GetUserCropsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserCropsVariables): QueryRef<GetUserCropsData, GetUserCropsVariables>;
  operationName: string;
}
export const getUserCropsRef: GetUserCropsRef;

export function getUserCrops(vars: GetUserCropsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserCropsData, GetUserCropsVariables>;
export function getUserCrops(dc: DataConnect, vars: GetUserCropsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserCropsData, GetUserCropsVariables>;

interface AddChatMessageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddChatMessageVariables): MutationRef<AddChatMessageData, AddChatMessageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddChatMessageVariables): MutationRef<AddChatMessageData, AddChatMessageVariables>;
  operationName: string;
}
export const addChatMessageRef: AddChatMessageRef;

export function addChatMessage(vars: AddChatMessageVariables): MutationPromise<AddChatMessageData, AddChatMessageVariables>;
export function addChatMessage(dc: DataConnect, vars: AddChatMessageVariables): MutationPromise<AddChatMessageData, AddChatMessageVariables>;

interface GetRecentDiagnosesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRecentDiagnosesVariables): QueryRef<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetRecentDiagnosesVariables): QueryRef<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;
  operationName: string;
}
export const getRecentDiagnosesRef: GetRecentDiagnosesRef;

export function getRecentDiagnoses(vars: GetRecentDiagnosesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;
export function getRecentDiagnoses(dc: DataConnect, vars: GetRecentDiagnosesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentDiagnosesData, GetRecentDiagnosesVariables>;

