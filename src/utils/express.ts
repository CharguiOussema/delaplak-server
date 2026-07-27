import type { Request, Response } from 'express';
type EmptyObject = Record<string, never>;

export type BaseRequest = Request<EmptyObject, EmptyObject, EmptyObject>;

export type RequestWithBody<T> = Request<EmptyObject, EmptyObject, T, EmptyObject>;

export type RequestWithQuery<T> = Request<EmptyObject, EmptyObject, EmptyObject, T>;

type StringKeys<T> = Extract<keyof T, string>;

type ExtractedKeys<T> = {
  [key in StringKeys<T>]: string;
};

export type RequestWithParams<T> = Request<ExtractedKeys<T>, EmptyObject, EmptyObject, EmptyObject>;

export type RequestWithParamsAndBody<P, B> = Request<ExtractedKeys<P>, EmptyObject, B, EmptyObject>;

export type RequestWithParamsAndQuery<P, Q> = Request<ExtractedKeys<P>, EmptyObject, EmptyObject, Q>;

export type ResponseWithBody<T> = Response<T, EmptyObject>;
