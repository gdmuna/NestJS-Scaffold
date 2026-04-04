import type { OpenAPIObject } from '@nestjs/swagger';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

type JsonContent = { schema?: Record<string, unknown> };
type ResponseEntry = { content?: Record<string, JsonContent> };
type OperationLike = { responses?: Record<string, ResponseEntry> };

/**
 * OpenAPI 文档后处理：将所有 2xx 成功响应包裹入统一包络格式。
 *
 * 包络结构与运行时 ResponseFormatInterceptor 输出保持一致：
 * ```json
 * { "success": true, "data": <DTO>, "timestamp": "...", "context": { ... } }
 * ```
 *
 * 在 `SwaggerModule.createDocument` 和 `cleanupOpenApiDoc` 之后、
 * `SwaggerModule.setup` 之前调用。
 */
export function wrapSuccessResponses(doc: OpenAPIObject): OpenAPIObject {
    for (const pathItem of Object.values(doc.paths ?? {})) {
        for (const method of HTTP_METHODS) {
            const operation = (pathItem as Record<string, unknown>)[method] as
                | OperationLike
                | undefined;
            if (!operation?.responses) continue;

            for (const [statusCode, response] of Object.entries(operation.responses)) {
                const status = parseInt(statusCode, 10);
                if (status < 200 || status >= 300) continue;

                const jsonContent = response?.content?.['application/json'];
                if (!jsonContent?.schema) continue;

                jsonContent.schema = buildEnvelopeSchema(jsonContent.schema);
            }
        }
    }

    return doc;
}

function buildEnvelopeSchema(dataSchema: Record<string, unknown>): Record<string, unknown> {
    return {
        type: 'object',
        required: ['success', 'data', 'timestamp', 'context'],
        properties: {
            success: {
                type: 'boolean',
                example: true,
                description: '操作结果标志',
            },
            data: dataSchema,
            timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2026-04-04T12:00:00.000Z',
                description: '响应时间戳（ISO 8601）',
            },
            context: {
                type: 'object',
                description: '请求上下文',
                required: ['requestId', 'time', 'version'],
                properties: {
                    requestId: {
                        type: 'string',
                        example: '01JXXXXXXXXXXXXXXX',
                        description: '请求唯一标识（ULID）',
                    },
                    time: {
                        type: 'number',
                        example: 1775314917599,
                        description: 'Unix 时间戳（ms）',
                    },
                    version: {
                        type: 'string',
                        example: '0.6.2',
                        description: '应用版本号',
                    },
                    metadata: {
                        type: 'object',
                        additionalProperties: true,
                        description: '额外上下文数据',
                    },
                },
            },
        },
    };
}
