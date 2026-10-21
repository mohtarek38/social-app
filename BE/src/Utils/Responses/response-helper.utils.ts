import { IFailedResponse, ISuccessReponse } from "../../Common/Interfaces/response.interface";
import { Response } from "express";

export function SuccessResponse<T>(message = "Your request was successful", status = 200, data?: T): ISuccessReponse {
  // Set HTML Response status code
  return { meta: { status, success: true }, data: { message, data } };
}

export function FailedResponse(message = "Your request failed", status = 500, error?: object): IFailedResponse {
  return { meta: { status, success: false }, error: { message, context: error } };
}
