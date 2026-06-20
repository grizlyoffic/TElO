import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ErrorResponse, ExecuteRequest, ExecuteResult, HealthStatus } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getExecuteCodeUrl: () => string;
/**
 * Runs a code snippet or shell command and returns stdout/stderr
 * @summary Execute code or shell command
 */
export declare const executeCode: (executeRequest: ExecuteRequest, options?: RequestInit) => Promise<ExecuteResult>;
export declare const getExecuteCodeMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof executeCode>>, TError, {
        data: BodyType<ExecuteRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof executeCode>>, TError, {
    data: BodyType<ExecuteRequest>;
}, TContext>;
export type ExecuteCodeMutationResult = NonNullable<Awaited<ReturnType<typeof executeCode>>>;
export type ExecuteCodeMutationBody = BodyType<ExecuteRequest>;
export type ExecuteCodeMutationError = ErrorType<ErrorResponse>;
/**
* @summary Execute code or shell command
*/
export declare const useExecuteCode: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof executeCode>>, TError, {
        data: BodyType<ExecuteRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof executeCode>>, TError, {
    data: BodyType<ExecuteRequest>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map