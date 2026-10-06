declare module "uuid" {
  export function v4(): string;
  export function v1(): string;
  export function v3(): string;
  export function v5(): string;
}

declare module "express-fileupload" {
  import { RequestHandler } from "express";
  function fileUpload(options?: any): RequestHandler;
  export default fileUpload;
}
