import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const HTTP_MESSAGE_KEY = 'http-message';

/**
 * Set custom message for http response object.
 *
 * The message set by this decorator will be picked up by the
 * `ResponseInterceptors` and added to the standardized HTTP response.
 *
 * @param message - The custom message
 * @returns {CustomDecorator<string>}
 */
export const HttpMessage = (message: string): CustomDecorator<string> =>
    SetMetadata(HTTP_MESSAGE_KEY, message);
