import Joi from 'joi';

export default Joi.object({
  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().port(),
  MINIO_SECURE: Joi.boolean().optional().default(false),
  MINIO_ACCESS_KEY: Joi.string().optional(),
  MINIO_SECRET_KEY: Joi.string().optional(),
  MINIO_BUCKET: Joi.string().required(),
});
