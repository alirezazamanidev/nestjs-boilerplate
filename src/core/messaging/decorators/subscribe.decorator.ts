import { SetMetadata } from '@nestjs/common';
import { SubscribeOptions } from '../interfaces';
import { SUBSCRIBE_METADATA, SUBSCRIBER_CLASS } from '../messaging.constants';
export interface SubscribeMetadata {
  topic: string;
  options?: SubscribeOptions;
}

export const Subscribe = (
  topic:string,
  options?: SubscribeOptions,
): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    if (typeof descriptor.value !== 'function')
      throw new Error('@Subscribe can only be applied to methods');
    SetMetadata(SUBSCRIBE_METADATA, {
      topic,
      options,
    })(descriptor.value);
    SetMetadata(SUBSCRIBER_CLASS, true)(
      target.constructor,
    );
  };
};
